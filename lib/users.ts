import { supabaseAdmin } from "@/lib/supabase-admin";

export type AppUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  passwordHash: string | null;
};

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, name, email, image, password_hash")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    email: data.email,
    image: data.image,
    passwordHash: data.password_hash,
  };
}

export async function createUser(params: {
  name: string;
  email: string;
  passwordHash: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .insert({
      name: params.name,
      email: params.email,
      password_hash: params.passwordHash,
      emailVerified: null,
    })
    .select("id, name, email")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
