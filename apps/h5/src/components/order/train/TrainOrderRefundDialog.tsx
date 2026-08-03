import type { TrainPassengerInfo } from "@ryx/shared-types";

import trainRouteArrow from "@/assets/train/route-arrow.png";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { parseLocalDate } from "@/lib/date-search";
import { formatTrainClock } from "@/utils/train-list";

interface TrainOrderRefundDialogProps {
  open: boolean;
  pending?: boolean;
  orderId?: string;
  passenger?: TrainPassengerInfo;
  /** Fallback when refund passenger snapshot omits arrival time. */
  arrivalTime?: string;
  onConfirm: () => void;
  onClose: () => void;
}

const REFUND_CARD_CLASS =
  "overflow-hidden rounded-xl bg-gradient-to-b from-[#FAFBFF] to-[#F4F7FC] shadow-[0_2px_12px_rgba(39,104,250,0.06)] ring-1 ring-[#E8EDF5]";

function formatRefundDepartureLabel(startTime?: string): string | null {
  const datePart = startTime?.slice(0, 10);
  if (!datePart || !/^\d{4}-\d{2}-\d{2}$/.test(datePart)) return null;
  const date = parseLocalDate(datePart);
  if (!date) return null;
  const [year, month, day] = datePart.split("-");
  const weekday = ["日", "一", "二", "三", "四", "五", "六"][date.getDay()];
  return `${year}年${month}月${day} 周${weekday}`;
}

function RefundTicketCard({
  orderId,
  passenger,
  arrivalTime,
}: {
  orderId?: string;
  passenger?: TrainPassengerInfo;
  arrivalTime?: string;
}) {
  const resolvedArrivalTime = passenger?.ArrivalTime ?? arrivalTime;
  const departureLabel = formatRefundDepartureLabel(passenger?.StartTime);
  const credentialLabel =
    passenger?.HideCredentialsNumber?.trim() || passenger?.CredentialsTypeName?.trim() || undefined;

  return (
    <div className={`mt-4 ${REFUND_CARD_CLASS}`}>
      <div className="px-4 py-3.5">
        {orderId ? (
          <p className="text-[12px] leading-none text-[#999999]">订单编号:{orderId}</p>
        ) : null}

        <div
          className={`grid grid-cols-[minmax(0,1fr)_5.5rem_minmax(0,1fr)] items-start gap-x-2 ${orderId ? "mt-3" : ""}`}
        >
          <div className="min-w-0">
            <p className="truncate text-[13px] leading-snug text-[#666666]">
              {passenger?.FromStationName ?? "—"}
            </p>
            <p className="mt-1 text-[22px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
              {passenger?.StartTime ? formatTrainClock(passenger.StartTime) : "—"}
            </p>
          </div>

          <div className="pt-5 text-center">
            <div className="flex items-center justify-center">
              <img
                src={trainRouteArrow}
                alt=""
                width={56}
                height={12}
                className="h-3 w-14 object-contain"
                aria-hidden
              />
            </div>
            {passenger?.TrainCode ? (
              <span className="mt-1.5 inline-flex max-w-full items-center rounded-full bg-[#EEF4FF] px-2 py-0.5 text-[11px] font-medium leading-none text-[#2768FA] ring-1 ring-[#D6E4FF]">
                <span className="truncate">{passenger.TrainCode}</span>
              </span>
            ) : null}
          </div>

          <div className="min-w-0 text-right">
            <p className="truncate text-[13px] leading-snug text-[#666666]">
              {passenger?.ToStationName ?? "—"}
            </p>
            <p className="mt-1 text-[22px] font-semibold leading-none tracking-tight tabular-nums text-[#1a1a1a]">
              {resolvedArrivalTime ? formatTrainClock(resolvedArrivalTime) : "—"}
            </p>
          </div>
        </div>

        {departureLabel ? (
          <p className="mt-3 text-[13px] leading-snug text-[#333333]">发车时间：{departureLabel}</p>
        ) : null}

        {passenger?.Name ? (
          <p className="mt-2 text-[13px] leading-snug text-[#333333]">
            <span className="font-medium">{passenger.Name}</span>
            {credentialLabel ? <span className="text-[#666666]">：{credentialLabel}</span> : null}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function TrainOrderRefundDialog({
  open,
  pending = false,
  orderId,
  passenger,
  arrivalTime,
  onConfirm,
  onClose,
}: TrainOrderRefundDialogProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 ${HOTEL_DETAIL_FONT}`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="text-center text-[16px] font-semibold text-[#333333]">退票信息</h3>

        <RefundTicketCard orderId={orderId} passenger={passenger} arrivalTime={arrivalTime} />

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-[#DDDDDD] text-[14px] text-[#666666] disabled:opacity-50"
            onClick={onClose}
            disabled={pending}
          >
            取消
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#FF5B57] text-[14px] font-medium text-white disabled:opacity-50"
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
