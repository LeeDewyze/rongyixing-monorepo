import type { ApprovalTask } from "@ryx/shared-types";

import { getRequestLanguage } from "@/lib/request-context";
import { getTicket } from "@/lib/session";

/** Legacy header title: text inside the first 【】 pair. */
export function extractTaskTitle(name: string | undefined): string {
  if (!name) return "";
  const start = name.indexOf("【");
  const end = name.indexOf("】");
  if (start >= 0 && end > start) {
    return name.slice(start + 1, end);
  }
  return name;
}

function appendQueryParams(base: string, params: Record<string, string>): string {
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    if (!url.searchParams.has(key)) {
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

/** Legacy open-url — append ticket/lang for workflow pages embedded in iframe. */
export function buildWorkflowOpenUrl(url: string): string {
  const ticket = getTicket() ?? "";
  const lang = getRequestLanguage();
  return appendQueryParams(url, {
    ticket,
    isApp: "true",
    lang,
    opentype: "iframe",
  });
}

/** Legacy `getTaskHandleUrl` — append ticket for in-app H5 approval pages. */
export function buildApprovalTaskOpenUrl(task: ApprovalTask): string | undefined {
  const base = task.handleUrl ?? task.url;
  if (!base) return undefined;
  const ticket = getTicket() ?? "";
  const lang = getRequestLanguage();
  const withAuth = appendQueryParams(base, {
    ticket,
    isApp: "true",
    lang,
    opentype: "iframe",
  });
  if (withAuth.includes("taskid=") || withAuth.includes("taskId=")) {
    return withAuth;
  }
  const separator = withAuth.includes("?") ? "&" : "?";
  return `${withAuth}${separator}taskid=${encodeURIComponent(task.id)}`;
}

export function openApprovalTask(task: ApprovalTask): void {
  const url = buildApprovalTaskOpenUrl(task);
  if (!url) return;
  window.location.assign(url);
}
