import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildPlan } from "@/lib/agent";
import { getPrimaryGmailAccount } from "@/lib/gmail-accounts";

export async function POST(request: Request) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json(
      { error: "Connect Gmail to run agent actions." },
      { status: 401 }
    );
  }

  const gmailAccount = await getPrimaryGmailAccount(userId);
  if (!gmailAccount) {
    return NextResponse.json(
      { error: "Connect at least one Gmail account first." },
      { status: 400 }
    );
  }

  const body = (await request.json()) as { command?: string };
  const command = body.command?.trim();

  if (!command) {
    return NextResponse.json({ error: "Command is required." }, { status: 400 });
  }

  const plan = buildPlan(command);
  const steps = plan.steps.map((step, index) => ({
    ...step,
    status: index === plan.steps.length - 1 ? "pending" : "complete",
  }));

  return NextResponse.json({
    intent: plan.intent,
    steps,
    summary: plan.summary,
    note: "Execution is queued. Wire Gmail actions in lib/agent.ts for production.",
  });
}
