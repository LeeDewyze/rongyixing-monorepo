type PassengerCredentialActionTone = "edit" | "delete";

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path
        d="M4.5 14.2l-.4 1.7 1.7-.4 8.1-8.1-1.3-1.3-8.1 8.1z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.7 5l1.3-1.3a1 1 0 011.4 0l1 1a1 1 0 010 1.4l-1.3 1.3" strokeLinecap="round" />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M5 6.2h10" strokeLinecap="round" />
      <path d="M8.1 6.2V4.8c0-.5.4-.8.8-.8h2.2c.4 0 .8.3.8.8v1.4" strokeLinecap="round" />
      <path d="M7 8v6.7c0 .7.5 1.3 1.2 1.3h3.6c.7 0 1.2-.6 1.2-1.3V8" strokeLinecap="round" />
      <path d="M9 9.5v4M11 9.5v4" strokeLinecap="round" />
    </svg>
  );
}

export function PassengerCredentialActionButton({
  label,
  tone,
  onClick,
}: {
  label: string;
  tone: PassengerCredentialActionTone;
  onClick: () => void;
}) {
  const toneClass =
    tone === "delete"
      ? "bg-[#fff7f7] text-[#e5484d] hover:bg-[#ffeded] focus-visible:ring-[#ff9a9e]"
      : "bg-[#f2f7ff] text-brand-primary hover:bg-[#e8f2ff] focus-visible:ring-brand-primary/40";

  return (
    <button
      type="button"
      className={`flex size-8 items-center justify-center rounded-full transition-colors active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${toneClass}`}
      aria-label={label}
      onClick={onClick}
    >
      {tone === "delete" ? <DeleteIcon /> : <EditIcon />}
    </button>
  );
}
