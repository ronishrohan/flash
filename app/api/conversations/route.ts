import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { listConversations, createConversation } from "@/lib/conversations";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const conversations = await listConversations(userId);
    return NextResponse.json({ conversations });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { title?: string };
  const title = body.title?.trim() || "New conversation";

  try {
    const conversation = await createConversation(userId, title);
    return NextResponse.json({ conversation });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
