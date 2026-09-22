/**
 * Hybrid media type shared across local (Java backend) and TMDB-sourced content.
 *
 * DESIGN NOTE: `id` is intentionally NOT the raw database/TMDB id. Both systems
 * hand out integer ids independently, so `localId: 550` and `tmdbId: 550` can
 * refer to two completely different titles. Every id that enters Redux state
 * or a React `key` prop is namespaced as `${source}-${originalId}` to make
 * collisions structurally impossible instead of "unlikely."
 */

export type MediaSource = "local" | "tmdb";

export interface Movie {
  /** Namespaced, globally-unique id: e.g. "local-482" or "tmdb-550". Use this for React keys and cache lookups. */
  id: string;
  /** The raw id as returned by the origin system — needed when calling back into that system's API. */
  originalId: string | number;
  /** Which system this record actually came from. Drives the playback/fallback decision tree. */
  source: MediaSource;

  title: string;
  overview: string;

  /** TMDB-style relative path (e.g. "/abc123.jpg"), or a full URL if your gateway proxies/rewrites TMDB images. Null if no artwork exists. */
  posterPath: string | null;
  backdropPath: string | null;

  /**
   * Short-lived, signed manifest URL issued by the gateway for locally-hosted content.
   * NEVER cache this value beyond the current session/render — treat it as a
   * capability token, not a stable resource identifier. If your gateway isn't
   * issuing expiring URLs yet, that needs to change before shipping this;
   * a static URL leaked from the network tab bypasses the JWT gateway entirely.
   */
  hlsPlaylistUrl: string | null;

  /** TMDB YouTube trailer key, used only when hlsPlaylistUrl is null. */
  trailerYoutubeKey: string | null;

  releaseDate?: string;
  voteAverage?: number;
}

/**
 * Raw suggestion coming back from the LLM search endpoint, BEFORE it has been
 * resolved into a full Movie object. The AI search step returns titles/ideas,
 * not catalog records — resolving each of these into a `Movie` is a distinct,
 * separate network step (see gptSlice.ts).
 */
export interface GptSuggestion {
  title: string;
  /** Optional short rationale from the model, shown as a caption if present. */
  reason?: string;
}

export type AsyncStatus = "idle" | "loading" | "succeeded" | "failed";
