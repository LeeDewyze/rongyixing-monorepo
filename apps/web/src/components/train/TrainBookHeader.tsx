import { forwardRef } from "react";
import { useNavigate } from "react-router-dom";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { navigateBack } from "@/lib/navigation";
import { WEB_PAGE_STICKY_HEADER } from "@/lib/web-page-layout";

interface TrainBookHeaderProps {
  title?: string;
  onBack?: () => void;
}

/** Train book page header — aligned with hotel book order header. */
export const TrainBookHeader = forwardRef<HTMLDivElement, TrainBookHeaderProps>(
  function TrainBookHeader({ title = "填写订单", onBack }, ref) {
    const navigate = useNavigate();

    return (
      <div
        ref={ref}
        className={`${WEB_PAGE_STICKY_HEADER} z-30 ${HOTEL_DETAIL_FONT}`}
        style={{ background: "var(--brand-form-header-gradient)" }}
      >
        <div className="pt-[env(safe-area-inset-top)]">
          <div className="relative flex h-11 items-center px-1">
            <button
              type="button"
              onClick={onBack ?? (() => navigateBack(navigate, "/home?product=train"))}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-2xl text-brand-title active:opacity-70"
              aria-label="返回"
            >
              ‹
            </button>

            <h1 className="pointer-events-none absolute inset-x-11 truncate text-center text-base font-semibold text-brand-title">
              {title}
            </h1>

            <span className="w-11 shrink-0" aria-hidden />
          </div>
        </div>
      </div>
    );
  },
);
