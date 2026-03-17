import { z } from "zod";

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  // Auth
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
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

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment variables:",
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
