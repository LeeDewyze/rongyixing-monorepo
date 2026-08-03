import { useId, type ReactNode } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  showCancelButton?: boolean;
  /** Show top-right close control. Defaults to true. */
  showCloseButton?: boolean;
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
      className="flex size-7 items-center justify-center rounded-full bg-[#F5F6F9] text-[#999999] active:bg-[#EBEDF0]"
      aria-label="关闭"
      onClick={onClose}
    >
      <svg
        viewBox="0 0 20 20"
        className="size-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
      </svg>
    </button>
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

/** Centered confirmation modal — used before confirmation actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确定",
  cancelLabel = "取消",
  loading = false,
  showCancelButton = true,
  showCloseButton = true,
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
        <div className="relative px-5 pb-3.5 pt-4">
          {showCloseButton ? (
            <div className="absolute right-3 top-3">
              <DialogCloseButton onClose={onCancel} />
            </div>
          ) : null}

          <div className="flex min-h-8 items-center justify-center px-8">
            <h2 id={titleId} className="text-[17px] font-semibold leading-tight text-[#333333]">
              {title}
            </h2>
          </div>
          <p id={messageId} className="mt-3 text-left text-[14px] leading-[1.55] text-[#666666]">
            {formatMessage(message)}
          </p>
        </div>

        <div className="border-t border-[#F0F2F5] bg-[#FAFBFC] px-5 py-4">
          <div className="flex gap-3">
            {showCancelButton ? (
              <button
                type="button"
                disabled={loading}
                className="flex h-11 flex-1 items-center justify-center rounded-full border border-[#E8EBF0] bg-white text-[14px] font-medium text-[#666666] active:bg-[#F5F6F9] disabled:opacity-50"
                onClick={onCancel}
              >
                {cancelLabel}
              </button>
            ) : null}
            <button
              type="button"
              disabled={loading}
              className={
                resolvedVariant === "destructive"
                  ? "flex h-11 flex-1 items-center justify-center rounded-full bg-[#FF4D4F] text-[14px] font-medium text-white shadow-[0_4px_12px_rgba(255,77,79,0.28)] active:opacity-90 disabled:opacity-50"
                  : "flex h-11 flex-1 items-center justify-center rounded-full bg-brand-primary text-[14px] font-medium text-white shadow-[0_4px_12px_rgba(39,104,250,0.28)] active:opacity-90 disabled:opacity-50"
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
