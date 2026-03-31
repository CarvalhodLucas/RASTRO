"use client";

import { SessionProvider } from "next-auth/react";
import React from "react";
import { AuthProvider } from "@/lib/AuthContext";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </SessionProvider>
  );
}
