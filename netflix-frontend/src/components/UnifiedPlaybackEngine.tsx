"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type Hls from "hls.js";
import type { ErrorData, Level } from "hls.js";
import type { Movie } from "../types/Movie";

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/original";
const STREAMING_SERVICE_API = "http://localhost:8084"; // Your Java Streaming Port

interface UnifiedPlaybackEngineProps {
  movie: Movie;
  onClose: () => void;
}

type PlaybackMode = "hls" | "trailer" | "unavailable";

function resolveMode(movie: Movie): PlaybackMode {
  if (movie.hlsPlaylistUrl) return "hls";
  if (movie.trailerYoutubeKey) return "trailer";
  return "unavailable";
}

export default function UnifiedPlaybackEngine({ movie, onClose }: UnifiedPlaybackEngineProps) {
  const [mode, setMode] = useState<PlaybackMode>(() => resolveMode(movie));
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevel, setCurrentLevel] = useState<number>(-1); // -1 = auto
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const degradeToNextMode = useCallback(() => {
    setPlaybackError(null);
    setMode((current) => {
      if (current === "hls") {
        return movie.trailerYoutubeKey ? "trailer" : "unavailable";
      }
      return "unavailable";
    });
  }, [movie.trailerYoutubeKey]);

  useEffect(() => {
    setMode(resolveMode(movie));
    setPlaybackError(null);
    setLevels([]);
    setCurrentLevel(-1);
  }, [movie]);

  useEffect(() => {
    if (mode !== "hls" || !videoRef.current || !movie.hlsPlaylistUrl) return;

    const video = videoRef.current;
    let cancelled = false;

    // Dynamically lazy-load the heavy streaming compiler library inside the client effect block
    import("hls.js").then(({ default: HlsCtor }) => {
      if (cancelled) return;

      if (!HlsCtor.isSupported()) {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = movie.hlsPlaylistUrl!;
        } else {
          setPlaybackError("HLS adaptive streaming isn't natively supported in this browser.");
          degradeToNextMode();
        }
        return;
      }

      // INTEGRATION: Instantiate Hls with your custom proxy authentication layer
      const hls = new HlsCtor({ 
        enableWorker: true,
        maxBufferLength: 30, // Caps browser video segment cache thresholds safely
        xhrSetup: (xhr, url) => {
          // Intercept unsigned segment and manifest chunks to proxy-sign them securely via Java
          if (url.includes('.m3u8') && !url.includes('X-Amz')) {
            const encodedPath = encodeURIComponent(url.split('://')[1] || url);
            xhr.open('GET', `${STREAMING_SERVICE_API}/api/v1/stream/${movie.originalId}/playlist?path=${encodedPath}`);
          }
        }
      });

      hlsRef.current = hls;
      hls.loadSource(movie.hlsPlaylistUrl!);
      hls.attachMedia(video);

      hls.on(HlsCtor.Events.MANIFEST_PARSED, (_event, data) => {
        if (cancelled) return;
        setLevels(data.levels);
        video.play().catch(() => {
          /* Intercept blocked browser autoplay flags gracefully */
        });
      });

      hls.on(HlsCtor.Events.ERROR, (_event, data: ErrorData) => {
        if (!data.fatal || cancelled) return;

        switch (data.type) {
          case HlsCtor.ErrorTypes.NETWORK_ERROR:
            console.warn("Transient network block detected. Triggering chunk pipeline load retry...");
            hls.startLoad();
            break;
          case HlsCtor.ErrorTypes.MEDIA_ERROR:
            console.warn("Corrupted frame buffer block detected. Forcing stream recovery sync...");
            hls.recoverMediaError();
            break;
          default:
            setPlaybackError("Media pipeline connection lost.");
            degradeToNextMode();
        }
      });
    });

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy(); // CRITICAL FIX: Explicitly drops memory hooks on component exit
        hlsRef.current = null;
        console.log("🧹 System Memory Cleanup: Active media engine reference dropped successfully.");
      }
    };
  }, [mode, movie, degradeToNextMode]);

  const selectLevel = useCallback((levelIndex: number) => {
    if (!hlsRef.current) return;
    hlsRef.current.currentLevel = levelIndex;
    setCurrentLevel(levelIndex);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-6 top-6 z-10 rounded-full bg-zinc-900 border border-zinc-800 p-3 text-white hover:bg-zinc-800 transition font-bold"
        aria-label="Close player"
      >
        ✕ Close
      </button>

      <div className="relative aspect-video w-full max-w-5xl shadow-2xl rounded-lg overflow-hidden border border-zinc-800 bg-black">
        {mode === "hls" && (
          <>
            <video ref={videoRef} controls className="h-full w-full bg-black" />
            
            {/* MANUAL QUALITY SELECTOR GRID BUTTONS */}
            {levels.length > 1 && (
              <div className="absolute bottom-16 right-4 flex gap-1.5 rounded-md bg-black/80 p-1.5 border border-zinc-800/80 z-20">
                <button
                  type="button"
                  onClick={() => selectLevel(-1)}
                  className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                    currentLevel === -1 ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Auto
                </button>
                {levels.map((level, i) => (
                  <button
                    key={`${level.height}-${i}`}
                    type="button"
                    onClick={() => selectLevel(i)}
                    className={`rounded px-2.5 py-1 text-xs font-bold transition ${
                      currentLevel === i ? "bg-red-600 text-white" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {level.height}p
                  </button>
                ))}
              </div>
            )}
            {playbackError && (
              <p className="absolute left-4 top-4 rounded bg-red-950/80 border border-red-900/40 px-3 py-1.5 text-xs font-mono text-red-200">
                {playbackError}
              </p>
            )}
          </>
        )}

        {mode === "trailer" && movie.trailerYoutubeKey && (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${movie.trailerYoutubeKey}?autoplay=1`}
            title={`${movie.title} trailer`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}

        {mode === "unavailable" && (
          <div
            className="flex h-full w-full flex-col items-center justify-center gap-3 bg-neutral-950 bg-cover bg-center text-center p-6"
            style={
              movie.backdropPath
                ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.75), rgba(0,0,0,0.9)), url(${TMDB_IMAGE_BASE}${movie.backdropPath})` }
                : undefined
            }
          >
            <p className="text-xl font-black text-white tracking-tight">{movie.title}</p>
            <p className="text-xs text-neutral-400 max-w-sm">
              No continuous stream manifest or visual preview properties are available for this asset title yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
