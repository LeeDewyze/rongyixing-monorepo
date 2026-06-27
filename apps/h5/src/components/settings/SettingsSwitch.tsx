export function SettingsSwitch({
  checked,
  disabled,
  onChange,
  label,
}: {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label
      className={`inline-flex h-[31px] w-[51px] shrink-0 cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 ${
        checked ? "justify-end bg-brand-primary" : "justify-start bg-[#D8DCE3]"
      } ${disabled ? "cursor-not-allowed opacity-60" : ""}`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span
        aria-hidden
        className="size-[27px] shrink-0 rounded-full bg-white shadow-[0_1px_3px_rgba(15,23,42,0.18)]"
      />
    </label>
  );
}
