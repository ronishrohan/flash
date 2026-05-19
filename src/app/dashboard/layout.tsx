"use client";

import { useRouter, usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "@/components/dashboard/context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { SettingsModal } from "@/components/dashboard/settings-modal";
import { RoseSpinner } from "@/components/ui/rose-spinner";
import { supabase } from "@/lib/supabase";

function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, collapsed, setCollapsed, conversations, settingsOpen, setSettingsOpen } = useDashboard();
  const activeConvId = pathname.startsWith("/dashboard/chat/") ? pathname.split("/dashboard/chat/")[1] : null;

  if (!user || loading) return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#f8fafc" }}>
      <RoseSpinner size={72} color="#94a3b8" />
    </div>
  );

  const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "";
  const displayName = fullName || user.email || "";
  const initials = displayName.split(" ").map((w: string) => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-[100dvh] flex p-3 gap-3" style={{ background: "#f8fafc" }}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(c => !c)}
        activeNav="Home"
        onNavSelect={() => {}}
        conversations={conversations}
        activeConv={activeConvId}
        onConvSelect={(id) => {
          router.push(`/dashboard/chat/${id}`);
        }}
        onNewChat={() => router.push("/dashboard")}
        displayName={displayName}
        email={user.email}
        initials={initials}
        onSignOut={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
        onProfile={() => {}}
        onSettings={() => setSettingsOpen(v => !v)}
        onHelp={() => {}}
      />

      <main
        className="flex-1 flex flex-col bg-white rounded-[2rem] overflow-hidden min-w-0"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.07)" }}
      >
        {children}
      </main>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
