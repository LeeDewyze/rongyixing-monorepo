import { useId, type ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** Visual tone for icon and primary action. Defaults to destructive when confirmLabel is「删除」. */
  variant?: "default" | "destructive";
  onConfirm: () => void;
  onCancel: () => void;
}

const CONFIRM_FONT = "[font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]";

function DialogCloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      className="flex size-8 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] active:bg-[#EBEDF0]"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function DestructiveIcon() {
  return (
    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#FFF1F0] text-[#FF4D4F]">
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 6h18" />
        <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
        <path d="M6 6l.8 13.2A1.5 1.5 0 0 0 8.3 20.7h7.4a1.5 1.5 0 0 0 1.5-1.5L18 6" />
        <path d="M10 10v6" />
        <path d="M14 10v6" />
      </svg>
    </div>
  );
}

function DefaultIcon() {
  return (
    <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-[#EEF5FF] text-[#2768FA]">
      <svg
        viewBox="0 0 24 24"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    </div>
  );
}

function formatMessage(message: string): ReactNode {
  const parts = message.split(/(「[^」]+」)/g);
  if (parts.length === 1) return message;

  return parts.map((part, index) =>
    part.startsWith("「") ? (
      <span key={index} className="font-medium text-[#333333]">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** Centered confirmation modal — used before destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确定",
  cancelLabel = "取消",
  loading = false,
  variant,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId();
  const messageId = useId();
  const resolvedVariant = variant ?? (confirmLabel === "删除" ? "destructive" : "default");

  if (!open) return null;

  return (
    <div
      className={`fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-6 backdrop-blur-[2px] ${CONFIRM_FONT}`}
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        className="w-full max-w-[320px] overflow-hidden rounded-2xl bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative px-5 pb-4 pt-5">
          <div className="absolute right-3 top-3">
            <DialogCloseButton onClose={onCancel} />
          </div>

          {resolvedVariant === "destructive" ? <DestructiveIcon /> : <DefaultIcon />}

          <h2
            id={titleId}
            className="mt-4 text-center text-[17px] font-semibold leading-tight text-[#333333]"
          >
            {title}
          </h2>
          <p
            id={messageId}
            className="mt-2.5 text-center text-[14px] leading-[1.65] text-[#666666]"
          >
            {formatMessage(message)}
          </p>
        </div>

        <div className="border-t border-[#F0F2F5] bg-[#FAFBFC] px-5 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={loading}
              className="flex h-11 flex-1 items-center justify-center rounded-full border border-[#E8EBF0] bg-white text-[14px] font-medium text-[#666666] active:bg-[#F5F6F9] disabled:opacity-50"
              onClick={onCancel}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              disabled={loading}
              className={
                resolvedVariant === "destructive"
                  ? "flex h-11 flex-1 items-center justify-center rounded-full bg-[#FF4D4F] text-[14px] font-medium text-white shadow-[0_4px_12px_rgba(255,77,79,0.28)] active:opacity-90 disabled:opacity-50"
                  : "flex h-11 flex-1 items-center justify-center rounded-full bg-[#2768FA] text-[14px] font-medium text-white shadow-[0_4px_12px_rgba(39,104,250,0.28)] active:opacity-90 disabled:opacity-50"
              }
              onClick={onConfirm}
            >
              {loading ? "处理中…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
