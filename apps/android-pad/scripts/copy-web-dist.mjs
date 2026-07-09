import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "../..");
const source = path.resolve(repoRoot, "apps/web/dist");
const target = path.resolve(appRoot, "web-dist");

await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });

console.log(`[android-pad] copied ${path.relative(repoRoot, source)} -> ${path.relative(repoRoot, target)}`);

