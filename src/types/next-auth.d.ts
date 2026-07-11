import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    role?: string;
    rmId?: string | null;
  }
  interface Session {
    user: {
      id: string;
      role?: string;
      rmId?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    role?: string;
    rmId?: string | null;
  }
}
