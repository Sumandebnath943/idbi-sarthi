// Cross-platform production start for the Next.js standalone server.
// Replaces `NODE_ENV=production bun .next/standalone/server.js`, which relied on
// Unix-style env-var syntax and the bun runtime. Uses plain Node so it runs on
// Windows, macOS, and Linux.
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

process.env.NODE_ENV = process.env.NODE_ENV || "production";
process.env.PORT = process.env.PORT || "3000";

const server = resolve(process.cwd(), ".next", "standalone", "server.js");
if (!existsSync(server)) {
  console.error("[start] .next/standalone/server.js not found — run `npm run build` first.");
  process.exit(1);
}

await import(pathToFileURL(server).href);
