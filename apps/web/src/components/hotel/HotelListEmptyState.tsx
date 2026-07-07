import { ORDER_ASSETS, ORDER_FONT } from "@/config/order-assets";

export type HotelListEmptyVariant = "error" | "no-hotels" | "no-match";

interface HotelListEmptyStateProps {
  variant: HotelListEmptyVariant;
  message?: string;
  onRetry?: () => void;
}

const EMPTY_MESSAGE: Record<"no-hotels" | "no-match", string> = {
  "no-hotels": "暂无酒店",
  "no-match": "暂无符合条件的酒店",
};

function EmptyIllustration({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16" role="status">
      <img src={ORDER_ASSETS.empty} alt="" className="size-[95px] object-contain" aria-hidden />
      {children}
    </div>
  );
}

export function HotelListEmptyState({ variant, message, onRetry }: HotelListEmptyStateProps) {
  if (variant === "error") {
    return (
      <EmptyIllustration>
        <p className={`mt-4 text-center text-[14px] text-[#9CA3AF] ${ORDER_FONT}`}>
          {message ?? "酒店加载失败"}
        </p>
        {onRetry ? (
          <button
            type="button"
            className="mt-2 text-sm font-medium text-[#5099fe]"
            onClick={onRetry}
          >
            重试
          </button>
        ) : null}
      </EmptyIllustration>
    );
  }

  return (
    <EmptyIllustration>
      <p className={`mt-4 text-[14px] text-[#9CA3AF] ${ORDER_FONT}`}>{EMPTY_MESSAGE[variant]}</p>
    </EmptyIllustration>
  );
}

export function resolveHotelListEmptyVariant(
  filterActive: boolean,
  keyword: string,
  hasLocationSearch: boolean,
): HotelListEmptyVariant {
  if (filterActive || keyword.trim() || hasLocationSearch) {
    return "no-match";
  }
  return "no-hotels";
}
