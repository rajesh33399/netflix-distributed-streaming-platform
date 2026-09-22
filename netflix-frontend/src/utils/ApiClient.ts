import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * Single Axios instance pointed at the Spring Cloud API Gateway edge.
 *
 * AUTH MODEL: `withCredentials: true` means the JWT lives in an httpOnly
 * cookie set by the gateway on login, not in localStorage or Redux state.
 * This is a deliberate deviation from the typical NetflixGPT-tutorial
 * pattern of storing the raw token client-side — an httpOnly cookie can't
 * be read by injected/third-party JS, which matters once you're proxying
 * arbitrary GPT search queries through the same origin.
 *
 * If your gateway currently issues the JWT in the response body instead of
 * a Set-Cookie header, that's a gateway-side change this frontend assumes
 * has been made. Without it, swap this back to an Authorization header
 * interceptor and accept the XSS tradeoff explicitly — don't do it silently.
 */
export const apiClient = axios.create({
  // TWEAK: Points to your Java Content/Gateway port 8082 by default if env is missing
  baseURL: import.meta.env.VITE_GATEWAY_URL ?? "http://localhost:8082",
  withCredentials: true,
  timeout: 15000,
});

/** Called by userSlice when the gateway rejects a request as unauthenticated. */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler) {
  onUnauthorized = handler;
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Cookie expired or was never valid — clear client state rather than
      // letting every caller independently guess what a 401 means.
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export function isAxiosError(err: unknown): err is AxiosError {
  return axios.isAxiosError(err);
}

// Re-exported only for call sites that need to type a request config directly.
export type { InternalAxiosRequestConfig };
