import type { ReactNode } from "react";
import { ClearableFieldInput } from "@/components/form";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface ExpenseTypeOption {
  id: string;
  name: string;
}

interface HotelBookTravelFieldsProps {
  illegalReasons: string[];
  expenseTypes: ExpenseTypeOption[];
  illegalReason: string;
  otherIllegalReason: string;
  expenseTypeId: string;
  requireIllegalReason?: boolean;
  /** Render inside a grouped detail section card. */
  embedded?: boolean;
  onIllegalReasonChange: (value: string) => void;
  onOtherIllegalReasonChange: (value: string) => void;
  onExpenseTypeChange: (value: string) => void;
}

function FieldLabel({ children, embedded = false }: { children: ReactNode; embedded?: boolean }) {
  return (
    <span
      className={
        embedded
          ? "w-[5.75rem] shrink-0 whitespace-nowrap text-[14px] leading-none text-[#666666]"
          : "w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#808080]"
      }
    >
      {children}
    </span>
  );
}

export function HotelBookTravelFields({
  illegalReasons,
  expenseTypes,
  illegalReason,
  otherIllegalReason,
  expenseTypeId,
  requireIllegalReason = false,
  embedded = false,
  onIllegalReasonChange,
  onOtherIllegalReasonChange,
  onExpenseTypeChange,
}: HotelBookTravelFieldsProps) {
  const showIllegalReason = illegalReasons.length > 0 || requireIllegalReason;
  const showExpenseType = expenseTypes.length > 0;
  if (!showIllegalReason && !showExpenseType) return null;

  const isOtherReason = illegalReason === "其他" || illegalReason === "其它";

  const rowClass = embedded
    ? "flex min-h-[2.75rem] items-center gap-2 border-b border-[#f0f0f0] py-2.5 last:border-b-0"
    : "border-b border-[#F0F0F0] py-3";

  return (
    <div className={embedded ? "space-y-0" : `space-y-0 ${HOTEL_DETAIL_FONT}`}>
      {showIllegalReason ? (
        <div className={embedded ? rowClass : "border-b border-[#F0F0F0] py-3"}>
          <div className={`flex items-center gap-2 ${embedded ? "w-full" : "gap-3"}`}>
            <FieldLabel embedded={embedded}>超标原因{requireIllegalReason ? " *" : ""}</FieldLabel>
            {illegalReasons.length > 0 ? (
              <select
                value={illegalReason}
                onChange={(event) => onIllegalReasonChange(event.target.value)}
                className="min-w-0 flex-1 appearance-none bg-transparent text-right text-[14px] leading-tight text-[#333333] outline-none"
              >
                <option value="">请选择</option>
                {illegalReasons.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            ) : (
              <ClearableFieldInput
                type="text"
                value={otherIllegalReason}
                placeholder="请输入超标原因"
                inputClassName="min-w-0 flex-1 bg-transparent text-[14px] text-[#333333] outline-none placeholder:text-[#CCCCCC]"
                onChange={(event) => onOtherIllegalReasonChange(event.target.value)}
                onClear={() => onOtherIllegalReasonChange("")}
              />
            )}
          </div>

          {illegalReasons.length > 0 && isOtherReason ? (
            <div
              className={`mt-2 flex items-center gap-2 ${embedded ? "pl-[5.75rem]" : "pl-[5.5rem] gap-3"}`}
            >
              <ClearableFieldInput
                type="text"
                value={otherIllegalReason}
                placeholder="请输入其他原因"
                inputClassName="min-w-0 flex-1 rounded-md bg-[#F5F6F9] px-3 py-2 text-[14px] text-[#333333] outline-none placeholder:text-[#CCCCCC]"
                onChange={(event) => onOtherIllegalReasonChange(event.target.value)}
                onClear={() => onOtherIllegalReasonChange("")}
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {showExpenseType ? (
        <div className={embedded ? rowClass : "flex items-center gap-3 py-3"}>
          <FieldLabel embedded={embedded}>费用类别</FieldLabel>
          <select
            value={expenseTypeId}
            onChange={(event) => onExpenseTypeChange(event.target.value)}
            className="min-w-0 flex-1 appearance-none bg-transparent text-right text-[14px] leading-tight text-[#333333] outline-none"
          >
            <option value="">请选择</option>
            {expenseTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
          <span className="shrink-0 text-[#CCCCCC]" aria-hidden>
            ›
          </span>
        </div>
      ) : null}
    </div>
  );
}
