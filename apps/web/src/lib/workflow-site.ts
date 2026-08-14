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

/** Workflow API host for StaffCtrl and related JSON endpoints. */
export function getWorkflowApiSite(): string {
  const configured = readCachedApiConfig()?.Urls?.WorkflowApiUrl?.trim();
  const site = configured || `${getAppBaseProtocol()}//api-workflow.${getAppBaseDomain()}`;
  return site.replace(/\/$/, "");
}

/** Expense BPM host for TravelTask/Send and related travel endpoints. */
export function getBpmExpenseSite(): string {
  const configured = readCachedApiConfig()?.Urls?.BpmWebsiteExpenseUrl?.trim();
  const site = configured || `${getAppBaseProtocol()}//expense-bpm.${getAppBaseDomain()}`;
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

/** Whether a URL targets a workflow site (any environment). */
export function isWorkflowUrl(url: string): boolean {
  try {
    return new URL(url).hostname.startsWith("workflow.");
  } catch {
    return false;
  }
}

/**
 * Rewrite workflow URLs from API payloads to the active workflow site.
 * Task list responses may still reference a legacy host (e.g. workflow.rtesp.com on prod).
 */
export function resolveWorkflowUrl(url: string): string {
  if (!url || url.startsWith("#")) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.startsWith("workflow.")) return url;
    const site = new URL(getWorkflowSite());
    parsed.protocol = site.protocol;
    parsed.host = site.host;
    return parsed.toString();
  } catch {
    return url;
  }
}
