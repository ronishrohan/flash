import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getConversationMessages,
  addConversationMessage,
} from "@/lib/conversations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const messages = await getConversationMessages(userId, id);
    return NextResponse.json({ messages });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    role?: string;
    content?: string;
    metadata?: string;
  };

  if (!body.role || !body.content) {
    return NextResponse.json(
      { error: "Role and content required" },
      { status: 400 }
    );
  }

  try {
    await addConversationMessage(
      id,
      body.role as "user" | "assistant",
      body.content,
      body.metadata
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
