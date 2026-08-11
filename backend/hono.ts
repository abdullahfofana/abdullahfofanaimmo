import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

const app = new Hono().basePath('/api');

// ─── In-process sliding-window rate limiter ───────────────────────────────
// Structure: ip -> [timestamp, timestamp, ...]
const rateLimitStore = new Map<string, number[]>();

function getClientIp(req: Request): string {
  return (
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function rateLimit(windowMs: number, maxRequests: number) {
  return async (c: any, next: () => Promise<void>) => {
    const ip = getClientIp(c.req.raw);
    const now = Date.now();
    const windowStart = now - windowMs;

    const hits = (rateLimitStore.get(ip) ?? []).filter((t) => t > windowStart);
    hits.push(now);
    rateLimitStore.set(ip, hits);

    // Prevent unbounded memory growth: clean up old IPs periodically
    if (rateLimitStore.size > 10_000) {
      for (const [key, times] of rateLimitStore.entries()) {
        if (times.every((t) => t <= windowStart)) rateLimitStore.delete(key);
      }
    }

    if (hits.length > maxRequests) {
      return c.json(
        { error: 'Too Many Requests', retryAfter: Math.ceil(windowMs / 1000) },
        429
      );
    }
    await next();
  };
}
// ─────────────────────────────────────────────────────────────────────────────

// Lock CORS to known origins only — prevents cross-origin abuse
const ALLOWED_ORIGINS = [
  'https://rork-immoci-mobile-ui-kit-prototype.vercel.app',
  'http://localhost:8081', // Expo web dev
  'http://localhost:3000',
  'http://localhost:19006',
];

app.use("*", cors({
  origin: (origin) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return origin;
    if (ALLOWED_ORIGINS.includes(origin)) return origin;
    return null; // Block all other origins
  },
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Global rate limit: 120 req / 60s per IP (~2 req/sec average)
app.use('/trpc/*', rateLimit(60_000, 120));

// Tighter limit on AI endpoints: 10 req / 60s per IP (prevents OpenAI quota abuse)
app.use('/trpc/ai.*', rateLimit(60_000, 10));

app.get("/", (c) => {
  const supabaseConfigured = !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return c.json({
    status: "ok",
    message: "Rork Backend API is running",
    database: supabaseConfigured ? 'Supabase' : 'Local JSON (fallback)',
  });
});

app.get("/health", (c) => {
  const supabaseConfigured = !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  return c.json({
    status: "ok",
    message: "Backend API is healthy",
    database: supabaseConfigured ? 'Supabase' : 'Local JSON (fallback)',
  });
});

// Internal-only: protect /db-status with a server secret token to prevent infrastructure leaks
app.get("/db-status", async (c) => {
  const authToken = c.req.header('x-admin-token');
  const expectedToken = process.env.ADMIN_API_TOKEN;

  if (!expectedToken || authToken !== expectedToken) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const supabaseConfigured = !!process.env.EXPO_PUBLIC_SUPABASE_URL && !!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseConfigured) {
    return c.json({
      status: "warning",
      database: "Local JSON (fallback)",
      message: "Supabase credentials not configured.",
    });
  }

  try {
    const { initializeSupabaseTables } = await import('./supabase');
    const result = await initializeSupabaseTables();

    if (result.success) {
      return c.json({ status: "ok", database: "Supabase", message: "Connection successful." });
    } else {
      // Sanitize: don't leak raw DB error codes to the caller
      return c.json({ status: "error", message: "Database connection failed." }, 500);
    }
  } catch {
    return c.json({ status: "error", message: "Unexpected error." }, 500);
  }
});

app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

export default app;
