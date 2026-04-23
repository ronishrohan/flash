import { NextResponse } from "next/server";
import { createUser, getUserByEmail } from "@/lib/users";
import { hashPassword } from "@/lib/password";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.toLowerCase().trim();
    const password = body.password ?? "";

    if (!name || !email || password.length < 8) {
      return NextResponse.json(
        { error: "Name, valid email, and 8+ char password required." },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered." },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser({ name, email, passwordHash });

    return NextResponse.json({ userId: user.id });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
