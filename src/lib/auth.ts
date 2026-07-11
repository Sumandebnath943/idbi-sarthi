// Full Auth.js (NextAuth v5) setup — Node runtime (uses bcrypt via users.ts).
// Exposes `auth()` for server-side session reads and `handlers` for the route.

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { verifyCredentials } from "@/lib/users";
import { audit, clientIpFromHeaders } from "@/lib/audit";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: { label: "Email" }, password: { label: "Password", type: "password" } },
      authorize: async (raw, request) => {
        const ip = request ? clientIpFromHeaders(request.headers) : undefined;
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) {
          await audit({ type: "AUTH_FAILURE", decision: "deny", detail: "malformed credentials", ip });
          return null;
        }
        const user = await verifyCredentials(parsed.data.email, parsed.data.password);
        if (!user) {
          // Log the attempted email only (not the password); helps detect brute force.
          await audit({ type: "AUTH_FAILURE", decision: "deny", detail: `bad login: ${parsed.data.email}`, ip });
          return null;
        }
        await audit({ type: "AUTH_SUCCESS", actorId: user.id, actorRole: user.role, decision: "allow", ip });
        return { id: user.id, name: user.name, email: user.email, role: user.role, rmId: user.rmId };
      },
    }),
  ],
});
