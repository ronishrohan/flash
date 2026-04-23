import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { SupabaseAdapter } from "@auth/supabase-adapter";
import { getUserByEmail } from "@/lib/users";
import { verifyPassword } from "@/lib/password";
import { upsertGmailAccount } from "@/lib/gmail-accounts";
import { gmailScopes } from "@/lib/google-oauth";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables."
  );
}

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: SupabaseAdapter({
    url: supabaseUrl,
    secret: supabaseServiceKey,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: gmailScopes.join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = (credentials?.email as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password as string | undefined;

        if (!email || !password) {
          return null;
        }

        const user = await getUserByEmail(email);
        if (!user || !user.passwordHash) {
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth",
    newUser: "/onboarding",
  },
  session: { strategy: "jwt" },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google" && user?.id) {
        const email =
          typeof profile?.email === "string"
            ? profile.email
            : (user.email ?? "");
        if (email) {
          await upsertGmailAccount({
            userId: user.id,
            providerAccountId: account.providerAccountId,
            email,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: account.expires_at,
            scope: account.scope,
            tokenType: account.token_type,
          });
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const user = session.user as any;
        user.id = token.userId;
        user.name = token.name;
        user.email = token.email;
        user.image = token.picture;
      }
      return session;
    },
  },
});
