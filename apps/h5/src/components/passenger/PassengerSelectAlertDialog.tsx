import { useEffect, useState } from "react";

import "./passenger-select-alert-dialog.css";

const ALERT_ANIMATION_MS = 280;
const LIMIT_MESSAGE_RE = /^最多选择(\d+)位出行人$/;

interface PassengerSelectAlertDialogProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-5" aria-hidden>
      <circle cx="7" cy="7" r="2.2" fill="currentColor" />
      <circle cx="13" cy="7" r="2.2" fill="currentColor" />
      <path
        d="M4.5 15.5c.8-2.2 2.6-3.5 5.5-3.5s4.7 1.3 5.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AlertBody({ message }: { message: string }) {
  const limitMatch = message.trim().match(LIMIT_MESSAGE_RE);
  if (limitMatch) {
    const max = limitMatch[1];
    return (
      <div className="passenger-select-alert__limit">
        <span className="passenger-select-alert__limit-badge" aria-hidden>
          {max}
        </span>
        <p className="passenger-select-alert__limit-title">最多可选择 {max} 位出行人</p>
        <p className="passenger-select-alert__limit-hint">如需更换，请先取消已选旅客</p>
      </div>
    );
  }

  return <p className="passenger-select-alert__plain">{message}</p>;
}

/** Polished alert for passenger picker validation (limit, empty selection, etc.). */
export function PassengerSelectAlertDialog({
  open,
  message,
  onClose,
}: PassengerSelectAlertDialogProps) {
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
    <div className="passenger-select-alert" data-visible={visible} role="presentation">
      <button
        type="button"
        className="passenger-select-alert__backdrop"
        aria-label="关闭"
        onClick={handleClose}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="passenger-select-alert-title"
        aria-describedby="passenger-select-alert-message"
        className="passenger-select-alert__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="passenger-select-alert__accent" aria-hidden />

        <div className="passenger-select-alert__header">
          <span className="passenger-select-alert__icon">
            <AlertIcon />
          </span>
          <h2 id="passenger-select-alert-title" className="passenger-select-alert__title">
            提示
          </h2>
        </div>

        <div id="passenger-select-alert-message" className="passenger-select-alert__body">
          <AlertBody message={message} />
        </div>

        <div className="passenger-select-alert__footer">
          <button type="button" className="passenger-select-alert__confirm" onClick={handleClose}>
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}
