import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listMessages } from "@/lib/gmail";
import { getActiveGmailAccess } from "@/lib/gmail-auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const filter = searchParams.get("filter");
  const accountId = searchParams.get("accountId") ?? undefined;
  const maxResults = Number(searchParams.get("max") ?? "12");

  const filters: string[] = [];
  if (filter === "unread") filters.push("is:unread");
  if (filter === "important") filters.push("is:important");
  if (filter === "promotions") filters.push("category:promotions");

  const query = [q, ...filters].filter(Boolean).join(" ").trim();

  try {
    const { accessToken } = await getActiveGmailAccess(userId, accountId);
    const messages = await listMessages(accessToken, {
      q: query || undefined,
      maxResults,
    });

    return NextResponse.json({ messages });
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
