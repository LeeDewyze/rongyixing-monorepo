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

const AGENT_PREFIX = "超标:";

function formatPolicyAlertChunk(chunk: string): string {
  const parts = chunk
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);

  // Legacy train copy: Name;credential;rule → Name(credential);rule
  if (parts.length >= 3 && !chunk.includes("(")) {
    const [name, credential, ...rules] = parts;
    return `${name}(${credential});${rules.join(";")}`;
  }

  return chunk;
}

/** Format legacy policy alert copy — `Name(id);rule` chunks joined by comma. */
export function formatPolicyAlertDisplayMessage(message: string): string {
  const trimmed = message.trim();
  if (!trimmed) return "";

  let agentPrefix = "";
  let body = trimmed;
  if (body.startsWith(AGENT_PREFIX)) {
    agentPrefix = AGENT_PREFIX;
    body = body.slice(AGENT_PREFIX.length);
  }

  const hasExceedSuffix = body.endsWith(EXCEED_SUFFIX);
  const core = hasExceedSuffix ? body.slice(0, -EXCEED_SUFFIX.length) : body;
  const suffix = hasExceedSuffix ? EXCEED_SUFFIX : "";

  const chunks = core
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!chunks.length) return trimmed;

  return `${agentPrefix}${chunks.map(formatPolicyAlertChunk).join(",")}${suffix}`;
}

function DialogTitle() {
  return (
    <div className="hotel-policy-alert__title-row">
      <span
        className="hotel-policy-alert__title-line hotel-policy-alert__title-line--left"
        aria-hidden
      />
      <h2 id="hotel-policy-alert-title" className="hotel-policy-alert__title">
        温馨提示
      </h2>
      <span
        className="hotel-policy-alert__title-line hotel-policy-alert__title-line--right"
        aria-hidden
      />
    </div>
  );
}

/** Legacy CoreHelper.alert — simplified warm-reminder style policy prompt. */
export function HotelPolicyAlertDialog({ open, message, onClose }: HotelPolicyAlertDialogProps) {
  const [visible, setVisible] = useState(false);
  const displayMessage = formatPolicyAlertDisplayMessage(message);

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
        <DialogTitle />

        <div className="hotel-policy-alert__divider" aria-hidden />

        <div id="hotel-policy-alert-message" className="hotel-policy-alert__body">
          <p className="hotel-policy-alert__message">{displayMessage}</p>
        </div>

        <div className="hotel-policy-alert__divider" aria-hidden />

        <div className="hotel-policy-alert__footer">
          <button type="button" className="hotel-policy-alert__confirm" onClick={handleClose}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
