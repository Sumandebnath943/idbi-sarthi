import { handlers } from "@/lib/auth";

// bcrypt (via the Credentials provider) needs the Node runtime.
export const runtime = "nodejs";

export const { GET, POST } = handlers;
