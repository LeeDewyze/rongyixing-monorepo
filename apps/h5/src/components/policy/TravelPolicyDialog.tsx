import { useEffect, useMemo, useState } from "react";
import { ProductType } from "@ryx/shared-types";

import "./travel-policy-dialog.css";

export type TravelPolicyRecord = Record<string, unknown>;

interface TravelPolicyDialogProps {
  open: boolean;
  passengerName?: string;
  policy?: TravelPolicyRecord | null;
  loading?: boolean;
  productType?: ProductType;
  onClose: () => void;
}

interface PolicyRow {
  label: string;
  value: string;
}

interface PolicySection {
  key: "flight" | "train" | "hotel";
  title: string;
  items: string[];
}

const DIALOG_ANIMATION_MS = 240;

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "是" : "否";
  return String(value).trim();
}

function asNumber(value: unknown): number | null {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function addRow(rows: PolicyRow[], label: string, value: unknown) {
  const text = asText(value);
  if (text) rows.push({ label, value: text });
}

function addAmountRow(rows: PolicyRow[], label: string, city: unknown, amount: unknown) {
  const cityName = asText(city);
  const number = asNumber(amount);
  if (cityName && number != null) rows.push({ label, value: `${cityName}，每晚 ${number} 元` });
}

function splitDescription(value: unknown): string[] {
  return asText(value)
    .split(/[，,。；;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function rowsToItems(rows: PolicyRow[]): string[] {
  return rows.map((row) => `${row.label}：${row.value}`);
}

function buildPolicySection(
  key: "flight" | "train" | "hotel",
  title: string,
  description: unknown,
  fallbackRows: PolicyRow[],
): PolicySection | null {
  const descriptionItems = splitDescription(description);
  const items = descriptionItems.length ? descriptionItems : rowsToItems(fallbackRows);
  return items.length ? { key, title, items } : null;
}

function buildPolicySections(policy: TravelPolicyRecord | null | undefined): PolicySection[] {
  const record = policy ?? {};
  const flight: PolicyRow[] = [];
  const train: PolicyRow[] = [];
  const hotel: PolicyRow[] = [];

  addRow(flight, "舱位标准", record.FlightCabinLevel);
  addRow(flight, "预订限制", record.FlightDescription);
  addRow(flight, "违规处理", record.FlightTypeName);
  addRow(
    flight,
    "提前预订",
    asNumber(record.FlightAdvanceBook) ? `${record.FlightAdvanceBook} 天` : "",
  );
  addRow(flight, "最低价要求", record.FlightIsMustBookLowestPrice);
  addRow(flight, "合规提示", record.FlightLegalTip);
  addRow(flight, "超标提示", record.FlightIllegalTip);

  addRow(train, "席别标准", record.TrainSeatTypeName);
  addRow(train, "上限席别", record.TrainUpperSeatTypeName);
  addRow(train, "预订限制", record.TrainDescription);
  addRow(train, "违规处理", record.TrainTypeName);
  addRow(
    train,
    "提前预订",
    asNumber(record.TrainAdvanceBook) ? `${record.TrainAdvanceBook} 天` : "",
  );
  addRow(train, "合规提示", record.TrainLegalTip);
  addRow(train, "超标提示", record.TrainIllegalTip);

  addRow(hotel, "预订限制", record.HotelDescription);
  addAmountRow(hotel, "一线城市", record.HotelOneCityName, record.HotelOneAmount);
  addAmountRow(hotel, "二线城市", record.HotelTwoCityName, record.HotelTwoAmount);
  addAmountRow(hotel, "其他城市", record.HotelOtherCity, record.HotelOtherAmount);
  addRow(hotel, "可订非协议酒店", record.HotelIsAllowNonProtocol);
  addRow(hotel, "合规提示", record.HotelLegalTip);
  addRow(hotel, "超标提示", record.HotelIllegalTip);

  return [
    buildPolicySection("flight", "机票", record.FlightDescription, flight),
    buildPolicySection("train", "火车", record.TrainDescription, train),
    buildPolicySection("hotel", "酒店", record.HotelDescription, hotel),
  ].filter((section): section is PolicySection => Boolean(section));
}

function resolveVisiblePolicySections(
  sections: PolicySection[],
  productType?: ProductType,
): PolicySection[] {
  if (productType == null) return sections;
  switch (productType) {
    case ProductType.Flight:
    case ProductType.InternationalFlight:
      return sections.filter((section) => section.key === "flight");
    case ProductType.Hotel:
    case ProductType.HotelInternational:
      return sections.filter((section) => section.key === "hotel");
    case ProductType.Train:
      return sections.filter((section) => section.key === "train");
    default:
      return sections;
  }
}

export function resolveTravelPolicyRecord(value: unknown): TravelPolicyRecord | null {
  if (!value || typeof value !== "object") return null;
  const policy = (value as Record<string, unknown>).Policy;
  return policy && typeof policy === "object" ? (policy as TravelPolicyRecord) : null;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="travel-policy-dialog__icon" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12 10.5v5.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      <circle cx="12" cy="7.75" r="1" fill="currentColor" />
    </svg>
  );
}

function EmptyPolicy() {
  return (
    <div className="travel-policy-dialog__empty">
      <InfoIcon />
      <strong>暂无差旅标准</strong>
      <span>当前账号暂未返回可展示的差旅规则</span>
    </div>
  );
}

export function TravelPolicyDialog({
  open,
  passengerName,
  policy,
  loading = false,
  productType,
  onClose,
}: TravelPolicyDialogProps) {
  const [visible, setVisible] = useState(false);
  const sections = useMemo(
    () => resolveVisiblePolicySections(buildPolicySections(policy), productType),
    [policy, productType],
  );

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    setVisible(false);
  }, [open]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, DIALOG_ANIMATION_MS);
  }

  if (!open) return null;

  return (
    <div className="travel-policy-dialog" data-visible={visible} role="presentation">
      <button
        type="button"
        className="travel-policy-dialog__backdrop"
        aria-label="关闭差旅标准"
        onClick={handleClose}
      />
      <section
        className="travel-policy-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="travel-policy-dialog-title"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="travel-policy-dialog__header">
          <div className="travel-policy-dialog__title-wrap">
            <span className="travel-policy-dialog__title-icon">
              <InfoIcon />
            </span>
            <div>
              <h2 id="travel-policy-dialog-title">差旅标准</h2>
              <p>{passengerName ? `${passengerName}的预订标准` : "当前预订标准"}</p>
            </div>
          </div>
          <button
            type="button"
            className="travel-policy-dialog__close"
            aria-label="关闭"
            onClick={handleClose}
          >
            ×
          </button>
        </header>

        <div className="travel-policy-dialog__body">
          {loading ? (
            <div className="travel-policy-dialog__skeleton" aria-label="正在加载差旅标准">
              <span />
              <span />
              <span />
            </div>
          ) : sections.length === 0 ? (
            <EmptyPolicy />
          ) : (
            sections.map((section) => (
              <section className="travel-policy-dialog__section" key={section.title}>
                <h3>{section.title}</h3>
                <ul>
                  {section.items.map((item) => (
                    <li className="travel-policy-dialog__item" key={`${section.title}-${item}`}>
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <footer className="travel-policy-dialog__footer">
          <button type="button" className="travel-policy-dialog__confirm" onClick={handleClose}>
            知道了
          </button>
        </footer>
      </section>
    </div>
  );
}
