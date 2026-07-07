interface DangerWarningIconProps {
  className?: string;
}

/** Triangle exclamation — used for destructive / account-deletion affordances. */
export function DangerWarningIcon({ className = "size-[18px]" }: DangerWarningIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.5 2.2 18.1A1.5 1.5 0 0 0 3.5 20.2h17a1.5 1.5 0 0 0 1.3-2.1L13.7 4.5a1.5 1.5 0 0 0-2.6 0Z" />
    </svg>
  );
}
