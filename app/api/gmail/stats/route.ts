import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getGmailStats } from "@/lib/gmail";
import { getActiveGmailAccess } from "@/lib/gmail-auth";

export async function GET(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId") ?? undefined;
    const { accessToken } = await getActiveGmailAccess(userId, accountId);
    const stats = await getGmailStats(accessToken);
    return NextResponse.json({ stats });
  } catch (error) {
    const message = (error as Error).message;
    const status =
      message.includes("No Gmail account connected") ||
      message.includes("Gmail refresh token missing")
        ? 400
        : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
