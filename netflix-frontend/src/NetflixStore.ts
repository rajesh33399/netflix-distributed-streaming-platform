import { configureStore } from "@reduxjs/toolkit";
import userReducer, { connectUnauthorizedHandler } from "./slices/UserSlice"; // INTEGRATION: Fixed folder path case references
import moviesReducer from "./slices/MoviesSlice";
import gptReducer from "./slices/GptSlice";

export const netflixStore = configureStore({
  reducer: {
    user: userReducer,
    movies: moviesReducer,
    gpt: gptReducer,
  },
});

// SYSTEM HUB LINK: Bypasses circular dependency locks between Axios network layer and slices
connectUnauthorizedHandler(netflixStore.dispatch);

export type RootState = ReturnType<typeof netflixStore.getState>;
export type AppDispatch = typeof netflixStore.dispatch;
