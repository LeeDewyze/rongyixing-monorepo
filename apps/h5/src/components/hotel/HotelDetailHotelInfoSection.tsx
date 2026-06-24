import { useState } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

type InfoRowKind = "checkInOut" | "date" | "multiline" | "text";

interface InfoRow {
  label: string;
  value: string;
  kind: InfoRowKind;
}

interface HotelDetailHotelInfoSectionProps {
  checkInOutTime?: string;
  bookingNotice?: string;
  openingDate?: string;
  renovationDate?: string;
  introduction?: string;
}

function parseCheckInOutParts(value: string): { checkIn?: string; checkOut?: string } | null {
  const checkInMatch = value.match(/入住时间[：:]\s*([^离]+)/u);
  const checkOutMatch = value.match(/离店时间[：:]\s*(.+)/u);
  if (!checkInMatch?.[1] && !checkOutMatch?.[1]) return null;
  return {
    checkIn: checkInMatch?.[1]?.trim(),
    checkOut: checkOutMatch?.[1]?.trim(),
  };
}

function formatDisplayDate(value: string): string {
  const iso = value.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!iso) return value;
  const year = iso[1];
  const month = Number(iso[2]);
  const day = iso[3] ? Number(iso[3]) : undefined;
  if (day && day !== 1) return `${year}年${month}月${day}日`;
  return `${year}年${month}月`;
}

function buildRows(props: HotelDetailHotelInfoSectionProps): InfoRow[] {
  const rows: InfoRow[] = [];
  if (props.checkInOutTime) {
    rows.push({ label: "入离时间", value: props.checkInOutTime, kind: "checkInOut" });
  }
  if (props.bookingNotice) {
    rows.push({ label: "预订须知", value: props.bookingNotice, kind: "multiline" });
  }
  if (props.openingDate) {
    rows.push({
      label: "开业时间",
      value: formatDisplayDate(props.openingDate),
      kind: "date",
    });
  }
  if (props.renovationDate) {
    rows.push({
      label: "装修时间",
      value: formatDisplayDate(props.renovationDate),
      kind: "date",
    });
  }
  if (props.introduction) {
    rows.push({ label: "简介", value: props.introduction, kind: "multiline" });
  }
  return rows;
}

function SectionChevron({ expanded }: { expanded: boolean }) {
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-[#E5E7EB] bg-[#FAFBFC]">
      <svg
        viewBox="0 0 12 12"
        className={`size-2.5 text-[#666666] transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        aria-hidden
      >
        <path d="M2 4l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </span>
  );
}

function TimeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1 rounded-lg bg-white px-3 py-2.5 ring-1 ring-[#E8ECF3]">
      <span className="text-[11px] leading-none text-[#999999]">{label}</span>
      <span className="text-[14px] font-medium leading-snug text-[#333333]">{value}</span>
    </div>
  );
}

function CheckInOutDisplay({ value }: { value: string }) {
  const parts = parseCheckInOutParts(value);
  if (!parts) {
    return <p className="text-[14px] leading-[1.65] text-[#333333]">{value}</p>;
  }

  return (
    <div className="flex gap-2">
      {parts.checkIn ? <TimeChip label="入住" value={parts.checkIn} /> : null}
      {parts.checkOut ? <TimeChip label="离店" value={parts.checkOut} /> : null}
    </div>
  );
}

function InfoRowValue({ row }: { row: InfoRow }) {
  if (row.kind === "checkInOut") {
    return <CheckInOutDisplay value={row.value} />;
  }

  if (row.kind === "date") {
    return (
      <p className="text-[15px] font-medium leading-snug tracking-tight text-[#333333]">
        {row.value}
      </p>
    );
  }

  return (
    <p
      className={`text-[14px] text-[#4B5563] ${
        row.kind === "multiline" ? "leading-[1.7] text-justify" : "leading-snug"
      }`}
    >
      {row.value}
    </p>
  );
}

function InfoRowCard({ row }: { row: InfoRow }) {
  return (
    <article className="rounded-lg bg-[#F8F9FD] px-3.5 py-3">
      <h3 className="mb-2 text-[13px] font-medium text-[#2768FA]">{row.label}</h3>
      <InfoRowValue row={row} />
    </article>
  );
}

export function HotelDetailHotelInfoSection(props: HotelDetailHotelInfoSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const rows = buildRows(props);
  const hasContent = rows.length > 0;

  if (!hasContent) {
    return (
      <section className="mx-3 mt-3 overflow-hidden rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)]">
        <div className="px-4 py-8 text-center text-[14px] text-[#999999]">暂无酒店信息</div>
      </section>
    );
  }

  return (
    <section
      className={`mx-3 mt-3 overflow-hidden rounded-lg bg-white shadow-[0_2px_12px_rgba(0,0,0,0.06)] ${HOTEL_DETAIL_FONT}`}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors active:bg-[#FAFBFC] ${
          expanded ? "border-b border-[#F0F2F5]" : ""
        }`}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-3.5 w-0.5 shrink-0 rounded-full bg-[#2768FA]" aria-hidden />
          <h2 className="text-[15px] font-semibold text-[#333333]">酒店信息</h2>
          {!expanded ? (
            <span className="truncate text-[12px] font-normal text-[#9CA3AF]">
              {rows.length} 项
            </span>
          ) : null}
        </div>
        <SectionChevron expanded={expanded} />
      </button>

      <div
        className={`grid transition-[grid-template-rows] duration-300 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="space-y-2.5 px-3 pb-3.5 pt-3">
            {rows.map((row) => (
              <InfoRowCard key={row.label} row={row} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
