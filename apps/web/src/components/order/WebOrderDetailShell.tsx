import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { ORDER_FONT } from "@/config/order-assets";

interface WebOrderDetailShellProps {
  title?: string;
  statusLabel?: string;
  footer?: ReactNode;
  children: ReactNode;
  onBack?: () => void;
}

function BackIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function WebOrderDetailShell({
  title = "订单详情",
  statusLabel,
  footer,
  children,
  onBack,
}: WebOrderDetailShellProps) {
  const navigate = useNavigate();

  return (
    <div className={`min-h-full bg-[#F5F6F9] pb-8 ${ORDER_FONT}`}>
      <div className="mx-auto w-full max-w-[960px] px-4 pt-4">
        <header className="mb-4 flex items-center gap-3">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-title shadow-sm hover:bg-[#FAFBFC]"
            aria-label="返回"
            onClick={onBack ?? (() => navigate(-1))}
          >
            <BackIcon />
          </button>
          <h1 className="min-w-0 flex-1 text-[18px] font-semibold text-brand-title">{title}</h1>
          {statusLabel ? <OrderStatusBadge label={statusLabel} variant="order" /> : null}
        </header>

        <div className="space-y-3">{children}</div>
      </div>

      {footer ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#ECECEC] bg-white px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
          <div className="mx-auto flex w-full max-w-[960px] gap-3">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

export function WebOrderToast({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-1/2 z-[90] flex justify-center px-6"
      role="status"
    >
      <span className="rounded-lg bg-black/75 px-4 py-2 text-sm text-white">{message}</span>
    </div>
  );
}
