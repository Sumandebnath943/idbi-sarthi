// Edge-safe Auth.js base config. Imported by BOTH the Node auth setup
// (src/lib/auth.ts) and the edge middleware (src/middleware.ts).
//
// It must NOT import bcrypt, Supabase, or any Node-only module — the middleware
// bundles this for the edge runtime. Real providers are added in src/lib/auth.ts.

import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  trustHost: true, // required on Vercel / behind a proxy
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8h
  pages: { signIn: "/login" },
  providers: [], // Credentials provider is injected in src/lib/auth.ts (Node runtime)
  callbacks: {
    // Persist role + rmId into the JWT so authorization can run without a DB hit.
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = (user as { role?: string }).role;
        token.rmId = (user as { rmId?: string | null }).rmId ?? null;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = (token.uid as string) ?? session.user.id;
        session.user.role = token.role as string | undefined;
        session.user.rmId = (token.rmId as string | null) ?? null;
      }
      return session;
    },
  },
};
