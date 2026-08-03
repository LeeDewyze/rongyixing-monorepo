import { readCachedApiConfig } from "@ryx/api";

import { getAppBaseDomain, getAppBaseProtocol } from "@/lib/env";

/**
 * Workflow host and protocol both differ between test and production, so they must never be
 * hardcoded. `/Home/Setting` is authoritative; before it is cached, derive from the app base
 * (`http://app.rtesp.com` → `http://workflow.rtesp.com`).
 */
export function getWorkflowSite(): string {
  const configured = readCachedApiConfig()?.Urls?.WorkflowWebsiteUrl?.trim();
  const site = configured || `${getAppBaseProtocol()}//workflow.${getAppBaseDomain()}`;
  return site.replace(/\/$/, "");
}

/** Hostname only — used to recognise workflow URLs that must be embedded instead of opened. */
export function getWorkflowHost(): string {
  try {
    return new URL(getWorkflowSite()).hostname;
  } catch {
    return `workflow.${getAppBaseDomain()}`;
  }
}
