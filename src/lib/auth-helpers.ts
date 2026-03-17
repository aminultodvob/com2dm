import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

/**
 * Get the current session user + their primary workspace.
 * Redirects to /login if not authenticated.
 */
export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session.user;
}

/**
 * API-friendly auth helper. Returns null if unauthenticated.
 */
export async function requireApiAuth() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}

/**
 * Get the user's primary workspace (the one they own or first membership).
 */
export async function getWorkspace(userId: string) {
  const membership = await db.membership.findFirst({
    where: { userId },
    include: { workspace: { include: { subscription: true } } },
    orderBy: { joinedAt: "asc" },
  });
  return membership?.workspace ?? null;
}

/**
 * Full context: user + workspace. Redirects if missing.
 */
export async function requireWorkspace() {
  const user = await requireAuth();
  const workspace = await getWorkspace(user.id);
  if (!workspace) redirect("/dashboard/onboarding");
  return { user, workspace };
}

/**
 * API-friendly workspace helper. Returns null if missing.
 */
export async function requireApiWorkspace() {
  const user = await requireApiAuth();
  if (!user?.id) return null;
  const workspace = await getWorkspace(user.id);
  if (!workspace) return null;
  return { user, workspace };
}
