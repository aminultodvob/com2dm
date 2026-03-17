import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const createClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

const prismaInstance = process.env.DATABASE_URL
  ? globalForPrisma.prisma ?? createClient()
  : (new Proxy(
      {},
      {
        get() {
          throw new Error("DATABASE_URL is not set");
        },
      }
    ) as PrismaClient);

export const db = prismaInstance;

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL) {
  globalForPrisma.prisma = db;
}
