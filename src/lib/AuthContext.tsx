"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { ADMIN_EMAILS } from "./constants";
import { useRouter } from "next/navigation";

export interface AuthUser {
    id?: string;
    name: string;
    email: string;
    isLoggedIn: boolean;
    theme?: string;
    avatar?: string;
    avatarImage?: string;
    joinedAt?: string;
    investorType?: string;
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
    const router = useRouter();
    const [user, setUser] = useState<AuthUser | null>(null);
    const [hasMounted, setHasMounted] = useState(false);

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

    useEffect(() => {
        if (typeof window === "undefined") return;

        // 1. Initialize with local storage if available to avoid flicker
        const localUser = checkAuth();
        if (localUser) setUser(localUser);
        setHasMounted(true);

        // 2. Supabase session listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Supabase Event: ${event}`);
            
            if (session?.user) {
                const email = session.user.email || "";
                const metadata = session.user.user_metadata;
                
                const authUser: AuthUser = {
                    id: session.user.id,
                    name: metadata?.full_name || metadata?.name || email.split("@")[0],
                    email: email,
                    isLoggedIn: true,
                    avatarImage: metadata?.avatar_url || undefined,
                    theme: localUser?.theme || "dark",
                    joinedAt: localUser?.joinedAt || new Date().getFullYear().toString(),
                    investorType: localUser?.investorType
                };

                localStorage.setItem("user_session", JSON.stringify(authUser));
                setUser(authUser);
                window.dispatchEvent(new Event("auth-update"));
            } else if (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") {
                if (!session?.user) {
                    localStorage.removeItem("user_session");
                    setUser(null);
                    window.dispatchEvent(new Event("auth-update"));
                }
            }
        });

        // 3. Sync updates across tabs
        const handleUpdates = () => {
            const updatedUser = checkAuth();
            setUser(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(updatedUser)) {
                    return updatedUser;
                }
                return prev;
            });
        };

        window.addEventListener("storage", handleUpdates);
        window.addEventListener("auth-update", handleUpdates);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener("storage", handleUpdates);
            window.removeEventListener("auth-update", handleUpdates);
        };
    }, []);

    // Global theme application
    useEffect(() => {
        if (!hasMounted || !user) return;
        const theme = user.theme || "dark";
        document.body.classList.remove("theme-dark", "theme-amoled", "theme-market-blue", "theme-light");
        document.body.classList.add(`theme-${theme}`);
    }, [user?.theme, hasMounted]);

    const logout = async () => {
        await supabase.auth.signOut();
        localStorage.removeItem("user_session");
        setUser(null);
        window.dispatchEvent(new Event("auth-update"));
        router.push("/");
    };

    const confirmLogout = () => {
        window.dispatchEvent(new Event("open-logout-confirm"));
    };

    const updateProfile = async (updates: Partial<AuthUser>) => {
        const sessionString = localStorage.getItem("user_session");
        if (sessionString) {
            try {
                const session = JSON.parse(sessionString);
                const updatedSession = { ...session, ...updates };
                updatedSession.isLoggedIn = true;
                
                localStorage.setItem("user_session", JSON.stringify(updatedSession));
                setUser(updatedSession);
                window.dispatchEvent(new Event("auth-update"));
                
                // Optional: Sync metadata to Supabase
                if (updates.name) {
                    await supabase.auth.updateUser({
                        data: { full_name: updates.name }
                    });
                }
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
