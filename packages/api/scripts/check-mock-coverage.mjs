#!/usr/bin/env node
/**
 * Check mock handler coverage for curated flow Methods.
 * Usage: node packages/api/scripts/check-mock-coverage.mjs [--domain hotel|auth|order|member|travel|all]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.resolve(__dirname, "../../..");

const domain = process.argv.includes("--domain")
  ? process.argv[process.argv.indexOf("--domain") + 1]
  : "all";

const DOMAIN_METHODS = {
  hotel: [
    "TmcApiHomeUrl-Resource-DomesticHotelCity",
    "TmcApiHotelUrl-Home-List",
    "TmcApiHotelUrl-Home-Detail",
    "TmcApiHotelUrl-Home-Policy",
    "TmcApiBookUrl-Hotel-Initialize",
    "TmcApiBookUrl-Hotel-Book",
    "TmcApiOrderUrl-Order-Detail",
    "TmcApiOrderUrl-Order-CancelOrderHotel",
    "TmcApiOrderUrl-Order-GetOrderPays",
    "TmcApiOrderUrl-Pay-Create",
  ],
  auth: [
    "ApiLoginUrl-Home-DeviceLogin",
    "ApiLoginUrl-Home-Login",
    "ApiLoginUrl-Home-MobileLogin",
    "ApiLoginUrl-Home-Logout",
    "ApiHomeUrl-Identity-Get",
    "ApiHomeUrl-Identity-Check",
    "ApiHomeUrl-Identity-GetWebSocketUrl",
  ],
  order: [
    "TmcApiOrderUrl-Order-List",
    "TmcApiOrderUrl-Order-Detail",
    "TmcApiOrderUrl-Order-CancelOrderHotel",
    "TmcApiOrderUrl-Order-GetOrderPays",
    "TmcApiOrderUrl-Pay-Create",
    "TmcApiOrderUrl-Pay-Process",
  ],
  member: [
    "ApiMemberUrl-Member-Get",
    "ApiMemberUrl-Passenger-List",
    "ApiMemberUrl-Passenger-Add",
    "ApiMemberUrl-Passenger-Modify",
    "ApiMemberUrl-Passenger-Remove",
  ],
  travel: [
    "TmcApiBookUrl-Home-GetTravelUrl",
    "FeatureRonglvUrl-jyx-GetTravelForms",
    "FeatureRonglvUrl-jyx-SaveTravelForms",
    "TmcApiOrderUrl-Travel-List",
    "HrApiUrl-Staff-Get",
  ],
};

async function loadMockMethods() {
  const mockDist = path.join(monorepoRoot, "packages/mock/dist/index.js");
  const mockSrc = path.join(monorepoRoot, "packages/mock/src/index.ts");

  if (fs.existsSync(mockDist)) {
    const mod = await import(pathToFileURL(mockDist).href);
    return mod.listDefaultMockMethods();
  }

  // Fallback: run against source via ts - not available; parse handler files lightly
  console.warn("mock dist not found, build @ryx/mock first for accurate check");
  return [];
}

const domains = domain === "all" ? Object.keys(DOMAIN_METHODS) : [domain];
const required = domains.flatMap((d) => DOMAIN_METHODS[d] ?? []);
const mockMethods = new Set(await loadMockMethods());

const missing = required.filter((m) => !mockMethods.has(m));

console.log(`Domain: ${domain}`);
console.log(`Required: ${required.length}, Mock registered: ${mockMethods.size}`);

if (missing.length === 0) {
  console.log("✓ Mock coverage 100%");
  process.exit(0);
}

console.error("Missing mock handlers:");
for (const m of missing) {
  console.error(`  - ${m}`);
}
process.exit(1);
