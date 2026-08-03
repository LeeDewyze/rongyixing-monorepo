import { useEffect, useState } from "react";
import type { PassengerBookInfo } from "@ryx/shared-types";

import "../hotel/hotel-policy-filter-sheet.css";

const SHEET_ANIMATION_MS = 360;

export interface PolicyFilterSheetProps {
  open: boolean;
  passengers: PassengerBookInfo[];
  /** True when「不过滤差标」is the active filter (distinct from unset passenger id). */
  showAllSelected: boolean;
  selectedPassengerId: string | null;
  description?: string;
  fontClassName?: string;
  onClose: () => void;
  onConfirm: (passengerId: string | null) => void;
}

function maskCredential(number?: string, hideNumber?: string): string {
  const value = number || hideNumber || "";
  if (!value) return "";
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.min(value.length - 4, 6))}${value.slice(-4)}`;
}

function passengerInitial(name?: string): string {
  const trimmed = name?.trim();
  if (!trimmed) return "旅";
  return trimmed.slice(0, 1).toUpperCase();
}

function credentialTypeLabel(type?: number | string): string | null {
  const value = Number(type);
  if (value === 1) return "身份证";
  if (value === 2) return "护照";
  if (value === 3) return "其他";
  return null;
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 14 14" className="size-3.5" aria-hidden>
      <path
        d="M2 2l10 10M12 2 2 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
      <path
        d="M2.5 6.2 4.8 8.5 9.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AllPlansIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <rect x="2.5" y="3" width="15" height="4" rx="1.2" fill="currentColor" opacity="0.9" />
      <rect x="2.5" y="8.5" width="15" height="4" rx="1.2" fill="currentColor" opacity="0.65" />
      <rect x="2.5" y="14" width="15" height="3" rx="1" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

function SelectionCheck({ selected }: { selected: boolean }) {
  return (
    <span className="hotel-policy-filter-sheet__check" aria-hidden>
      {selected ? <CheckIcon /> : null}
    </span>
  );
}

export function PolicyFilterSheet({
  open,
  passengers,
  showAllSelected,
  selectedPassengerId,
  description = "选择查看全部价格，或按旅客差旅标准筛选",
  fontClassName = "",
  onClose,
  onConfirm,
}: PolicyFilterSheetProps) {
  const [visible, setVisible] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraftId(showAllSelected ? null : (selectedPassengerId ?? passengers[0]?.id ?? null));
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    setVisible(false);
  }, [open, passengers, selectedPassengerId, showAllSelected]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, SHEET_ANIMATION_MS);
  }

  function handleConfirm() {
    onConfirm(draftId);
    handleClose();
  }

  if (!open) return null;

  const showAll = draftId === null;

  return (
    <div
      className={`hotel-policy-filter-sheet ${fontClassName}`}
      data-visible={visible}
      role="presentation"
    >
      <button
        type="button"
        className="hotel-policy-filter-sheet__backdrop"
        aria-label="关闭"
        onClick={handleClose}
      />

      <div
        className="hotel-policy-filter-sheet__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="policy-filter-title"
        aria-describedby="policy-filter-desc"
      >
        <div className="hotel-policy-filter-sheet__handle-wrap">
          <div className="hotel-policy-filter-sheet__handle" aria-hidden />
        </div>

        <div className="hotel-policy-filter-sheet__header">
          <div className="min-w-0 flex-1">
            <h2
              id="policy-filter-title"
              className="text-[18px] font-semibold tracking-tight text-[#1A1A1A]"
            >
              过滤差标
            </h2>
            <p id="policy-filter-desc" className="mt-1 text-[13px] leading-snug text-[#8B919A]">
              {description}
            </p>
          </div>
          <button
            type="button"
            className="hotel-policy-filter-sheet__close"
            aria-label="关闭"
            onClick={handleClose}
          >
            <CloseIcon />
          </button>
        </div>

        <div className="hotel-policy-filter-sheet__body hotel-policy-filter-sheet__content-enter">
          <section className="hotel-policy-filter-sheet__section">
            <p className="hotel-policy-filter-sheet__section-label">查看方式</p>
            <button
              type="button"
              role="radio"
              aria-checked={showAll}
              data-selected={showAll}
              className="hotel-policy-filter-sheet__all-card"
              onClick={() => setDraftId(null)}
            >
              <span className="hotel-policy-filter-sheet__all-icon">
                <AllPlansIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold text-[#1A1A1A]">不过滤差标</p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-[#8B919A]">
                  不按旅客差标过滤，全部展示为可预订
                </p>
              </div>
              <SelectionCheck selected={showAll} />
            </button>
          </section>

          {passengers.length > 0 ? (
            <section
              className="hotel-policy-filter-sheet__section"
              role="radiogroup"
              aria-label="按旅客过滤"
            >
              <p className="hotel-policy-filter-sheet__section-label">
                按旅客查看
                <span className="hotel-policy-filter-sheet__section-badge">
                  {passengers.length}
                </span>
              </p>
              <div className="hotel-policy-filter-sheet__list">
                {passengers.map((passenger) => {
                  const cred = maskCredential(
                    passenger.credential.Number,
                    passenger.credential.HideNumber,
                  );
                  const credType = credentialTypeLabel(passenger.credential.Type);
                  const selected = draftId === passenger.id;
                  return (
                    <button
                      key={passenger.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      data-selected={selected}
                      className="hotel-policy-filter-sheet__option"
                      onClick={() => setDraftId(passenger.id)}
                    >
                      <span className="hotel-policy-filter-sheet__avatar">
                        {passengerInitial(passenger.passenger.Name)}
                      </span>
                      <div className="hotel-policy-filter-sheet__meta">
                        <p className="hotel-policy-filter-sheet__name">
                          {passenger.passenger.Name}
                        </p>
                        {cred ? (
                          <div className="hotel-policy-filter-sheet__cred-row">
                            {credType ? (
                              <span className="hotel-policy-filter-sheet__cred-tag">
                                {credType}
                              </span>
                            ) : null}
                            <span className="hotel-policy-filter-sheet__cred">{cred}</span>
                          </div>
                        ) : null}
                      </div>
                      <SelectionCheck selected={selected} />
                    </button>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <div className="hotel-policy-filter-sheet__footer">
          <button
            type="button"
            onClick={handleConfirm}
            className="hotel-policy-filter-sheet__confirm"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
