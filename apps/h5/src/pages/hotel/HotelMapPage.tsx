import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { showAppAlertDialog } from "@/lib/app-confirm-dialog";
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

function CopyIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path
        fill="currentColor"
        d="M5 1.75A1.75 1.75 0 0 0 3.25 3.5V4H3a1.75 1.75 0 0 0-1.75 1.75v7.5A1.75 1.75 0 0 0 3 15h5.5a1.75 1.75 0 0 0 1.75-1.75V13h.25A1.75 1.75 0 0 0 12.25 11.25v-7.5A1.75 1.75 0 0 0 10.5 2H10V1.75A1.75 1.75 0 0 0 8.25 0H5Zm0 1.5h3.25a.25.25 0 0 1 .25.25V4H5.25a.25.25 0 0 1-.25-.25V3.5a.25.25 0 0 1 0-.25Zm-1.75 2.25h7.25a.25.25 0 0 1 .25.25v7.5a.25.25 0 0 1-.25.25H3a.25.25 0 0 1-.25-.25v-7.5a.25.25 0 0 1 .25-.25Zm3.5 3.25h3v1.5h-3v-1.5Zm-2 2.5h5v1.5h-5v-1.5Z"
      />
    </svg>
  );
}

async function copyText(text: string): Promise<boolean> {
  const value = text.trim();
  if (!value) return false;

  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch {
      // Fall back to textarea copy for old Android WebViews.
    }
  }

  if (typeof document === "undefined") return false;

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "readonly");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
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
  const showAddress = Boolean(address);

  usePageHeader({
    title,
    showBack: true,
    onBack: () => navigateBack(navigate, returnTo || "/home"),
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

  async function handleCopyAddress() {
    if (!address) return;
    const copied = await copyText(address);
    if (copied) {
      await showAppAlertDialog("地址已复制");
    }
  }

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

      <div className="absolute inset-x-2 bottom-2 overflow-hidden rounded-xl bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-start gap-2 px-3.5 py-3">
          <PinIcon />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium leading-5 text-[#333333]">
              {title}
            </div>
            {showAddress ? (
              <div className="mt-1 flex items-start gap-2">
                <p className="min-w-0 flex-1 line-clamp-2 text-[12px] leading-[1.5] text-[#666666]">
                  {address}
                </p>
                <button
                  type="button"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#F5F7FB] px-2.5 py-1 text-[12px] font-medium text-brand-primary active:bg-[#EAF1FF]"
                  onClick={handleCopyAddress}
                >
                  <CopyIcon />
                  复制
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
