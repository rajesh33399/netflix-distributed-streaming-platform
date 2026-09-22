"use client";

import { useState, useCallback, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../Hooks"; // INTEGRATION: Pointing directly to your root type-safe hooks file
import { searchWithGpt, setQuery, clearResults } from "../slices/GptSlice"; // INTEGRATION: Fixed path reference to your custom GptSlice

export default function GptSearchBar() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.gpt.status);
  const [localValue, setLocalValue] = useState("");

  const isLoading = status === "loading";

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = localValue.trim();
      if (!trimmed) return;

      dispatch(setQuery(trimmed));
      dispatch(searchWithGpt(trimmed));
    },
    [dispatch, localValue]
  );

  const handleClear = useCallback(() => {
    setLocalValue("");
    dispatch(clearResults());
  }, [dispatch]);

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-2xl items-center gap-2 rounded-lg bg-black/60 p-2 backdrop-blur-sm"
      role="search"
      aria-label="AI movie discovery search"
    >
      <label htmlFor="gpt-search-input" className="sr-only">
        Describe what you want to watch
      </label>
      <input
        id="gpt-search-input"
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder="A tense heist movie with a twist ending..."
        disabled={isLoading}
        className="flex-1 rounded-md border border-white/10 bg-neutral-900 px-4 py-3 text-white placeholder-neutral-500 outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600 disabled:opacity-60"
      />
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          disabled={isLoading}
          className="rounded-md px-3 py-3 text-sm text-neutral-400 hover:text-white disabled:opacity-40"
          aria-label="Clear search"
        >
          Clear
        </button>
      )}
      <button
        type="submit"
        disabled={isLoading || !localValue.trim()}
        className="flex items-center gap-2 rounded-md bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-900 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <span
              className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"
              aria-hidden="true"
            />
            Searching
          </>
        ) : (
          "Search"
        )}
      </button>
    </form>
  );
}
