"use client";

import { useAuthContext } from "./AuthContext";

/**
 * useAuth hook (Refactored to use AuthContext)
 * Consumes the centralized AuthProvider state to avoid race conditions
 * and ensure a single source of truth across all components.
 */
export function useAuth() {
    return useAuthContext();
}
