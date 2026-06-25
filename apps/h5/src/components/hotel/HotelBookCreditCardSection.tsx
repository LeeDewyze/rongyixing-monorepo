import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import type { HotelCreditCardForm } from "@/lib/hotel-book";

interface HotelBookCreditCardSectionProps {
  value: HotelCreditCardForm;
  onChange: (patch: Partial<HotelCreditCardForm>) => void;
}

const inputClass =
  "min-w-0 flex-1 rounded-lg border border-[#EEEEEE] px-3 py-2 text-[14px] text-[#333333] outline-none focus:border-[#2768FA]";

export function HotelBookCreditCardSection({ value, onChange }: HotelBookCreditCardSectionProps) {
  return (
    <section
      className={`rounded-xl bg-white px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className="text-[16px] font-semibold text-[#222222]">信用卡担保</h2>
      <p className="mt-1 text-[12px] leading-snug text-[#999999]">
        晚到店需信用卡担保，请填写持卡人信息
      </p>

      <div className="mt-3 space-y-3">
        <label className="flex items-center gap-3 text-[14px]">
          <span className="w-[5.5rem] shrink-0 text-[#808080]">卡号</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            className={inputClass}
            value={value.cardNumber}
            placeholder="请输入卡号"
            onChange={(event) => onChange({ cardNumber: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-3 text-[14px]">
          <span className="w-[5.5rem] shrink-0 text-[#808080]">持卡人</span>
          <input
            type="text"
            autoComplete="cc-name"
            className={inputClass}
            value={value.holderName}
            placeholder="请输入姓名"
            onChange={(event) => onChange({ holderName: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-3 text-[14px]">
          <span className="w-[5.5rem] shrink-0 text-[#808080]">有效期</span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="cc-exp"
            className={inputClass}
            value={value.expireDate}
            placeholder="MM/YY"
            onChange={(event) => onChange({ expireDate: event.target.value })}
          />
        </label>
        <label className="flex items-center gap-3 text-[14px]">
          <span className="w-[5.5rem] shrink-0 text-[#808080]">安全码</span>
          <input
            type="password"
            inputMode="numeric"
            autoComplete="cc-csc"
            className={inputClass}
            value={value.cvv}
            placeholder="CVV"
            onChange={(event) => onChange({ cvv: event.target.value })}
          />
        </label>
      </div>
    </section>
  );
}
