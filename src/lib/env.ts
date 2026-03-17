import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/postgres"),

  // Auth
  AUTH_SECRET: z.string().default("fallback-secret-for-build"),
  NEXTAUTH_URL: z.string().url().optional(),

  // Meta
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  META_VERIFY_TOKEN: z.string().optional(),
  META_REDIRECT_URI: z.string().optional(),
  META_GRAPH_API_VERSION: z.string().default("v19.0"),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_STARTER_PRICE_ID: z.string().optional(),
  STRIPE_PRO_PRICE_ID: z.string().optional(),

  // Redis
  REDIS_URL: z.string().default("redis://localhost:6379"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Comment2DM"),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

const isBuildTime = 
  process.env.NEXT_PHASE === "phase-production-build" || 
  process.env.NODE_ENV === "production" && !process.env.DATABASE_URL;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    if (isBuildTime) {
      console.warn("⚠️ Environment validation skipped during build time.");
      // Return a partial object that satisfies the type system enough for build
      return {
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres",
        AUTH_SECRET: process.env.AUTH_SECRET || "fallback-secret-for-build",
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        NEXT_PUBLIC_APP_NAME: "Comment2DM",
        NODE_ENV: "production",
        META_GRAPH_API_VERSION: "v19.0",
        REDIS_URL: "redis://localhost:6379",
      } as Env;
    }
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors
    );
    throw new Error("Invalid environment variables");
  }

  return parsed.data;
}

// Lazy singleton to avoid multiple validations
let _env: Env | undefined;

export function getEnv(): Env {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}

export const env = new Proxy({} as Env, {
  get(_, key: string) {
    return getEnv()[key as keyof Env];
  },
});
