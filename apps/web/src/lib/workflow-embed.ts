import { getWorkflowHost, isWorkflowUrl, resolveWorkflowUrl } from "@/lib/workflow-site";

export function isWorkflowEmbedUrl(url: string): boolean {
  try {
    const resolved = resolveWorkflowUrl(url);
    return isWorkflowUrl(resolved) && new URL(resolved).hostname === getWorkflowHost();
  } catch {
    return false;
  }
}

/** Legacy Form/Detail HTML never sets window.ticket — detail.js needs it for FormNote/List. */
export function injectWorkflowPageTicket(html: string, ticket: string): string {
  if (!ticket || html.includes("window.ticket")) {
    return html;
  }

  const ticketLine = `window.ticket = ${JSON.stringify(ticket)};`;
  const formNumberMatch = html.match(/window\.FormNumber\s*=\s*"[^"]*";/);
  if (formNumberMatch) {
    return html.replace(formNumberMatch[0], `${formNumberMatch[0]}\n        ${ticketLine}`);
  }

  return html.replace(
    '<script type="text/javascript" src="/js/detail.js">',
    `<script type="text/javascript">${ticketLine}</script>\n    <script type="text/javascript" src="/js/detail.js">`,
  );
}

/** srcdoc iframe needs base href so /js/* assets resolve against the workflow site. */
export function prepareWorkflowSrcdoc(html: string, origin: string): string {
  const baseTag = `<base href="${origin.replace(/\/$/, "")}/">`;
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${baseTag}`);
  }
  return `${baseTag}${html}`;
}

export async function fetchWorkflowEmbedSrcdoc(url: string): Promise<string | undefined> {
  const resolved = resolveWorkflowUrl(url);
  let parsed: URL;
  try {
    parsed = new URL(resolved);
  } catch {
    return undefined;
  }

  if (!isWorkflowUrl(resolved) || parsed.hostname !== getWorkflowHost()) {
    return undefined;
  }

  const ticket = parsed.searchParams.get("ticket") ?? "";
  if (!ticket) {
    return undefined;
  }

  const response = await fetch(resolved);
  if (!response.ok) {
    throw new Error(`workflow embed fetch failed: HTTP ${response.status}`);
  }

  const html = await response.text();
  const origin = `${parsed.protocol}//${parsed.host}`;
  return prepareWorkflowSrcdoc(injectWorkflowPageTicket(html, ticket), origin);
}
