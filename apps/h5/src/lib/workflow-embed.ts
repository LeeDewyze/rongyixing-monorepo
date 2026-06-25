const WORKFLOW_HOST = "workflow.rtesp.com";

export function isWorkflowEmbedUrl(url: string): boolean {
  try {
    return new URL(url).hostname === WORKFLOW_HOST;
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

/** srcdoc iframe needs base href so /js/* assets resolve to workflow.rtesp.com. */
export function prepareWorkflowSrcdoc(html: string, origin: string): string {
  const baseTag = `<base href="${origin.replace(/\/$/, "")}/">`;
  if (html.includes("<head>")) {
    return html.replace("<head>", `<head>${baseTag}`);
  }
  return `${baseTag}${html}`;
}

export async function fetchWorkflowEmbedSrcdoc(url: string): Promise<string | undefined> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return undefined;
  }

  if (parsed.hostname !== WORKFLOW_HOST) {
    return undefined;
  }

  const ticket = parsed.searchParams.get("ticket") ?? "";
  if (!ticket) {
    return undefined;
  }

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`workflow embed fetch failed: HTTP ${response.status}`);
  }

  const html = await response.text();
  const origin = `${parsed.protocol}//${parsed.host}`;
  return prepareWorkflowSrcdoc(injectWorkflowPageTicket(html, ticket), origin);
}
