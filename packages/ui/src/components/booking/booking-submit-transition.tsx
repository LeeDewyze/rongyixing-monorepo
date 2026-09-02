interface BookingSubmitTransitionProps {
  className?: string;
}

/** Full-screen handoff state shown while a successful booking navigates to its order. */
export function BookingSubmitTransition({ className = "" }: BookingSubmitTransitionProps) {
  return (
    <div
      className={`ryx-viewport-h flex flex-col items-center justify-center px-6 text-center text-brand-title ${className}`}
      style={{ background: "var(--brand-form-header-gradient)" }}
      role="status"
      aria-live="polite"
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-white/75 shadow-sm">
        <span
          className="size-10 animate-spin rounded-full border-4 border-brand-primary/15 border-t-brand-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
      </div>
      <p className="mt-5 text-base font-medium">提交成功</p>
      <p className="mt-2 text-sm text-brand-title/60">正在进入订单详情…</p>
    </div>
  );
}
