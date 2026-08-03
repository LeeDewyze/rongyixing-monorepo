import type { WorkbenchGroup, WorkbenchItem } from "@ryx/shared-types";

import { getWorkflowSite } from "@/lib/workflow-site";

/** Defaults for when Workbench-Load omits the entry. */
export function travelApplyFlowUrl(): string {
  return `${getWorkflowSite()}/Form/Flow?flowtag=Travel`;
}

export function travelWorkflowTaskIndexUrl(): string {
  return `${getWorkflowSite()}/Task/Index`;
}

export function withTicketParam(url: string, ticket: string): string {
  if (!url || url.startsWith("#")) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("ticket", ticket);
    return parsed.toString();
  } catch {
    const joiner = url.includes("?") ? "&" : "?";
    return `${url}${joiner}ticket=${encodeURIComponent(ticket)}`;
  }
}

export function readWorkbenchExternalUrl(item: WorkbenchItem | undefined): string | undefined {
  if (!item?.Url) return undefined;
  if (typeof item.Url === "string") return item.Url;
  return item.Url.url || undefined;
}

export function findWorkbenchItem(
  groups: WorkbenchGroup[],
  itemName: string,
): WorkbenchItem | undefined {
  for (const group of groups) {
    const hit = group.Value?.find((item) => item.Name === itemName);
    if (hit) return hit;
  }
  return undefined;
}

export function resolveTravelApplyUrl(groups: WorkbenchGroup[], ticket: string): string {
  const item = findWorkbenchItem(groups, "出差申请");
  const base = readWorkbenchExternalUrl(item) ?? travelApplyFlowUrl();
  return withTicketParam(base, ticket);
}

export function resolveTravelWorkflowIndexUrl(groups: WorkbenchGroup[], ticket: string): string {
  const item = findWorkbenchItem(groups, "我的审批");
  const base = readWorkbenchExternalUrl(item) ?? travelWorkflowTaskIndexUrl();
  return withTicketParam(base, ticket);
}
