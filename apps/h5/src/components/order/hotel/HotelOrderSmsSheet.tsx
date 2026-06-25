import { useState } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelOrderCancelDialogProps {
  open: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function HotelOrderCancelDialog({
  open,
  pending = false,
  onConfirm,
  onClose,
}: HotelOrderCancelDialogProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 ${HOTEL_DETAIL_FONT}`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="text-center text-[16px] font-semibold text-[#333333]">取消订单</h3>
        <p className="mt-3 text-center text-[14px] leading-relaxed text-[#666666]">
          确定要取消该酒店订单吗？取消后可能无法恢复。
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full border border-[#DDDDDD] text-[14px] text-[#666666]"
            onClick={onClose}
            disabled={pending}
          >
            再想想
          </button>
          <button
            type="button"
            className="flex h-10 flex-1 items-center justify-center rounded-full bg-[#2768FA] text-[14px] text-white disabled:opacity-50"
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? "取消中…" : "确认取消"}
          </button>
        </div>
      </div>
    </div>
  );
}

interface HotelOrderSmsSheetProps {
  open: boolean;
  mode: "sendCode" | "confirmCode";
  mobile?: string;
  pending?: boolean;
  error?: string;
  onSend?: (mobile: string) => void;
  onConfirm?: (code: string) => void;
  onClose: () => void;
}

export function HotelOrderSmsSheet({
  open,
  mode,
  mobile: defaultMobile,
  pending = false,
  error,
  onSend,
  onConfirm,
  onClose,
}: HotelOrderSmsSheetProps) {
  const [mobile, setMobile] = useState(defaultMobile ?? "");
  const [code, setCode] = useState("");

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-8 ${HOTEL_DETAIL_FONT}`}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-5">
        <h3 className="text-center text-[16px] font-semibold text-[#333333]">
          {mode === "sendCode" ? "获取短信验证码" : "短信验证码校验"}
        </h3>
        {mode === "sendCode" ? (
          <input
            type="tel"
            value={mobile}
            onChange={(event) => setMobile(event.target.value)}
            placeholder="请输入手机号"
            className="mt-4 w-full rounded-lg border border-[#EEEEEE] px-3 py-2.5 text-[14px] outline-none focus:border-[#2768FA]"
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="请输入验证码"
            className="mt-4 w-full rounded-lg border border-[#EEEEEE] px-3 py-2.5 text-[14px] outline-none focus:border-[#2768FA]"
          />
        )}
        {error ? <p className="mt-2 text-center text-[13px] text-[#FF4D4F]">{error}</p> : null}
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
            disabled={pending}
            onClick={() => {
              if (mode === "sendCode") {
                onSend?.(mobile);
              } else {
                onConfirm?.(code);
              }
            }}
          >
            {pending ? "提交中…" : "确定"}
          </button>
        </div>
      </div>
    </div>
  );
}
