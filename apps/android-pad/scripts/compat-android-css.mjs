import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const assetsDir = path.resolve(appRoot, "web-dist/assets");

function skipString(css, index) {
  const quote = css[index];
  let cursor = index + 1;
  while (cursor < css.length) {
    if (css[cursor] === "\\") {
      cursor += 2;
      continue;
    }
    if (css[cursor] === quote) return cursor + 1;
    cursor += 1;
  }
  return cursor;
}

function skipComment(css, index) {
  const end = css.indexOf("*/", index + 2);
  return end === -1 ? css.length : end + 2;
}

function isEscaped(css, index) {
  let slashes = 0;
  let cursor = index - 1;
  while (cursor >= 0 && css[cursor] === "\\") {
    slashes += 1;
    cursor -= 1;
  }
  return slashes % 2 === 1;
}

function isTopLevelLayer(css, index, depth) {
  if (depth !== 0 || !css.startsWith("@layer", index)) return false;
  const before = css[index - 1] ?? "";
  const after = css[index + "@layer".length] ?? "";
  return !/[-_a-zA-Z0-9]/.test(before) && !/[-_a-zA-Z0-9]/.test(after);
}

function findLayerDelimiter(css, index) {
  let cursor = index;
  while (cursor < css.length) {
    const char = css[cursor];
    const next = css[cursor + 1];
    if ((char === "\"" || char === "'") && !isEscaped(css, cursor)) {
      cursor = skipString(css, cursor);
      continue;
    }
    if (char === "/" && next === "*") {
      cursor = skipComment(css, cursor);
      continue;
    }
    if (char === "{" || char === ";") return cursor;
    cursor += 1;
  }
  return -1;
}

function findMatchingBrace(css, openIndex) {
  let depth = 1;
  let cursor = openIndex + 1;
  while (cursor < css.length) {
    const char = css[cursor];
    const next = css[cursor + 1];
    if ((char === "\"" || char === "'") && !isEscaped(css, cursor)) {
      cursor = skipString(css, cursor);
      continue;
    }
    if (char === "/" && next === "*") {
      cursor = skipComment(css, cursor);
      continue;
    }
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return cursor;
    cursor += 1;
  }
  return -1;
}

function unwrapTopLevelCascadeLayers(css) {
  let output = "";
  let start = 0;
  let cursor = 0;
  let depth = 0;
  let unwrapped = 0;
  let removedStatements = 0;

  while (cursor < css.length) {
    const char = css[cursor];
    const next = css[cursor + 1];

    if ((char === "\"" || char === "'") && !isEscaped(css, cursor)) {
      cursor = skipString(css, cursor);
      continue;
    }
    if (char === "/" && next === "*") {
      cursor = skipComment(css, cursor);
      continue;
    }

    if (isTopLevelLayer(css, cursor, depth)) {
      output += css.slice(start, cursor);
      const delimiter = findLayerDelimiter(css, cursor + "@layer".length);
      if (delimiter === -1) {
        output += css.slice(cursor);
        start = css.length;
        break;
      }

      if (css[delimiter] === ";") {
        removedStatements += 1;
        cursor = delimiter + 1;
        start = cursor;
        continue;
      }

      const close = findMatchingBrace(css, delimiter);
      if (close === -1) {
        output += css.slice(cursor);
        start = css.length;
        break;
      }

      output += css.slice(delimiter + 1, close);
      unwrapped += 1;
      cursor = close + 1;
      start = cursor;
      continue;
    }

    if (char === "{") depth += 1;
    if (char === "}") depth = Math.max(0, depth - 1);
    cursor += 1;
  }

  output += css.slice(start);
  return { css: output, unwrapped, removedStatements };
}

const entries = await readdir(assetsDir, { withFileTypes: true });
let changedFiles = 0;

for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith(".css")) continue;

  const file = path.join(assetsDir, entry.name);
  const original = await readFile(file, "utf8");
  const result = unwrapTopLevelCascadeLayers(original);
  if (result.css === original) continue;

  await writeFile(file, result.css, "utf8");
  changedFiles += 1;
  console.log(
    `[android-pad] CSS compat ${entry.name}: unwrapped ${result.unwrapped} layer blocks, removed ${result.removedStatements} layer statements`,
  );
}

if (changedFiles === 0) {
  console.log("[android-pad] CSS compat: no cascade layers found");
}
