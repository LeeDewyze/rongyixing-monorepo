import type { HotelCity, HotelMapPoint } from "@ryx/shared-types";

import { getApi } from "@/lib/api";

type BMapAddress = {
  city?: string;
  province?: string;
  district?: string;
  street?: string;
  street_number?: string;
};

interface PositionLike {
  lat: number;
  lng: number;
  cityName?: string;
  address?: BMapAddress;
}

/** Legacy ryx: `${city}${district}${street}` when user taps 我的位置. */
export function buildHotelMyPositionText(address?: BMapAddress): string {
  if (!address) return "";
  return `${address.city ?? ""}${address.district ?? ""}${address.street ?? ""}`.trim();
}

type BMapPosition = {
  point?: { lat: number; lng: number };
  address?: BMapAddress;
};

type BMapRuntime = typeof globalThis & {
  BMap?: any;
  init?: () => void;
  BMAP_PROTOCOL?: string;
  BMap_loadScriptTime?: number;
  BMAP_STATUS_SUCCESS?: number;
};

function loadBMapScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    const runtime = globalThis as BMapRuntime;
    if (runtime.BMap) {
      resolve();
      return;
    }

    const existing = document.body.querySelector<HTMLScriptElement>("#bmapscript");
    if (existing) {
      const waitForBMap = window.setInterval(() => {
        if ((globalThis as BMapRuntime).BMap) {
          window.clearInterval(waitForBMap);
          window.clearTimeout(timeoutId);
          resolve();
        }
      }, 200);
      const timeoutId = window.setTimeout(() => {
        window.clearInterval(waitForBMap);
        if (!(globalThis as BMapRuntime).BMap) reject(new Error("百度地图加载失败"));
      }, 15_000);
      return;
    }

    const ak = "BFddaa13ba2d76f4806d1abb98ef907c";
    const script = document.createElement("script");
    script.id = "bmapscript";
    script.setAttribute("bmapscript", "bmapscript");
    script.type = "text/javascript";
    script.src = `https://api.map.baidu.com/api?v=3.0&ak=${ak}&callback=init`;
    runtime.BMAP_PROTOCOL = "https";
    runtime.BMap_loadScriptTime = Date.now();

    const previousInit = runtime.init;
    runtime.init = () => {
      previousInit?.();
      resolve();
    };

    const timeoutId = window.setTimeout(() => {
      reject(new Error("百度地图加载失败"));
    }, 15_000);
    script.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error("百度地图加载失败"));
    };
    document.body.appendChild(script);
  });
}

function getBMapPosition(): Promise<PositionLike> {
  return new Promise((resolve, reject) => {
    const runtime = globalThis as BMapRuntime;
    const BMap = runtime.BMap;
    if (!BMap) {
      reject(new Error("百度地图未加载"));
      return;
    }

    const geolocation = new BMap.Geolocation();
    let settled = false;
    const timer = window.setTimeout(
      () => {
        if (settled) return;
        settled = true;
        reject(new Error("定位超时"));
      },
      2 * 60 * 1000,
    );

    geolocation.getCurrentPosition(
      (result: BMapPosition) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        const status = geolocation.getStatus?.();
        if (status != null && status !== runtime.BMAP_STATUS_SUCCESS && status !== 0) {
          const statusText: Record<number, string> = {
            1: "城市列表",
            2: "位置结果未知",
            3: "导航结果未知",
            4: "非法密钥",
            5: "非法请求",
            6: "没有权限",
            7: "服务不可用",
            8: "定位超时",
          };
          reject(new Error(`百度定位失败：${statusText[status] ?? status}`));
          return;
        }
        const point = result?.point;
        if (!point) {
          reject(new Error("百度定位未返回坐标"));
          return;
        }
        resolve({
          lat: point.lat,
          lng: point.lng,
          cityName: result?.address?.city,
          address: result?.address,
        });
      },
      {
        enableHighAccuracy: true,
        SDKLocation: true,
      },
    );
  });
}

async function getIpFallbackPosition(): Promise<PositionLike | null> {
  try {
    const BMap = (globalThis as BMapRuntime).BMap;
    if (!BMap?.LocalCity) return null;
    return await new Promise<PositionLike | null>((resolve) => {
      const myCity = new BMap.LocalCity();
      const timer = window.setTimeout(() => resolve(null), 50_000);
      myCity.get((rs: { center?: { lat: number; lng: number }; name?: string }) => {
        window.clearTimeout(timer);
        if (rs?.center) {
          resolve({
            lat: rs.center.lat,
            lng: rs.center.lng,
            cityName: rs.name,
          });
          return;
        }
        resolve(null);
      });
    });
  } catch {
    return null;
  }
}

function toPoint(pos: { lat: number; lng: number }): HotelMapPoint {
  return { lat: pos.lat, lng: pos.lng };
}

/** Legacy ryx map.service: BMap.Geocoder.getLocation after GPS coords. */
async function reverseGeocodeBMapAddress(lat: number, lng: number): Promise<BMapAddress | null> {
  const BMap = (globalThis as BMapRuntime).BMap;
  if (!BMap?.Geocoder) return null;

  const pt = new BMap.Point(lng, lat);
  return new Promise((resolve) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      resolve(null);
    }, 25_000);

    const geoc = new BMap.Geocoder({ extensions_town: true });
    geoc.getLocation(
      pt,
      (rs: {
        addressComponents?: {
          city?: string;
          province?: string;
          district?: string;
          street?: string;
          streetNumber?: string;
        };
      }) => {
        if (settled) return;
        settled = true;
        window.clearTimeout(timer);
        const addComp = rs?.addressComponents;
        if (!addComp) {
          resolve(null);
          return;
        }
        resolve({
          city: addComp.city,
          province: addComp.province,
          district: addComp.district,
          street: addComp.street,
          street_number: addComp.streetNumber,
        });
      },
    );
  });
}

async function enrichPositionAddress(position: PositionLike): Promise<PositionLike> {
  const geocoded = await reverseGeocodeBMapAddress(position.lat, position.lng);
  if (!geocoded) return position;

  return {
    ...position,
    cityName: position.cityName ?? geocoded.city,
    address: geocoded,
  };
}

async function getCurrentPosition(): Promise<PositionLike> {
  try {
    await loadBMapScript();
  } catch (error) {
    throw new Error(`百度地图加载失败：${error instanceof Error ? error.message : "请重试"}`);
  }

  const point = await getBMapPosition().catch((error: unknown) => {
    console.error("[hotel-location] bmap position failed", error);
    return null;
  });
  if (point) return enrichPositionAddress(point);

  const ipFallback = await getIpFallbackPosition();
  if (ipFallback) return enrichPositionAddress(ipFallback);

  throw new Error("定位失败，请检查定位权限或网络后重试");
}

export async function resolveHotelCityByLocation(): Promise<{
  city: HotelCity | null;
  cityName: string | null;
  position: { lat: number; lng: number } | null;
  addressText: string;
}> {
  const position = await getCurrentPosition();
  const city = await getApi()
    .hotel.getCityByMap(toPoint(position))
    .catch(() => null);
  return {
    city,
    cityName: position.cityName ?? city?.Name ?? null,
    position: { lat: position.lat, lng: position.lng },
    addressText: buildHotelMyPositionText(position.address),
  };
}
