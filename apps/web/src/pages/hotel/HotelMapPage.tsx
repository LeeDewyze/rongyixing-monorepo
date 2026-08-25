import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { navigateBack } from "@/lib/navigation";
import { loadAmap } from "@/lib/amap";

function PinIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0 text-brand-primary" aria-hidden>
      <path
        fill="currentColor"
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.2 4.5 8.5 4.5 8.5s4.5-5.3 4.5-8.5A4.5 4.5 0 0 0 8 1.5zm0 6a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"
      />
    </svg>
  );
}

export function HotelMapPage() {
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const title = searchParams.get("name")?.trim() || "地图";
  const address = searchParams.get("address")?.trim() || "";
  const returnTo = searchParams.get("returnTo")?.trim() || "";
  const lat = Number(searchParams.get("lat"));
  const lng = Number(searchParams.get("lng"));
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lng);

  usePageHeader({
    title,
    showBack: true,
    onBack: () => navigateBack(navigate, returnTo || "/"),
  });

  useEffect(() => {
    let destroyed = false;
    let map: any = null;

    async function initMap() {
      if (!mapRef.current || !hasPoint) {
        setLoading(false);
        return;
      }
      try {
        const AMap = await loadAmap();
        if (destroyed || !mapRef.current) return;

        map = new AMap.Map(mapRef.current, {
          center: [lng, lat],
          zoom: 15,
          viewMode: "2D",
          resizeEnable: true,
        });

        const marker = new AMap.Marker({
          position: [lng, lat],
        });
        marker.setMap(map);
        requestAnimationFrame(() => {
          map?.resize();
          map?.setFitView([marker]);
        });
      } catch (error) {
        if (!destroyed) {
          setLoadError(error instanceof Error ? error.message : "地图加载失败");
        }
      } finally {
        if (!destroyed) {
          setLoading(false);
        }
      }
    }

    initMap();

    return () => {
      destroyed = true;
      if (map) {
        map.destroy();
      }
    };
  }, [hasPoint, lat, lng]);

  return (
    <div className="ryx-viewport-h relative overflow-hidden bg-[#F5F6F9]">
      <div ref={mapRef} className="absolute inset-0" />

      {loading ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/55">
          <div className="rounded-full bg-white px-4 py-2 text-[13px] text-[#666666] shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
            加载中
          </div>
        </div>
      ) : null}

      {loadError ? (
        <div className="pointer-events-none absolute inset-x-3 bottom-16 rounded-xl bg-white px-4 py-3 text-[13px] text-[#E54747] shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
          {loadError}
        </div>
      ) : null}

      <div className="absolute inset-x-3 bottom-3 overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-2.5 px-4 py-3.5">
          <PinIcon />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[15px] font-medium leading-6 text-[#333333]">
              {title}
            </div>
            {address ? (
              <div className="mt-0.5 line-clamp-2 text-[13px] leading-[1.55] text-[#666666]">
                {address}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
