// Cross-platform postbuild copy for Next.js standalone output.
// Replaces the Unix-only `cp -r` calls so `npm run build` works on Windows too.
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(process.cwd());
const standalone = resolve(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error("[postbuild] .next/standalone not found — is `output: \"standalone\"` set in next.config?");
  process.exit(1);
}

const copies = [
  { from: resolve(root, ".next", "static"), to: resolve(standalone, ".next", "static") },
  { from: resolve(root, "public"), to: resolve(standalone, "public") },
];

for (const { from, to } of copies) {
  if (!existsSync(from)) {
    console.warn(`[postbuild] skipped (missing): ${from}`);
    continue;
  }
  mkdirSync(to, { recursive: true });
  cpSync(from, to, { recursive: true });
  console.log(`[postbuild] copied ${from} -> ${to}`);
}

console.log("[postbuild] done.");
