import type { TrainPassengerInfo } from "@ryx/shared-types";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface TrainOrderRefundDialogProps {
  open: boolean;
  pending?: boolean;
  passenger?: TrainPassengerInfo;
  onConfirm: () => void;
  onClose: () => void;
}

export function TrainOrderRefundDialog({
  open,
  pending = false,
  passenger,
  onConfirm,
  onClose,
}: TrainOrderRefundDialogProps) {
  if (!open) return null;

  const routeLabel =
    passenger?.FromStationName && passenger?.ToStationName
      ? `${passenger.FromStationName} — ${passenger.ToStationName}`
      : undefined;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 ${HOTEL_DETAIL_FONT}`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="text-center text-[16px] font-semibold text-[#333333]">退票确认</h3>
        <div className="mt-3 space-y-1 text-center text-[14px] leading-relaxed text-[#666666]">
          <p>确认为以下旅客办理退票？</p>
          {passenger?.Name ? <p className="font-medium text-[#333333]">{passenger.Name}</p> : null}
          {routeLabel ? <p>{routeLabel}</p> : null}
          {passenger?.TrainCode ? <p>车次 {passenger.TrainCode}</p> : null}
        </div>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-[#DDDDDD] text-[14px] text-[#666666]"
            onClick={onClose}
            disabled={pending}
          >
            取消
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#2768FA] text-[14px] text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "提交中…" : "确认退票"}
          </button>
        </div>
      </div>
    </div>
  );
}
