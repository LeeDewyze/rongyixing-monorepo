interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Centered confirmation modal — used before destructive actions. */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "确定",
  cancelLabel = "取消",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-8">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-lg"
      >
        <h2 id="confirm-dialog-title" className="text-center text-base font-semibold text-[#333333]">
          {title}
        </h2>
        <p id="confirm-dialog-message" className="mt-3 text-center text-sm leading-relaxed text-[#666666]">
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-[#eeeeee] bg-white text-sm font-medium text-[#666666] active:bg-[#f5f5f5] disabled:opacity-50"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            className="flex h-11 flex-1 items-center justify-center rounded-full bg-[#ff4d4f] text-sm font-medium text-white active:opacity-90 disabled:opacity-50"
            onClick={onConfirm}
          >
            {loading ? "处理中…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
