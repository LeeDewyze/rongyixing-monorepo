import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface TrainOrderIssueDialogProps {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function TrainOrderIssueDialog({
  open,
  pending = false,
  onConfirm,
  onClose,
}: TrainOrderIssueDialogProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 ${HOTEL_DETAIL_FONT}`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="text-center text-[16px] font-semibold text-[#333333]">确认出票</h3>
        <p className="mt-3 text-center text-[14px] leading-relaxed text-[#666666]">
          确认提交出票请求？出票后订单将进入待出行状态。
        </p>
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
            {pending ? "提交中…" : "确认出票"}
          </button>
        </div>
      </div>
    </div>
  );
}
