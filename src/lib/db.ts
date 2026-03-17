import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

// A safe dummy object for PrismaAdapter during the build phase
const buildDummy = new Proxy({}, {
  get(target, prop) {
    if (prop === "then") return undefined;
    return new Proxy(() => Promise.resolve(), {
      get() { return () => Promise.resolve() }
    });
  }
}) as PrismaClient;

const createClient = () => {
  if (isBuildPhase) return buildDummy;

  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
};

const prismaInstance = isBuildPhase
  ? buildDummy
  : (process.env.DATABASE_URL
      ? globalForPrisma.prisma ?? createClient()
      : (new Proxy(
          {},
          {
            get() {
              throw new Error("DATABASE_URL is not set");
            },
          }
        ) as PrismaClient));

export const db = prismaInstance;

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL && !isBuildPhase) {
  globalForPrisma.prisma = db;
}
