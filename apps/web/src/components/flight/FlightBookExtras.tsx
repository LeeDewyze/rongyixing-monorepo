import type { ReactNode } from "react";
import { BookOptionChevron } from "@/components/book/BookOptionChevron";
import { formatFlightNotifyLanguage, type FlightNotifyLanguage } from "@/lib/flight-book-notify";

export interface FlightBookServiceFeeRow {
  passengerId: string;
  passengerName: string;
  fee: number;
}

const rowClass =
  "flex min-h-[2.5rem] items-center gap-2 border-b border-[#EEF1F6] py-2 last:border-b-0";
const insetRowClass = "flex min-h-[2.5rem] items-center justify-between gap-3 py-2";
const insetLabelClass =
  "w-[5.5rem] shrink-0 whitespace-nowrap text-[16px] font-medium leading-none text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";
const splitLabelClass =
  "shrink-0 whitespace-nowrap text-[16px] font-medium leading-none text-[#010101] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

export function FlightBookInsetCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl bg-[#F8F9FC] px-3.5 py-1 ring-1 ring-[#EEF1F6]">
      {children}
    </div>
  );
}

function SectionedInsetCard({ children }: { children: ReactNode }) {
  return <FlightBookInsetCard>{children}</FlightBookInsetCard>;
}

interface FlightBookNotifyLanguageRowProps {
  notifyLanguage: FlightNotifyLanguage;
  onOpenNotifyLanguage: () => void;
  /** Inside FlightBookPassengerSection — inset card. */
  sectioned?: boolean;
  /** Row only — parent provides inset card wrapper. */
  bare?: boolean;
}

export function FlightBookNotifyLanguageRow({
  notifyLanguage,
  onOpenNotifyLanguage,
  sectioned = false,
  bare = false,
}: FlightBookNotifyLanguageRowProps) {
  const row = (
    <div className={sectioned ? insetRowClass : rowClass}>
      <span className={sectioned ? splitLabelClass : insetLabelClass}>通知语言</span>
      <button
        type="button"
        className={
          sectioned
            ? "flex shrink-0 items-center gap-1 text-[14px] leading-tight text-[#333333]"
            : "flex min-w-0 flex-1 items-center justify-end gap-1 truncate text-[14px] leading-tight text-[#333333]"
        }
        onClick={onOpenNotifyLanguage}
      >
        <span className={sectioned ? undefined : "truncate"}>
          {formatFlightNotifyLanguage(notifyLanguage)}
        </span>
        <BookOptionChevron inCircle={false} />
      </button>
    </div>
  );

  if (bare) return row;
  if (sectioned) return <SectionedInsetCard>{row}</SectionedInsetCard>;
  return <div className="mt-1 border-t border-[#f0f0f0] pt-1">{row}</div>;
}

interface FlightBookServiceFeeRowsProps {
  serviceFees: FlightBookServiceFeeRow[];
  /** Inside FlightBookPassengerSection — inset card. */
  sectioned?: boolean;
  /** Row only — parent provides inset card wrapper. */
  bare?: boolean;
}

export function FlightBookServiceFeeRows({
  serviceFees,
  sectioned = false,
  bare = false,
}: FlightBookServiceFeeRowsProps) {
  const feeRows = serviceFees.filter((row) => row.fee > 0);
  if (feeRows.length === 0) return null;

  const content = feeRows.map((row) => (
    <div
      key={row.passengerId}
      className={sectioned && feeRows.length === 1 ? insetRowClass : rowClass}
    >
      <span className={sectioned && feeRows.length === 1 ? splitLabelClass : insetLabelClass}>
        服务费
      </span>
      <span
        className={
          sectioned && feeRows.length === 1
            ? "shrink-0 text-[14px] leading-tight text-[#333333]"
            : "min-w-0 flex-1 text-right text-[14px] leading-tight text-[#333333]"
        }
      >
        {feeRows.length > 1 && row.passengerName
          ? `${row.passengerName} ${row.fee}元`
          : `${row.fee}元`}
      </span>
    </div>
  ));

  if (bare) return <>{content}</>;
  if (sectioned) return <SectionedInsetCard>{content}</SectionedInsetCard>;
  return <div className="mt-1 border-t border-[#f0f0f0] pt-1">{content}</div>;
}

interface FlightBookPassengerExtrasProps {
  showNotifyLanguage: boolean;
  showServiceFee: boolean;
  notifyLanguage: FlightNotifyLanguage;
  serviceFees: FlightBookServiceFeeRow[];
  onOpenNotifyLanguage: () => void;
  /** Inside FlightBookPassengerSection — inset card, no top border. */
  sectioned?: boolean;
}

/** @deprecated Prefer FlightBookNotifyLanguageRow + FlightBookServiceFeeRows separately. */
export function FlightBookPassengerExtras({
  showNotifyLanguage,
  showServiceFee,
  notifyLanguage,
  serviceFees,
  onOpenNotifyLanguage,
  sectioned = false,
}: FlightBookPassengerExtrasProps) {
  const notify = showNotifyLanguage ? (
    <FlightBookNotifyLanguageRow
      sectioned={sectioned}
      notifyLanguage={notifyLanguage}
      onOpenNotifyLanguage={onOpenNotifyLanguage}
    />
  ) : null;
  const fees = showServiceFee ? (
    <FlightBookServiceFeeRows sectioned={sectioned} serviceFees={serviceFees} />
  ) : null;

  if (!notify && !fees) return null;
  return (
    <>
      {notify}
      {fees}
    </>
  );
}

interface FlightBookExtrasProps {
  showNotifyLanguage: boolean;
  showServiceFee: boolean;
  notifyLanguage: FlightNotifyLanguage;
  serviceFee: number;
  onOpenNotifyLanguage: () => void;
}

/** @deprecated Prefer FlightBookPassengerExtras inside FlightBookPassengers. */
export function FlightBookExtras({
  showNotifyLanguage,
  showServiceFee,
  notifyLanguage,
  serviceFee,
  onOpenNotifyLanguage,
}: FlightBookExtrasProps) {
  const serviceFees: FlightBookServiceFeeRow[] = showServiceFee
    ? [{ passengerId: "total", passengerName: "", fee: serviceFee }]
    : [];

  return (
    <section className="rounded-xl bg-white px-3 py-1 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <FlightBookPassengerExtras
        showNotifyLanguage={showNotifyLanguage}
        showServiceFee={showServiceFee}
        notifyLanguage={notifyLanguage}
        serviceFees={serviceFees}
        onOpenNotifyLanguage={onOpenNotifyLanguage}
      />
    </section>
  );
}
