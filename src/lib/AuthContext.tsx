"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { ADMIN_EMAILS } from "./constants";
import { useRouter } from "next/navigation";

export interface AuthUser {
    name: string;
    email: string;
    isLoggedIn: boolean;
    theme?: string;
    avatar?: string;
    avatarImage?: string;
    joinedAt?: string;
}

interface AuthContextType {
    user: AuthUser | null;
    hasMounted: boolean;
    logout: () => void;
    confirmLogout: () => void;
    updateProfile: (updates: Partial<AuthUser>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [hasMounted, setHasMounted] = useState(false);
    const isFirstRun = useRef(true);

    const checkAuth = () => {
        if (typeof window === "undefined") return null;
        const sessionString = localStorage.getItem("user_session");
        if (sessionString) {
            try {
                const parsedSession = JSON.parse(sessionString);
                if (parsedSession && parsedSession.isLoggedIn) {
                    return parsedSession;
                }
            } catch (e) {
                console.error("Error parsing user_session", e);
            }
        }
        return null;
    };

    // COMBINED AUTH INITIALIZATION & SYNC
    useEffect(() => {
        if (typeof window === "undefined") return;

        const performInit = () => {
            // 1. Try to get user from state or localStorage
            let currentUser = user || checkAuth();
            
            // 2. If we have a user (either from state or localStorage), update state and we're done
            if (currentUser) {
                if (user !== currentUser) setUser(currentUser);
                setHasMounted(true);
                return;
            }

            // 3. If no local user, check social session (NextAuth)
            if (status === "loading") {
                // Wait for social session to load
                setHasMounted(true); // Still marked as mounted for UI, but user remains null
                return;
            }

            if (status === "authenticated" && session?.user) {
                console.log("[Auth] Syncing social session...");
                const email = session.user.email || "";
                const emailLower = email.toLowerCase().trim();
                const mode = localStorage.getItem("pending_auth_mode");
                const registeredStr = localStorage.getItem("registered_emails") || "[]";
                const registered: string[] = JSON.parse(registeredStr);
                
                const allAllowed = [...registered, ...ADMIN_EMAILS].map(e => e.toLowerCase().trim());
                const isAllowed = allAllowed.includes(emailLower);

                // Handle authorization logic
                if (!isAllowed && mode === "login") {
                    window.dispatchEvent(new Event("auth-no-account"));
                    logout();
                    localStorage.removeItem("pending_auth_mode");
                    setHasMounted(true);
                    return;
                }

                if (mode === "register") {
                    window.dispatchEvent(new CustomEvent("auth-require-terms", { 
                        detail: { 
                            email: emailLower,
                            socialUser: {
                                name: session.user.name || email.split("@")[0] || "Trader",
                                email: email,
                                avatarImage: session.user.image || undefined,
                            }
                        } 
                    }));
                    localStorage.setItem("pending_auth_mode", "register_intercepted");
                    setHasMounted(true);
                    return;
                }

                if (mode === "register_intercepted") {
                    setHasMounted(true);
                    return;
                }

                if (!isAllowed) {
                    window.dispatchEvent(new Event("auth-no-account"));
                    localStorage.removeItem("pending_auth_mode");
                    logout();
                    setHasMounted(true);
                    return;
                }

                // Authorized Social User
                localStorage.removeItem("pending_auth_mode");
                const socialUser: AuthUser = {
                    name: session.user.name || email.split("@")[0] || "Trader",
                    email: email,
                    isLoggedIn: true,
                    avatarImage: session.user.image || undefined,
                    theme: "dark", // Default theme for new social icons
                    joinedAt: new Date().getFullYear().toString()
                };
                localStorage.setItem("user_session", JSON.stringify(socialUser));
                setUser(socialUser);
                window.dispatchEvent(new Event("auth-update"));
            }

            setHasMounted(true);
        };

        performInit();

        // Listen for external storage changes (other tabs) or same-tab updates
        const handleUpdates = () => {
            const updatedUser = checkAuth();
            setUser(prev => {
                // Only update state if JSON strings are different to avoid unnecessary re-renders
                if (JSON.stringify(prev) !== JSON.stringify(updatedUser)) {
                    return updatedUser;
                }
                return prev;
            });
        };

        if (isFirstRun.current) {
            window.addEventListener("storage", handleUpdates);
            window.addEventListener("auth-update", handleUpdates);
            isFirstRun.current = false;
        }

        return () => {
            // We usually don't remove during SPA nav as the provider stays mounted
        };
    }, [session, status]); // Re-run when social session status changes

    // Global theme application
    useEffect(() => {
        if (!hasMounted || !user) return;
        const theme = user.theme || "dark";
        document.body.classList.remove("theme-dark", "theme-amoled", "theme-market-blue", "theme-light");
        document.body.classList.add(`theme-${theme}`);
    }, [user?.theme, hasMounted]);

    const logout = () => {
        localStorage.removeItem("user_session");
        setUser(null);
        if (status === "authenticated") {
            signOut({ redirect: false });
        }
        window.dispatchEvent(new Event("auth-update"));
    };

    const confirmLogout = () => {
        window.dispatchEvent(new Event("open-logout-confirm"));
    };

    const updateProfile = (updates: Partial<AuthUser>) => {
        const sessionString = localStorage.getItem("user_session");
        if (sessionString) {
            try {
                const session = JSON.parse(sessionString);
                const updatedSession = { ...session, ...updates };
                if (!updatedSession.joinedAt) {
                    updatedSession.joinedAt = new Date().getFullYear().toString();
                }
                
                // CRITICAL: Force isLoggedIn true to ensure it's not purged
                updatedSession.isLoggedIn = true;
                
                localStorage.setItem("user_session", JSON.stringify(updatedSession));
                setUser(updatedSession);
                
                // Sync across tabs immediately
                window.dispatchEvent(new Event("auth-update"));
                
                console.log("[Auth] Profile updated and saved to localStorage");
            } catch (e) {
                console.error("Error updating user_session", e);
            }
        }
    };

    return (
        <AuthContext.Provider value={{ user, hasMounted, logout, confirmLogout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuthContext() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuthContext must be used within an AuthProvider");
    }
    return context;
}
