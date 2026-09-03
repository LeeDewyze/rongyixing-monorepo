import type { HomeProductId } from "@/components/home/WebHomeTopCard";

type IdleCallback = (callback: () => void, options?: { timeout?: number }) => number;

const scheduledProducts = new Set<HomeProductId>();

function scheduleWhenIdle(task: () => void): void {
  if (typeof window === "undefined") return;

  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (connection?.saveData || connection?.effectiveType === "slow-2g") return;

  const requestIdle = (window as Window & { requestIdleCallback?: IdleCallback })
    .requestIdleCallback;
  if (requestIdle) {
    requestIdle(task, { timeout: 3000 });
    return;
  }

  window.setTimeout(task, 1500);
}

function loadModule(loader: () => Promise<unknown>): Promise<void> {
  return loader()
    .then(() => undefined)
    .catch((error) => {
      console.warn("[ryx] route chunk preload failed", error);
    });
}

function loadersForProduct(product: HomeProductId): Array<() => Promise<unknown>> {
  switch (product) {
    case "flight":
      return [
        () => import("@/pages/flight/FlightListPage"),
        () => import("@/pages/flight/FlightCabinsPage"),
        () => import("@/pages/flight/FlightBookPage"),
        () => import("@/pages/flight/FlightPayPage"),
        () => import("@/pages/order/WebOrderFlightDetailPage"),
        () => import("@/pages/order/PayResultPage"),
      ];
    case "hotel":
      return [
        () => import("@/pages/hotel/HotelListPage"),
        () => import("@/pages/hotel/HotelDetailPage"),
        () => import("@/pages/hotel/HotelRoomDetailPage"),
        () => import("@/pages/hotel/HotelBookPage"),
        () => import("@/pages/hotel/HotelMapPage"),
        () => import("@/pages/hotel/HotelPayPage"),
        () => import("@/pages/order/WebOrderHotelDetailPage"),
        () => import("@/pages/order/PayResultPage"),
      ];
    case "train":
      return [
        () => import("@/pages/train/TrainListPage"),
        () => import("@/pages/train/TrainBookPage"),
        () => import("@/pages/train/TrainPayPage"),
        () => import("@/pages/order/WebOrderTrainDetailPage"),
        () => import("@/pages/order/PayResultPage"),
      ];
  }
}

export function preloadHomeRouteChunks(product: HomeProductId): void {
  if (scheduledProducts.has(product)) return;
  scheduledProducts.add(product);

  scheduleWhenIdle(() => {
    const loaders = loadersForProduct(product);
    console.info(`[ryx] preload route chunks: ${product}`);
    void Promise.all(loaders.map(loadModule));
  });
}
