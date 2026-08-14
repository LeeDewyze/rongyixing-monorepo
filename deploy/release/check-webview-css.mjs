import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const roots = process.argv.slice(2);
if (roots.length === 0) {
  console.error("Usage: node deploy/release/check-webview-css.mjs <dist> [...dist]");
  process.exit(2);
}

const files = [];

async function collect(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await collect(file);
    } else if (/\.(css|js|html)$/.test(entry.name)) {
      files.push(file);
    }
  }
}

for (const root of roots) {
  await collect(path.resolve(root));
}

const failures = [];
for (const file of files) {
  const content = await readFile(file, "utf8");
  if (/to\s+(?:top|right|bottom|left)(?:\s+(?:right|left))?\s+in\s+oklab/.test(content)) {
    failures.push(`${file}: directional gradient uses unsupported oklab interpolation`);
  }
  if (/oklch\(/.test(content)) {
    failures.push(`${file}: uses unsupported oklch colors`);
  }
}

if (failures.length > 0) {
  console.error("[webview-compat] incompatible CSS found:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`[webview-compat] checked ${files.length} assets`);
