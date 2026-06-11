import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase environment variables are missing! Authentication will not work correctly.");
}

// Global fetch interceptor to catch network/DNS resolution failures when contacting Supabase.
// This is necessary because `@supabase/auth-js` makes direct global fetch requests (or wraps them)
// and prints unhandled native `TypeError: Failed to fetch` console messages on connection loss or paused project.
if (typeof window !== "undefined") {
  const originalFetch = window.fetch;
  window.fetch = async function (input, init) {
    const url = typeof input === "string" 
      ? input 
      : input instanceof URL 
        ? input.href 
        : input && typeof input === "object" && "url" in input
          ? (input as any).url
          : "";

    if (url && url.includes(".supabase.co")) {
      try {
        return await originalFetch(input, init);
      } catch (error) {
        console.warn(
          `[Global Fetch Proxy] Supabase request failed or host unreachable. Returning mock response. Details:`,
          error
        );
        return new Response(
          JSON.stringify({
            error: "network_error",
            message: "Supabase service is unreachable (possible DNS resolution issue or paused project).",
          }),
          {
            status: 400,
            statusText: "Bad Request",
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }
    return originalFetch(input, init);
  };
}

// Custom fetch wrapper to gracefully handle network/DNS errors (e.g. when the Supabase project is paused/deleted)
// This prevents unhandled "Failed to fetch" TypeError console exceptions during auth client initialization.
const safeFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  try {
    return await fetch(input, init);
  } catch (error) {
    console.warn(
      `[Supabase Client] Network error or paused project. Returning offline status. Details:`,
      error
    );
    // Return a mock 503 Service Unavailable response to let Supabase client handle the error gracefully without throwing a raw TypeError
    return new Response(
      JSON.stringify({
        error: "network_error",
        message: "Supabase service is unreachable (possible DNS resolution issue or paused project).",
      }),
      {
        status: 400,
        statusText: "Bad Request",
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const supabase = createBrowserClient(
  supabaseUrl || "",
  supabaseAnonKey || "",
  {
    global: {
      fetch: safeFetch,
    },
  }
);

