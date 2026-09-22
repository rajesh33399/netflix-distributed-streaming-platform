import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";
import type { RootState, AppDispatch } from "./NetflixStore";

/**
 * Custom React-Redux hooks bound to your specific state definitions.
 * 
 * By using these instead of standard loose hooks, TypeScript guarantees
 * that whatever slice data you read or actions you dispatch are 100% type-safe.
 */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
