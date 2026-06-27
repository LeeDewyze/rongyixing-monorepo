import { ORDER_ASSETS, ORDER_FONT } from "@/config/order-assets";

export type TrainListEmptyVariant = "loading" | "error" | "no-trains" | "no-match";

interface TrainListEmptyStateProps {
  variant: TrainListEmptyVariant;
  message?: string;
  onRetry?: () => void;
}

const EMPTY_MESSAGE: Record<"no-trains" | "no-match", string> = {
  "no-trains": "暂无车次",
  "no-match": "暂无符合条件的车次",
};

function EmptyIllustration({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16" role="status">
      <img src={ORDER_ASSETS.empty} alt="" className="size-[95px] object-contain" aria-hidden />
      {children}
    </div>
  );
}

export function TrainListEmptyState({ variant, message, onRetry }: TrainListEmptyStateProps) {
  if (variant === "loading") {
    return (
      <p
        className="py-4 text-center text-sm text-[#808080]"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        正在获取车次列表…
      </p>
    );
  }

  if (variant === "error") {
    return (
      <EmptyIllustration>
        <p className={`mt-4 text-center text-[14px] text-[#9CA3AF] ${ORDER_FONT}`}>
          {message ?? "车次加载失败"}
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
