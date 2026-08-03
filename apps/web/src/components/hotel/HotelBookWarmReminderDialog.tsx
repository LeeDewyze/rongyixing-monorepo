import { useState } from "react";

import { HotelBookGuaranteeAgreementSheet } from "@/components/hotel/HotelBookGuaranteeAgreementSheet";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

import "./hotel-book-warm-reminder-dialog.css";

interface HotelBookWarmReminderDialogProps {
  open: boolean;
  paragraphs: string[];
  agreed: boolean;
  pending?: boolean;
  /** Legacy warranty `isShowCreditCard` — show guarantee agreement link. */
  showCreditCard?: boolean;
  onAgreedChange: (agreed: boolean) => void;
  onConfirm: () => void;
  onClose: () => void;
}

function DialogCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] active:bg-[#EBEDF0]"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

/** Legacy `warranty` component — centered warm reminder before hotel book submit. */
export function HotelBookWarmReminderDialog({
  open,
  paragraphs,
  agreed,
  pending = false,
  showCreditCard = false,
  onAgreedChange,
  onConfirm,
  onClose,
}: HotelBookWarmReminderDialogProps) {
  const [guaranteeOpen, setGuaranteeOpen] = useState(false);
  const [shakeAgreement, setShakeAgreement] = useState(false);

  if (!open) return null;

  function handleConfirm() {
    if (!agreed) {
      setShakeAgreement(true);
      return;
    }
    onConfirm();
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-6 backdrop-blur-[2px] ${HOTEL_DETAIL_FONT}`}
        role="presentation"
        onClick={onClose}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="hotel-warm-reminder-title"
          className="flex max-h-[min(82vh,640px)] w-full max-w-[340px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative shrink-0 px-5 pb-3 pt-5">
            <h2
              id="hotel-warm-reminder-title"
              className="text-center text-[17px] font-semibold text-[#333333]"
            >
              温馨提示
            </h2>
            <div className="absolute right-4 top-4">
              <DialogCloseButton onClose={onClose} />
            </div>
            <p className="mt-2 text-center text-[12px] leading-[1.5] text-[#999999]">
              提交前请仔细阅读以下条款
            </p>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-2">
            <div className="space-y-3">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[13px] leading-[1.65] text-[#333333]"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </div>

          <div className="shrink-0 border-t border-[#F0F2F5] bg-[#FAFBFC] px-5 pb-5 pt-4">
            <div
              className={`rounded-xl bg-white px-3 py-3 ring-1 ring-[#EEF1F6] ${shakeAgreement ? "hotel-warm-reminder-shake" : ""}`}
              onAnimationEnd={() => setShakeAgreement(false)}
            >
              <label className="flex cursor-pointer items-start gap-3 active:opacity-90">
                <span className="relative mt-0.5 flex size-5 shrink-0 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(event) => onAgreedChange(event.target.checked)}
                    className="peer absolute inset-0 opacity-0"
                  />
                  <span className="size-5 rounded-[4px] border border-[#CCCCCC] bg-white peer-checked:border-brand-primary peer-checked:bg-brand-primary" />
                  <svg
                    viewBox="0 0 12 12"
                    className="pointer-events-none absolute hidden size-3 text-white peer-checked:block"
                    aria-hidden
                  >
                    <path
                      d="M2.5 6l2.2 2.2 4.8-4.8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span className="text-[13px] leading-[1.55] text-[#666666]">
                  我已阅读以上温馨提示
                  {showCreditCard ? (
                    <>
                      和
                      <button
                        type="button"
                        className="ml-0.5 text-brand-primary underline-offset-2 active:opacity-70"
                        onClick={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          setGuaranteeOpen(true);
                        }}
                      >
                        本应用快捷支付及信用卡担保协议
                      </button>
                    </>
                  ) : null}
                </span>
              </label>
            </div>

            <button
              type="button"
              disabled={pending}
              className="mt-3 flex h-10 w-full items-center justify-center rounded-[24px] bg-[linear-gradient(270deg,var(--brand-btn-end)_0%,var(--brand-btn-start)_100%)] text-[15px] font-medium text-white shadow-[0_4px_12px_rgba(39,104,250,0.24)] active:opacity-90 disabled:opacity-50"
              onClick={handleConfirm}
            >
              {pending ? "提交中…" : "确定"}
            </button>
          </div>
        </div>
      </div>

      <HotelBookGuaranteeAgreementSheet open={guaranteeOpen} onClose={() => setGuaranteeOpen(false)} />
    </>
  );
}
