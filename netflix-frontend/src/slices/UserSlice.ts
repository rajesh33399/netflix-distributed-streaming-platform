import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import { apiClient, isAxiosError, registerUnauthorizedHandler } from "../utils/ApiClient"; // INTEGRATION: Fixed folder path case references
import type { AsyncStatus } from "../types/Movie"; // INTEGRATION: Capitalized Movie type path matching your file

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
}

interface UserState {
  profile: UserProfile | null;
  isAuthenticated: boolean;
  /** "loading" only during the initial session check on app mount, not per-request. */
  hydrationStatus: AsyncStatus;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  isAuthenticated: false,
  hydrationStatus: "idle",
  error: null,
};

/**
 * Hydrates auth state from the httpOnly cookie on app load. Redux state is
 * memory-only and resets on refresh — this is the step that reconciles
 * "does the browser actually have a valid session" with "does the UI think
 * it does." Call this once from your root layout/_app before rendering
 * anything gated on `isAuthenticated`.
 */
export const hydrateSession = createAsyncThunk<UserProfile, void, { rejectValue: string }>(
  "user/hydrateSession",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.get<UserProfile>("/api/v1/auth/me");
      return data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        // Expected case: no session yet. Not an error worth surfacing to the UI.
        return rejectWithValue("NO_SESSION");
      }
      return rejectWithValue("Failed to verify session");
    }
  }
);

export const login = createAsyncThunk<UserProfile, { email: string; password: string }, { rejectValue: string }>(
  "user/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await apiClient.post<UserProfile>("/api/v1/auth/login", credentials);
      return data;
    } catch {
      return rejectWithValue("Invalid email or password");
    }
  }
);

export const logout = createAsyncThunk("user/logout", async () => {
  await apiClient.post("/api/v1/auth/logout");
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    // Purely local reset — used by the apiClient 401 interceptor below,
    // which cannot dispatch a thunk directly without a circular import.
    sessionExpired(state) {
      state.profile = null;
      state.isAuthenticated = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateSession.pending, (state) => {
        state.hydrationStatus = "loading";
      })
      .addCase(hydrateSession.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.hydrationStatus = "succeeded";
        state.profile = action.payload;
        state.isAuthenticated = true;
      })
      .addCase(hydrateSession.rejected, (state) => {
        state.hydrationStatus = "failed";
        state.profile = null;
        state.isAuthenticated = false;
      })
      .addCase(login.fulfilled, (state, action: PayloadAction<UserProfile>) => {
        state.profile = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload ?? "Login failed";
      })
      .addCase(logout.fulfilled, (state) => {
        state.profile = null;
        state.isAuthenticated = false;
      });
  },
});

export const { sessionExpired } = userSlice.actions;
export default userSlice.reducer;

/**
 * Wire the apiClient's 401 handler to this slice's reset action. Call once,
 * e.g. in netflixStore.ts right after the store is created, passing
 * `store.dispatch`.
 */
export function connectUnauthorizedHandler(dispatch: (action: unknown) => void) {
  registerUnauthorizedHandler(() => dispatch(sessionExpired()));
}
