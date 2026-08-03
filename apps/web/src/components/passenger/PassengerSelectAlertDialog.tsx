import { useEffect, useState } from "react";

import "./passenger-select-alert-dialog.css";

const ALERT_ANIMATION_MS = 280;
const LIMIT_MESSAGE_RE = /^最多选择(\d+)位出行人$/;

interface PassengerSelectAlertDialogProps {
  open: boolean;
  message: string;
  /** Dismiss without side effects (backdrop tap). */
  onClose: () => void;
  /** Primary action (confirm button). Falls back to `onClose` when omitted. */
  onConfirm?: () => void;
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 10.5v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="12" cy="7.75" r="0.95" fill="currentColor" />
    </svg>
  );
}

function AlertBody({ message }: { message: string }) {
  const limitMatch = message.trim().match(LIMIT_MESSAGE_RE);
  if (limitMatch) {
    const max = limitMatch[1];
    return (
      <div className="passenger-select-alert__notice">
        <div className="passenger-select-alert__notice-row">
          <span className="passenger-select-alert__notice-label">人数上限</span>
          <span className="passenger-select-alert__notice-value">{max} 人</span>
        </div>
        <p className="passenger-select-alert__notice-desc">
          当前行程最多可选择 {max} 位出行人。如需更换，请先取消已选旅客后再重新选择。
        </p>
      </div>
    );
  }

  return <p className="passenger-select-alert__message">{message}</p>;
}

/** Corporate-styled alert for passenger picker validation (limit, empty selection, etc.). */
export function PassengerSelectAlertDialog({
  open,
  message,
  onClose,
  onConfirm,
}: PassengerSelectAlertDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
      return;
    }
    setVisible(false);
  }, [open]);

  function finishClose(callback: () => void) {
    setVisible(false);
    window.setTimeout(callback, ALERT_ANIMATION_MS);
  }

  function handleDismiss() {
    finishClose(onClose);
  }

  function handleConfirm() {
    finishClose(onConfirm ?? onClose);
  }

  if (!open) return null;

  return (
    <div className="passenger-select-alert" data-visible={visible} role="presentation">
      <button
        type="button"
        className="passenger-select-alert__backdrop"
        aria-label="关闭"
        onClick={handleDismiss}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="passenger-select-alert-title"
        aria-describedby="passenger-select-alert-message"
        className="passenger-select-alert__panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="passenger-select-alert__header">
          <div className="passenger-select-alert__header-bg" aria-hidden />
          <div className="passenger-select-alert__header-inner">
            <span className="passenger-select-alert__icon">
              <InfoIcon />
            </span>
            <h2 id="passenger-select-alert-title" className="passenger-select-alert__title">
              温馨提示
            </h2>
          </div>
        </div>

        <div id="passenger-select-alert-message" className="passenger-select-alert__body">
          <AlertBody message={message} />
        </div>

        <div className="passenger-select-alert__footer">
          <button type="button" className="passenger-select-alert__confirm" onClick={handleConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
