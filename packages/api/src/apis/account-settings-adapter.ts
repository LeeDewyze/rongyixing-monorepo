import type { AccountSettingsItem, SettingsMenuItem } from "@ryx/shared-types";

const SECURITY_ROUTE_MARKERS = [
  "account-security",
  "/settings/security",
  "/me/security",
  "security",
];

const NOTIFICATION_MARKERS = ["notification", "消息", "通知", "message"];

const LOGOUT_MARKERS = ["logout", "退出", "登出"];

function includesAny(haystack: string, needles: string[]): boolean {
  const lower = haystack.toLowerCase();
  return needles.some((n) => lower.includes(n.toLowerCase()));
}

function resolveRoute(item: AccountSettingsItem): string | undefined {
  const route = item.Route?.trim() || item.Url?.trim();
  if (!route) return undefined;
  if (route.includes("account-security")) return "/settings/security";
  if (route.startsWith("/")) return route;
  return undefined;
}

function classifyItem(item: AccountSettingsItem): SettingsMenuItem | null {
  const label = item.Name?.trim();
  if (!label) return null;

  const blob = [item.Name, item.Url, item.Route, item.Type, item.Value].filter(Boolean).join(" ");

  if (includesAny(blob, LOGOUT_MARKERS)) {
    return { id: "logout", label, kind: "action" };
  }
  if (includesAny(blob, NOTIFICATION_MARKERS)) {
    return { id: "notifications", label, kind: "navigate", route: "/settings/notifications" };
  }
  if (includesAny(blob, SECURITY_ROUTE_MARKERS)) {
    return { id: "security", label, kind: "navigate", route: "/settings/security" };
  }

  const route = resolveRoute(item);
  if (route) {
    return { id: `route-${route}`, label, kind: "navigate", route };
  }

  if (item.Url?.startsWith("http")) {
    return { id: `external-${label}`, label, kind: "external", href: item.Url };
  }

  if (item.Type?.toLowerCase() === "display" || item.Value) {
    return { id: `display-${label}`, label, kind: "display", value: item.Value?.trim() };
  }

  return null;
}

export const DEFAULT_SETTINGS_MENU: SettingsMenuItem[] = [
  { id: "security", label: "账号与安全", kind: "navigate", route: "/settings/security" },
  { id: "notifications", label: "消息通知", kind: "navigate", route: "/settings/notifications" },
];

export function adaptAccountSettingsItems(
  items: AccountSettingsItem[] | undefined,
): SettingsMenuItem[] {
  if (!items?.length) return DEFAULT_SETTINGS_MENU;

  const mapped = items
    .map(classifyItem)
    .filter((item): item is SettingsMenuItem => item != null && item.id !== "logout");

  const deduped: SettingsMenuItem[] = [];
  const seen = new Set<string>();
  for (const item of mapped) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    deduped.push(item);
  }

  return deduped.length ? deduped : DEFAULT_SETTINGS_MENU;
}
