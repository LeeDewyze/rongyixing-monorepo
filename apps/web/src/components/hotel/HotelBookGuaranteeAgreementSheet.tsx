import { HOTEL_GUARANTEE_AGREEMENT_PARAGRAPHS } from "@/lib/hotel-book-guarantee-agreement";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface HotelBookGuaranteeAgreementSheetProps {
  open: boolean;
  onClose: () => void;
}

/** Legacy GuaranteeAgreementComponent — credit-card guarantee terms. */
export function HotelBookGuaranteeAgreementSheet({
  open,
  onClose,
}: HotelBookGuaranteeAgreementSheetProps) {
  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[75] flex flex-col justify-end bg-black/45 ${HOTEL_DETAIL_FONT}`}
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="hotel-guarantee-agreement-title"
        className="flex max-h-[min(85vh,720px)] flex-col overflow-hidden rounded-t-2xl bg-white"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0 border-b border-[#F0F2F5] px-5 py-4">
          <h2
            id="hotel-guarantee-agreement-title"
            className="text-center text-[16px] font-semibold text-[#333333]"
          >
            担保协议
          </h2>
          <button
            type="button"
            className="absolute right-4 top-3.5 text-[14px] text-[#666666] active:opacity-70"
            onClick={onClose}
          >
            关闭
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <h3 className="text-[15px] font-semibold text-[#333333]">
            本应用快捷支付及信用卡担保协议
          </h3>
          <div className="mt-3 space-y-3">
            {HOTEL_GUARANTEE_AGREEMENT_PARAGRAPHS.map((paragraph, index) => (
              <p key={index} className="text-[13px] leading-[1.7] text-[#666666]">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
