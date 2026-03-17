"use client";

import { useState, useEffect } from "react";

export interface AuthUser {
    name: string;
    email: string;
    isLoggedIn: boolean;
    theme?: string;
    avatar?: string;
    avatarImage?: string;
}

export function useAuth() {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [hasMounted, setHasMounted] = useState(false);

    const checkAuth = () => {
        const sessionString = localStorage.getItem("user_session");
        if (sessionString) {
            try {
                const session = JSON.parse(sessionString);
                if (session.isLoggedIn) {
                    setUser(session);
                    return;
                }
            } catch (e) {
                console.error("Error parsing user_session", e);
            }
        }
        setUser(null);
    };

    useEffect(() => {
        setHasMounted(true);
        checkAuth();

        // Listen for changes in other tabs or same tab updates
        const handleStorageChange = () => {
            checkAuth();
        };

        window.addEventListener("storage", handleStorageChange);

        // Custom event for same-tab updates not triggered by 'storage' event
        window.addEventListener("auth-update", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            window.removeEventListener("auth-update", handleStorageChange);
        };
    }, []);

    // Global theme application
    useEffect(() => {
        if (!hasMounted || !user) return;

        const theme = user.theme || "dark";
        document.body.classList.remove("theme-dark", "theme-amoled", "theme-market-blue");

        if (theme === "amoled") document.body.classList.add("theme-amoled");
        else if (theme === "market-blue") document.body.classList.add("theme-market-blue");
        else document.body.classList.add("theme-dark");

    }, [user?.theme, hasMounted]);

    const logout = () => {
        localStorage.removeItem("user_session");
        setUser(null);
        window.dispatchEvent(new Event("auth-update"));
    };

    const updateProfile = (updates: Partial<AuthUser>) => {
        const sessionString = localStorage.getItem("user_session");
        if (sessionString) {
            try {
                const session = JSON.parse(sessionString);
                const updatedSession = { ...session, ...updates };
                localStorage.setItem("user_session", JSON.stringify(updatedSession));
                setUser(updatedSession);
                window.dispatchEvent(new Event("auth-update"));
            } catch (e) {
                console.error("Error updating user_session", e);
            }
        }
    };

    return { user, hasMounted, logout, updateProfile };
}
