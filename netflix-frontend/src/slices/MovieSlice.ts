import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient } from "../utils/ApiClient"; // INTEGRATION: Fixed path reference to your custom ApiClient
import type { Movie, AsyncStatus, MediaSource } from "../types/Movie"; // INTEGRATION: Capitalized Movie type path matching your file

export type MovieCategory = "nowPlaying" | "topRated" | "aiRecommendations";

interface CategoryRow {
  items: Movie[];
  status: AsyncStatus;
  error: string | null;
}

type MoviesState = Record<MovieCategory, CategoryRow>;

function emptyRow(): CategoryRow {
  return { items: [], status: "idle", error: null };
}

const initialState: MoviesState = {
  nowPlaying: emptyRow(),
  topRated: emptyRow(),
  // aiRecommendations is populated by gptSlice's resolved results being
  // copied over on success, not fetched independently here — see
  // gptSlice.searchWithGpt.fulfilled and the store subscription note there.
  aiRecommendations: emptyRow(),
};

/**
 * Raw shape returned by /api/v1/catalog/{category}. Mapped into `Movie`
 * below rather than trusted as-is, since the backend response and the
 * frontend's namespaced-id contract are two different concerns.
 */
interface CatalogApiItem {
  id: string | number;
  source: MediaSource;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  hlsPlaylistUrl: string | null;
  trailerYoutubeKey: string | null;
  releaseDate?: string;
  voteAverage?: number;
}

function toMovie(raw: CatalogApiItem): Movie {
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
    releaseDate: raw.releaseDate,
    voteAverage: raw.voteAverage,
  };
}

export const fetchCategory = createAsyncThunk<
  { category: MovieCategory; movies: Movie[] },
  MovieCategory,
  { rejectValue: string }
>("movies/fetchCategory", async (category, { rejectWithValue }) => {
  try {
    const { data } = await apiClient.get<CatalogApiItem[]>(`/api/v1/catalog/${category}`);
    return { category, movies: data.map(toMovie) };
  } catch {
    return rejectWithValue(`Failed to load ${category}`);
  }
});

const moviesSlice = createSlice({
  name: "movies",
  initialState,
  reducers: {
    setAiRecommendations(state, action: PayloadAction<Movie[]>) {
      state.aiRecommendations.items = action.payload;
      state.aiRecommendations.status = "succeeded";
      state.aiRecommendations.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCategory.pending, (state, action) => {
        state[action.meta.arg].status = "loading";
      })
      .addCase(fetchCategory.fulfilled, (state, action) => {
        const row = state[action.payload.category];
        row.status = "succeeded";
        row.items = action.payload.movies;
        row.error = null;
      })
      .addCase(fetchCategory.rejected, (state, action) => {
        const row = state[action.meta.arg];
        row.status = "failed";
        row.error = action.payload ?? "Unknown error";
      });
  },
});

export const { setAiRecommendations } = moviesSlice.actions;
export default moviesSlice.reducer;
