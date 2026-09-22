import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../utils/ApiClient"; // INTEGRATION: Fixed file case path to your custom client
import type { Movie, GptSuggestion, AsyncStatus, MediaSource } from "../types/Movie"; // INTEGRATION: Fixed capitalized type file case path

interface GptState {
  query: string;
  status: AsyncStatus;
  results: Movie[];
  /** Titles the model suggested that couldn't be resolved to a real record — surfaced so the UI can be honest about it instead of silently dropping them. */
  unresolvedTitles: string[];
  error: string | null;
}

const initialState: GptState = {
  query: "",
  status: "idle",
  results: [],
  unresolvedTitles: [],
  error: null,
};

interface ResolveApiItem {
  id: string | number;
  source: MediaSource;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  hlsPlaylistUrl: string | null;
  trailerYoutubeKey: string | null;
}

function toMovie(raw: ResolveApiItem): Movie {
  return {
    id: `${raw.source}-${raw.id}`,
    originalId: raw.id,
    source: raw.source,
    title: raw.title,
    overview: raw.overview,
    posterPath: raw.posterPath,
    backdropPath: raw.backdropPath,
    hlsPlaylistUrl: raw.hlsPlaylistUrl,
    trailerYoutubeKey: raw.trailerYoutubeKey,
  };
}

/**
 * TWO NETWORK HOPS, not one:
 *   1. POST /api/v1/search/gpt        -> free-text titles/reasoning from the LLM
 *   2. GET  /api/v1/catalog/resolve   -> per-title lookup (checks local DB first, TMDB second)
 *
 * The spec as written implied a single round trip ("dispatches ... passing
 * the text query ... to my Java gateway" -> grid renders). An LLM does not
 * return poster paths or hlsPlaylistUrls, so step 2 is not optional — without
 * it GptMovieGrid has nothing but titles to render.
 *
 * Resolution failures are isolated per-title with allSettled so one bad
 * suggestion doesn't fail the whole search.
 */
export const searchWithGpt = createAsyncThunk<
  { results: Movie[]; unresolvedTitles: string[] },
  string,
  { rejectValue: string }
>("gpt/searchWithGpt", async (query, { rejectWithValue }) => {
  let suggestions: GptSuggestion[];
  try {
    const { data } = await apiClient.post<{ suggestions: GptSuggestion[] }>("/api/v1/search/gpt", { query });
    suggestions = data.suggestions;
  } catch {
    return rejectWithValue("AI search is unavailable right now. Try again in a moment.");
  }

  if (suggestions.length === 0) {
    return { results: [], unresolvedTitles: [] };
  }

  const resolutions = await Promise.allSettled(
    suggestions.map((s) =>
      apiClient
        .get<ResolveApiItem>("/api/v1/catalog/resolve", { params: { title: s.title } })
        .then((res) => res.data)
    )
  );

  const results: Movie[] = [];
  const unresolvedTitles: string[] = [];

  resolutions.forEach((outcome, i) => {
    if (outcome.status === "fulfilled") {
      results.push(toMovie(outcome.value));
    } else {
      unresolvedTitles.push(suggestions[i].title);
    }
  });

  return { results, unresolvedTitles };
});

const gptSlice = createSlice({
  name: "gpt",
  initialState,
  reducers: {
    setQuery(state, action: PayloadAction<string>) {
      state.query = action.payload;
    },
    clearResults(state) {
      state.results = [];
      state.unresolvedTitles = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchWithGpt.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(searchWithGpt.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.results = action.payload.results;
        state.unresolvedTitles = action.payload.unresolvedTitles;
      })
      .addCase(searchWithGpt.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Search failed";
      });
  },
});

export const { setQuery, clearResults } = gptSlice.actions;
export default gptSlice.reducer;
