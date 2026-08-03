import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const generatedDir = path.resolve(appRoot, "generated");
const configPath = path.resolve(generatedDir, "runtime-config.json");

const config = {
  serverUrl: process.env.RYX_WINDOWS_SERVER_URL?.trim() || "",
  apiBaseUrl: process.env.RYX_WINDOWS_API_BASE_URL?.trim() || "",
  apiHomeUrl: process.env.RYX_WINDOWS_API_HOME_URL?.trim() || "",
  jyxUrl: process.env.RYX_WINDOWS_JYX_URL?.trim() || "",
};

await mkdir(generatedDir, { recursive: true });
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);

console.log(`[windows] wrote ${path.relative(appRoot, configPath)}`);
