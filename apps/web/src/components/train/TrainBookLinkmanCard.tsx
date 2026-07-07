import type { TrainBookLinkmanDto } from "@ryx/shared-types";
import type { ReactNode } from "react";

import { ClearableFieldInput } from "@/components/form";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

interface TrainBookLinkmanCardProps {
  linkman: TrainBookLinkmanDto;
  onChange: (patch: Partial<TrainBookLinkmanDto>) => void;
}

function LinkmanField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-[2.75rem] items-center gap-3 border-b border-[#f0f0f0] py-2.5 last:border-b-0">
      <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] text-[#666666]">
        {label}
      </span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</div>
    </div>
  );
}

const inputClass =
  "w-full min-w-0 bg-transparent text-right text-[14px] leading-tight text-[#333333] outline-none placeholder:text-[#cccccc]";

export function TrainBookLinkmanCard({ linkman, onChange }: TrainBookLinkmanCardProps) {
  return (
    <section
      className={`overflow-hidden rounded-lg bg-white px-3.5 shadow-sm ring-1 ring-[#EEF1F6] ${HOTEL_DETAIL_FONT}`}
    >
      <h2 className="border-b border-[#f0f0f0] py-3 text-[15px] font-semibold text-[#111111]">
        联系人信息
      </h2>
      <LinkmanField label="联系人姓名">
        <ClearableFieldInput
          type="text"
          value={linkman.Name ?? ""}
          placeholder="请输入"
          onChange={(event) => onChange({ Name: event.target.value })}
          onClear={() => onChange({ Name: "" })}
          inputClassName={inputClass}
        />
      </LinkmanField>
      <LinkmanField label="联系电话">
        <ClearableFieldInput
          type="tel"
          inputMode="tel"
          value={linkman.Mobile ?? ""}
          placeholder="请输入"
          onChange={(event) => onChange({ Mobile: event.target.value })}
          onClear={() => onChange({ Mobile: "" })}
          inputClassName={inputClass}
        />
      </LinkmanField>
      <LinkmanField label="E-mail">
        <ClearableFieldInput
          type="email"
          value={linkman.Email ?? ""}
          placeholder="请输入"
          onChange={(event) => onChange({ Email: event.target.value })}
          onClear={() => onChange({ Email: "" })}
          inputClassName={inputClass}
        />
      </LinkmanField>
    </section>
  );
}
