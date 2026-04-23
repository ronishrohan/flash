import { auth } from "@/lib/auth";
import { listGmailAccounts } from "@/lib/gmail-accounts";
import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/auth");
  }

  let gmailConnected = false;
  try {
    const accounts = await listGmailAccounts(userId);
    gmailConnected = accounts.length > 0;
  } catch {
    gmailConnected = false;
  }

  if (!gmailConnected) {
    redirect("/onboarding");
  }

  return (
    <AppShell user={session.user ?? {}}>
      {children}
    </AppShell>
  );
}
