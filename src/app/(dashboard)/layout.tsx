import { requireWorkspace } from "@/lib/auth-helpers";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { DashboardTopbar } from "@/components/dashboard/topbar";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { default: "Dashboard", template: "%s | Comment2DM" },
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, workspace } = await requireWorkspace();

  const plan = workspace.subscription?.tier ?? "FREE";

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="hidden md:flex md:shrink-0">
        <DashboardSidebar
          workspaceName={workspace.name}
          userEmail={user.email ?? ""}
          userName={user.name ?? ""}
          plan={plan}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}
