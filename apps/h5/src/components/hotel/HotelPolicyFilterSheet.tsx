import { useEffect, useState } from "react";
import type { PassengerBookInfo } from "@ryx/shared-types";

import "./hotel-policy-filter-sheet.css";

const SHEET_ANIMATION_MS = 320;

interface HotelPolicyFilterSheetProps {
  open: boolean;
  passengers: PassengerBookInfo[];
  selectedId: string | null;
  onClose: () => void;
  onConfirm: (passengerId: string | null) => void;
}

function maskCredential(number?: string, hideNumber?: string): string {
  const value = number || hideNumber || "";
  if (!value) return "";
  if (value.length <= 4) return value;
  return `${"*".repeat(Math.min(value.length - 4, 6))}${value.slice(-4)}`;
}

export function HotelPolicyFilterSheet({
  open,
  passengers,
  selectedId,
  onClose,
  onConfirm,
}: HotelPolicyFilterSheetProps) {
  const [visible, setVisible] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(selectedId);

  useEffect(() => {
    if (open) {
      setDraftId(selectedId ?? passengers[0]?.id ?? null);
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    setVisible(false);
  }, [open, passengers, selectedId]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, SHEET_ANIMATION_MS);
  }

  function handleConfirm() {
    onConfirm(draftId);
    handleClose();
  }

  if (!open) return null;

  return (
    <div className="hotel-policy-filter-sheet" data-visible={visible}>
      <button type="button" className="hotel-policy-filter-sheet__backdrop" onClick={handleClose} />
      <div className="hotel-policy-filter-sheet__panel">
        <h2 className="text-center text-[16px] font-medium text-[#333333]">过滤差标</h2>

        <div className="mt-4 space-y-2">
          <label className="flex items-center gap-3 rounded-lg px-3 py-3 active:bg-[#F5F6F9]">
            <input
              type="radio"
              name="policy-filter"
              checked={draftId === null}
              onChange={() => setDraftId(null)}
              className="size-4 accent-[#2768FA]"
            />
            <span className="text-[14px] text-[#333333]">不过滤差标</span>
          </label>

          {passengers.map((passenger) => {
            const cred = maskCredential(
              passenger.credential.Number,
              passenger.credential.HideNumber,
            );
            return (
              <label
                key={passenger.id}
                className="flex items-center gap-3 rounded-lg px-3 py-3 active:bg-[#F5F6F9]"
              >
                <input
                  type="radio"
                  name="policy-filter"
                  checked={draftId === passenger.id}
                  onChange={() => setDraftId(passenger.id)}
                  className="size-4 accent-[#2768FA]"
                />
                <div className="min-w-0">
                  <p className="text-[14px] text-[#333333]">{passenger.passenger.Name}</p>
                  {cred ? <p className="text-[12px] text-[#999999]">{cred}</p> : null}
                </div>
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleConfirm}
          className="mt-5 w-full rounded-lg bg-[#2768FA] py-3 text-[15px] font-medium text-white active:opacity-90"
        >
          确定
        </button>
      </div>
    </div>
  );
}
