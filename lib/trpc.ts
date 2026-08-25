import { createTRPCReact } from "@trpc/react-query";
import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import Constants from "expo-constants";

export const trpc = createTRPCReact<AppRouter>();

export const getBaseUrl = () => {
  // Browser / client-side rendering
  if (typeof window !== 'undefined') {
    const origin = window.location?.origin;
    // origin can be "" during SSR static rendering — skip in that case
    if (origin && origin !== 'null') {
      return origin;
    }
    const port = window.location?.port;
    const hostname = window.location?.hostname;
    if (hostname) {
      return port ? `http://${hostname}:${port}` : `http://${hostname}`;
    }
  }

  // Native / Expo Go (development)
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    return `http://${hostUri}`;
  }

  // Standalone APK / production build — use the deployed backend URL
  return 'https://rork-immoci-mobile-ui-kit-prototype.vercel.app';
};

const createHttpLink = () => {
  const baseUrl = getBaseUrl();
  const apiUrl = `${baseUrl}/api/trpc`;

  return httpLink({
    url: apiUrl,
    transformer: superjson,
    headers: async () => {
      try {
        // Dynamically import supabase to avoid circular deps
        const { supabase } = await import('@/backend/db');
        const { data } = await supabase.auth.getSession();
        const token = data?.session?.access_token;
        if (token) {
          return { Authorization: `Bearer ${token}` };
        }
      } catch {
        // Supabase not configured or no active session — no auth header needed
      }
      return {};
    },
    fetch: async (input, init?) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(input, {
          ...init,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.clone().text();
          console.error('[tRPC] Error response:', response.status, text.substring(0, 200));
        }

        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.includes('application/json')) {
          const text = await response.clone().text();

          if (text.includes('Not found') || text.includes('404')) {
            throw new Error(
              `Backend endpoint not found at ${apiUrl}. Status: 404.`
            );
          }

          throw new Error(
            `Backend returned ${contentType || 'non-JSON'} instead of JSON. Status: ${response.status}`
          );
        }

        return response;
      } catch (error) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error(`Request timeout after 30s. URL: ${apiUrl}`);
          }

          if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
            throw new Error(`Cannot connect to backend. URL: ${apiUrl}`);
          }
        }

        throw error;
      }
    },
  });
};

let _trpcClient: ReturnType<typeof createTRPCClient<AppRouter>> | null = null;

export const getTrpcClient = () => {
  if (!_trpcClient) {
    _trpcClient = createTRPCClient<AppRouter>({
      links: [createHttpLink()],
    });
  }
  return _trpcClient;
};

export const trpcClient = new Proxy({} as ReturnType<typeof createTRPCClient<AppRouter>>, {
  get(_, prop) {
    return getTrpcClient()[prop as keyof ReturnType<typeof createTRPCClient<AppRouter>>];
  },
});
