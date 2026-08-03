import type { FlightTicketRefundInfo } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { formatApiError } from "@/lib/formatApiError";

type FlightRefundKind = "voluntary" | "nonVoluntary";

interface FlightOrderRefundDialogProps {
  open: boolean;
  refundInfo?: FlightTicketRefundInfo;
  loading?: boolean;
  error?: unknown;
  selectedKind: FlightRefundKind;
  pending?: boolean;
  onKindChange: (kind: FlightRefundKind) => void;
  onConfirm: () => void;
  onClose: () => void;
}

function formatRefundFee(refundInfo?: FlightTicketRefundInfo) {
  if (refundInfo?.IsOffline) return "以客服实际核对为准";
  if (refundInfo?.CanAutoRefund && refundInfo.RefundFee != null && refundInfo.RefundFee !== "") {
    return `￥${refundInfo.RefundFee}`;
  }
  return "以航司规则为准";
}

function RefundOption({
  title,
  description,
  fee,
  selected,
  disabled,
  onClick,
}: {
  title: string;
  description: string;
  fee: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`w-full rounded-xl border px-3.5 py-3 text-left transition-colors disabled:opacity-60 ${
        selected
          ? "border-brand-primary bg-[#EEF4FF]"
          : "border-[#E8ECF2] bg-[#F8F9FC] active:bg-[#F2F4F8]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${
            selected ? "border-brand-primary bg-brand-primary" : "border-[#D4D8E0] bg-white"
          }`}
          aria-hidden
        >
          {selected ? <span className="size-2 rounded-full bg-white" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-medium text-brand-title">{title}</span>
          <span className="mt-1 block text-[12px] leading-relaxed text-[#666666]">
            {description}
          </span>
          <span className="mt-2 block text-[13px] font-medium text-[#FF4D4F]">
            退票费：{fee}
          </span>
        </span>
      </div>
    </button>
  );
}

export function FlightOrderRefundDialog({
  open,
  refundInfo,
  loading = false,
  error,
  selectedKind,
  pending = false,
  onKindChange,
  onConfirm,
  onClose,
}: FlightOrderRefundDialogProps) {
  if (!open) return null;

  const disabled = loading || pending;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6 ${HOTEL_DETAIL_FONT}`}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]">
        <div className="px-5 pb-4 pt-5">
          <h3 className="text-center text-[16px] font-semibold text-brand-title">退票确认</h3>
          <p className="mt-2 text-center text-[13px] leading-relaxed text-[#666666]">
            请选择退票类型，提交后将进入退票申请流程。
          </p>
        </div>

        <div className="space-y-3 px-5">
          <RefundOption
            title="自愿退票"
            description="行程变更主动退票，退票费按航司规则核算。"
            fee={loading ? "查询中..." : formatRefundFee(refundInfo)}
            selected={selectedKind === "voluntary"}
            disabled={disabled}
            onClick={() => onKindChange("voluntary")}
          />
          <RefundOption
            title="非自愿退票"
            description="航班取消、延误、超售等非旅客原因导致退票。"
            fee="￥0"
            selected={selectedKind === "nonVoluntary"}
            disabled={disabled}
            onClick={() => onKindChange("nonVoluntary")}
          />

          <p className="rounded-lg bg-[#FFF7E8] px-3 py-2 text-[12px] leading-relaxed text-[#B45309]">
            退票操作需3-15个工作日，退款操作需7-10个工作日。
          </p>

          {error ? (
            <p className="text-[12px] leading-relaxed text-[#FF4D4F]">{formatApiError(error)}</p>
          ) : null}
        </div>

        <div className="mt-5 flex gap-3 border-t border-[#F0F2F5] px-5 py-4">
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-[#DDDDDD] text-[14px] text-[#666666] active:bg-[#F5F6F9] disabled:opacity-50"
            onClick={onClose}
            disabled={pending}
          >
            取消
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-brand-primary text-[14px] font-medium text-white active:opacity-90 disabled:opacity-50"
            onClick={onConfirm}
            disabled={disabled || Boolean(error)}
          >
            {pending ? "提交中..." : "确认退票"}
          </button>
        </div>
      </div>
    </div>
  );
}
