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
            console.log(`[Auth] 🟢 Evento detectado: ${event}`);
            
            if (session?.user) {
                const userId = session.user.id;
                const email = session.user.email || "";
                const metadata = session.user.user_metadata;
                
                console.log(`[Auth] 🔍 Buscando perfil para ID: ${userId}`);

                // Busca a versão mais recente do perfil no banco de dados
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (profileError) {
                    console.warn(`[Auth] ⚠️ Aviso na busca de perfil:`, profileError.message);
                } else if (!profileData) {
                    console.log(`[Auth] ℹ️ Nenhum perfil encontrado para este usuário.`);
                } else {
                    console.log(`[Auth] ✅ Perfil encontrado no banco:`, profileData);
                }

                const finalAvatar = profileData?.avatar_url || metadata?.avatar_url || undefined;
                console.log(`[Auth] 🖼️ URL da foto final definida como:`, finalAvatar);

                const authUser: AuthUser = {
                    id: userId,
                    name: profileData?.full_name || metadata?.full_name || metadata?.name || email.split("@")[0],
                    email: email,
                    isLoggedIn: true,
                    avatarImage: finalAvatar,
                    theme: profileData?.theme || localUser?.theme || "dark",
                    joinedAt: profileData?.created_at ? new Date(profileData.created_at).getFullYear().toString() : (localUser?.joinedAt || "2026"),
                    investorType: profileData?.investor_type || localUser?.investorType
                };

                // Persiste e atualiza
                localStorage.setItem("user_session", JSON.stringify(authUser));
                setUser(authUser);
                window.dispatchEvent(new Event("auth-update"));

                // Removido a auto-criação na inicialização que estava causando erro 400
                // O perfil deve ser criado pelo trigger do Supabase ou via Upsert nas configurações.
            } else if (event === "SIGNED_OUT") {
                console.log("[Auth] 🔴 Usuário deslogado");
                localStorage.removeItem("user_session");
                setUser(null);
                window.dispatchEvent(new Event("auth-update"));
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
        console.log("[Auth] 🔴 Iniciando processo de logout...");
        
        // 1. Limpa o estado local imediatamente para feedback instantâneo na UI
        localStorage.removeItem("user_session");
        setUser(null);
        window.dispatchEvent(new Event("auth-update"));
        
        try {
            // 2. Tenta deslogar do Supabase (com timeout implícito ou erro ignorado se falhar)
            console.log("[Auth] 📡 Solicitando signOut ao Supabase...");
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.warn("[Auth] ⚠️ Erro ao deslogar do Supabase:", error.message);
            } else {
                console.log("[Auth] ✅ Supabase signOut concluído.");
            }
        } catch (err) {
            console.error("[Auth] ❌ Erro inesperado no signOut:", err);
        } finally {
            // 3. Garante que o usuário seja redirecionado mesmo em caso de erro
            console.log("[Auth] 🏠 Redirecionando para a home...");
            router.push("/");
        }
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
                
                // Sincroniza com o Supabase (Tabela Profiles e Auth Metadata)
                if (session.id) {
                    // 1. Atualiza a tabela profiles para persistência em refreshes
                    const profileUpdates: any = {};
                    if (updates.name) profileUpdates.full_name = updates.name;
                    if (updates.avatarImage) profileUpdates.avatar_url = updates.avatarImage;
                    if (updates.investorType) profileUpdates.investor_type = updates.investorType;

                    if (Object.keys(profileUpdates).length > 0) {
                        // Usar upsert garante que se a linha não existir (trigger falhou), ela será criada
                        await supabase
                            .from('profiles')
                            .upsert({ id: session.id, ...profileUpdates }, { onConflict: 'id' });
                    }

                    // 2. Atualiza o metadata do Auth (opcional, mas bom para redundância)
                    if (updates.name || updates.avatarImage) {
                        await supabase.auth.updateUser({
                            data: { 
                                full_name: updates.name || session.name,
                                avatar_url: updates.avatarImage || session.avatarImage
                            }
                        });
                    }
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
