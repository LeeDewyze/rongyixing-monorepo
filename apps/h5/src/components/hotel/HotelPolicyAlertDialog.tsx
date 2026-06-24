import { useEffect, useState } from "react";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";

import "./hotel-policy-alert-dialog.css";

const ALERT_ANIMATION_MS = 280;
const EXCEED_SUFFIX = "，超标不可预订";

interface HotelPolicyAlertDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <path
        d="M10 2.2 17.4 16.2a1.2 1.2 0 0 1-1.05 1.8H3.65a1.2 1.2 0 0 1-1.05-1.8L10 2.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M10 7.5v4.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="10" cy="14.2" r="0.9" fill="currentColor" />
    </svg>
  );
}

function parsePolicyAlertMessage(message: string): {
  entries: { identity: string; rule?: string }[];
  suffix?: string;
  plain?: string;
} {
  const trimmed = message.trim();
  if (!trimmed) return { entries: [], plain: "" };

  const hasExceedSuffix = trimmed.endsWith(EXCEED_SUFFIX);
  const core = hasExceedSuffix ? trimmed.slice(0, -EXCEED_SUFFIX.length) : trimmed;
  const chunks = core
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!chunks.length) {
    return { entries: [], plain: trimmed };
  }

  const entries = chunks.map((chunk) => {
    const semicolonIndex = chunk.indexOf(";");
    if (semicolonIndex === -1) {
      return { identity: chunk };
    }
    return {
      identity: chunk.slice(0, semicolonIndex).trim(),
      rule: chunk.slice(semicolonIndex + 1).trim() || undefined,
    };
  });

  return {
    entries,
    suffix: hasExceedSuffix ? "超标不可预订" : undefined,
  };
}

function PolicyAlertBody({ message }: { message: string }) {
  const parsed = parsePolicyAlertMessage(message);

  if (parsed.plain != null && parsed.entries.length === 0) {
    return <p className="hotel-policy-alert__plain">{parsed.plain}</p>;
  }

  return (
    <>
      <div className="hotel-policy-alert__content">
        {parsed.entries.map((entry, index) => (
          <div key={`${entry.identity}-${index}`} className="hotel-policy-alert__entry">
            <p className="hotel-policy-alert__identity">{entry.identity}</p>
            {entry.rule ? <p className="hotel-policy-alert__rule">{entry.rule}</p> : null}
          </div>
        ))}
      </div>
      {parsed.suffix ? <span className="hotel-policy-alert__tag">{parsed.suffix}</span> : null}
    </>
  );
}

/** Legacy CoreHelper.alert — polished policy exceed / block prompt. */
export function HotelPolicyAlertDialog({ open, message, onClose }: HotelPolicyAlertDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    setVisible(false);
  }, [open]);

  function handleClose() {
    setVisible(false);
    window.setTimeout(onClose, ALERT_ANIMATION_MS);
  }

  if (!open) return null;

  return (
    <div
      className={`hotel-policy-alert ${HOTEL_DETAIL_FONT}`}
      data-visible={visible}
      role="presentation"
    >
      <button
        type="button"
        className="hotel-policy-alert__backdrop"
        aria-label="关闭"
        onClick={handleClose}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="hotel-policy-alert-title"
        aria-describedby="hotel-policy-alert-message"
        className="hotel-policy-alert__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="hotel-policy-alert__accent" aria-hidden />

        <div className="hotel-policy-alert__header">
          <span className="hotel-policy-alert__icon">
            <AlertIcon />
          </span>
          <h2 id="hotel-policy-alert-title" className="hotel-policy-alert__title">
            提示
          </h2>
        </div>

        <div id="hotel-policy-alert-message" className="hotel-policy-alert__body">
          <PolicyAlertBody message={message} />
        </div>

        <div className="hotel-policy-alert__footer">
          <button type="button" className="hotel-policy-alert__confirm" onClick={handleClose}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
