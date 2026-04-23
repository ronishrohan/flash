import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  listGmailAccounts,
  removeGmailAccount,
  setPrimaryGmailAccount,
} from "@/lib/gmail-accounts";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const accounts = await listGmailAccounts(userId);
    return NextResponse.json({ accounts });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { accountId?: string };
  if (!body.accountId) {
    return NextResponse.json({ error: "Account id required" }, { status: 400 });
  }

  try {
    await setPrimaryGmailAccount(userId, body.accountId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = (await request.json()) as { accountId?: string };
  if (!body.accountId) {
    return NextResponse.json({ error: "Account id required" }, { status: 400 });
  }

  try {
    await removeGmailAccount(userId, body.accountId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
