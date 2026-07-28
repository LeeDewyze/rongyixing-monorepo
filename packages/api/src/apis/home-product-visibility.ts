import type {
  HomeBookProduct,
  HomeSitemapItem,
  WorkbenchGroup,
  WorkbenchItem,
} from "@ryx/shared-types";

const BUSINESS_PRODUCT_ROUTES: Record<HomeBookProduct, string> = {
  flight: "tmc-flight-search",
  train: "tmc-train-search",
  hotel: "tmc-hotel-search",
};

const PERSONAL_PRODUCT_ROUTES: Record<HomeBookProduct, string> = {
  flight: "public-flight-search",
  train: "public-train-search",
  hotel: "public-hotel-search",
};

function readWorkbenchRoute(item: WorkbenchItem): string {
  const value = item.Url;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as { path?: unknown };
      if (typeof parsed.path === "string") return parsed.path.toLowerCase();
    } catch {
      return value.toLowerCase();
    }
    return value.toLowerCase();
  }
  return value?.path?.toLowerCase() ?? value?.url?.toLowerCase() ?? "";
}

function readSitemapRoute(item: HomeSitemapItem): string {
  const value = item.Url;
  if (typeof value === "string") return value.toLowerCase();
  return value?.path?.toLowerCase() || value?.url?.toLowerCase() || "";
}

export function getVisibleHomeProductsFromWorkbenches(
  groups: readonly WorkbenchGroup[],
): HomeBookProduct[] {
  const items = groups.find((group) => group.Name === "因公出行")?.Value ?? [];

  return (Object.keys(BUSINESS_PRODUCT_ROUTES) as HomeBookProduct[]).filter((product) =>
    items.some((item) => readWorkbenchRoute(item).includes(BUSINESS_PRODUCT_ROUTES[product])),
  );
}

/** Legacy home renders each workbench group as returned, so an absent group stays hidden. */
export function hasTravelApplyWorkbench(groups: readonly WorkbenchGroup[]): boolean {
  const items = groups.find((group) => group.Name === "出差申请")?.Value ?? [];
  return items.length > 0;
}

export function getVisibleHomeProductsFromSitemaps(
  items: readonly HomeSitemapItem[],
): HomeBookProduct[] {
  const navigationItems = items.filter((item) => item.Tag?.toLowerCase() === "ball");
  return (Object.keys(PERSONAL_PRODUCT_ROUTES) as HomeBookProduct[]).filter((product) =>
    navigationItems.some((item) =>
      readSitemapRoute(item).includes(PERSONAL_PRODUCT_ROUTES[product]),
    ),
  );
}
