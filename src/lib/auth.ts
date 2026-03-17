import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import type { Session } from "next-auth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
const hasAuthEnv =
  !isBuildPhase &&
  Boolean(process.env.AUTH_SECRET) &&
  Boolean(process.env.DATABASE_URL);

const makeStubHandlers = () => ({
  GET: async () =>
    NextResponse.json(
      { error: "Auth not configured" },
      { status: 500 }
    ),
  POST: async () =>
    NextResponse.json(
      { error: "Auth not configured" },
      { status: 500 }
    ),
});

let handlers: {
  GET: (req: NextRequest) => Promise<Response>;
  POST: (req: NextRequest) => Promise<Response>;
};
let auth: () => Promise<Session | null>;
type SignInFn = typeof NextAuth extends (...args: unknown[]) => infer R
  ? R extends { signIn: infer S }
    ? S
    : never
  : never;
type SignOutFn = typeof NextAuth extends (...args: unknown[]) => infer R
  ? R extends { signOut: infer S }
    ? S
    : never
  : never;

let signIn: SignInFn;
let signOut: SignOutFn;

if (hasAuthEnv) {
  const nextAuth = NextAuth({
    adapter: PrismaAdapter(db),
    session: { strategy: "jwt" },
    pages: {
      signIn: "/login",
      error: "/login",
    },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
        }
        return token;
      },
      async session({ session, token }) {
        if (token && session.user) {
          session.user.id = token.id as string;
          session.user.email = token.email as string;
          session.user.name = token.name as string;
        }
        return session;
      },
    },
    providers: [
      Credentials({
        name: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) return null;

          const { email, password } = parsed.data;

          const user = await db.user.findUnique({ where: { email } });
          if (!user || !user.password) return null;

          const passwordMatch = await bcrypt.compare(password, user.password);
          if (!passwordMatch) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
          };
        },
      }),
    ],
  });

  handlers = nextAuth.handlers;
  auth = nextAuth.auth;
  signIn = nextAuth.signIn;
  signOut = nextAuth.signOut;
} else {
  const stub = makeStubHandlers();
  handlers = stub;
  auth = async () => null;
  signIn = async () => null;
  signOut = async () => null;
}

export { handlers, auth, signIn, signOut };
