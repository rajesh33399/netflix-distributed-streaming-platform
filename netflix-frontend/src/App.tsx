import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "./Hooks";
import { hydrateSession } from "./slices/UserSlice";
import GptSearchBar from "./components/GptSearchBar";
import GptMovieGrid from "./components/GptMovieGrid";
import UnifiedPlaybackEngine from "./components/UnifiedPlaybackEngine";
import type { Movie } from "./types/Movie";

export default function App() {
  const dispatch = useAppDispatch();
  const { isAuthenticated, hydrationStatus } = useAppSelector((state) => state.user);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // 1. Check if the browser has an active valid cookie session on app startup
  useEffect(() => {
    dispatch(hydrateSession());
  }, [dispatch]);

  if (hydrationStatus === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#141414] text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white select-none antialiased">
      {/* Dynamic Header Bar Navigation */}
      <nav className="fixed top-0 z-40 w-full bg-gradient-to-b from-black/80 to-transparent p-6 transition-all duration-300">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <span className="text-3xl font-black tracking-wider text-red-600">NETFLIX</span>
          <div className="text-xs font-mono text-zinc-500 bg-black/40 px-3 py-1 rounded-full border border-zinc-800">
            System Node: <span className="text-emerald-500 font-bold">Secure Gateway Connected</span>
          </div>
        </div>
      </nav>

      {/* Main Feature Interface Container Panel */}
      <main className="pt-32 max-w-7xl mx-auto px-4 space-y-8 pb-24">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">Explore with AI</h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">
            Discover catalog media segments securely routed through distributed Java microservice pipelines.
          </p>
        </div>

        {/* Renders the custom search input interface block */}
        <GptSearchBar />

        {/* Renders the horizontal responsive streaming catalog results */}
        <GptMovieGrid onSelectMovie={(movie) => setSelectedMovie(movie)} />
      </main>

      {/* DETACHABLE LIFECYCLE PLAYER CONTAINER PORT */}
      {selectedMovie && (
        <UnifiedPlaybackEngine 
          movie={selectedMovie} 
          onClose={() => setSelectedMovie(null)} 
        />
      )}
    </div>
  );
}
