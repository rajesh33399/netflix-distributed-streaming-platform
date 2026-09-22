"use client";

import type { Movie } from "../types/Movie"; // INTEGRATION: Fixed capitalized file type path reference
import { useAppSelector } from "../Hooks"; // INTEGRATION: Pointing directly to your root type-safe hooks wrapper

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

interface GptMovieGridProps {
  onSelectMovie: (movie: Movie) => void;
}

function SkeletonCard() {
  return (
    <div className="aspect-[2/3] w-full animate-pulse rounded-md bg-neutral-800" />
  );
}

function MovieCard({ movie, onSelect }: { movie: Movie; onSelect: (m: Movie) => void }) {
  const canPlay = Boolean(movie.hlsPlaylistUrl || movie.trailerYoutubeKey);

  return (
    <button
      type="button"
      onClick={() => onSelect(movie)}
      disabled={!canPlay}
      className="group relative aspect-[2/3] w-full overflow-hidden rounded-md bg-neutral-900 text-left transition focus:outline-none focus:ring-2 focus:ring-red-600 disabled:cursor-not-allowed"
      aria-label={`${movie.title}${canPlay ? "" : " (preview unavailable)"}`}
    >
      {movie.posterPath ? (
        <img
          src={`${TMDB_IMAGE_BASE}${movie.posterPath}`}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-200 group-hover:scale-105 group-disabled:grayscale"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-neutral-800 px-3 text-center text-sm text-neutral-500">
          {movie.title}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-2">
        <p className="truncate text-sm font-medium text-white">{movie.title}</p>
        {!canPlay && <p className="text-xs text-neutral-400">Preview unavailable</p>}
      </div>
    </button>
  );
}

export default function GptMovieGrid({ onSelectMovie }: GptMovieGridProps) {
  const { status, results, unresolvedTitles, error } = useAppSelector((state) => state.gpt);

  if (status === "idle") {
    return null;
  }

  if (status === "loading") {
    return (
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (status === "failed") {
    return (
      <div className="mx-4 rounded-md border border-red-900 bg-red-950/40 p-4 text-red-200">
        {error ?? "Something went wrong with that search."}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="mx-4 rounded-md border border-neutral-800 bg-neutral-900 p-6 text-center text-neutral-400">
        No matches for that search. Try describing the plot, mood, or a similar title instead.
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {results.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onSelect={onSelectMovie} />
        ))}
      </div>
      {unresolvedTitles.length > 0 && (
        <p className="px-1 text-xs text-neutral-500">
          {unresolvedTitles.length} suggestion{unresolvedTitles.length > 1 ? "s" : ""} couldn't be matched to a
          title in the catalog: {unresolvedTitles.join(", ")}
        </p>
      )}
    </div>
  );
}
