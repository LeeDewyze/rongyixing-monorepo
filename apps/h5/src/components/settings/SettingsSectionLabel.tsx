interface SettingsSectionLabelProps {
  children: string;
}

/** Section header for grouped settings lists — tuned for gradient page chrome. */
export function SettingsSectionLabel({ children }: SettingsSectionLabelProps) {
  return (
    <p className="px-4 pb-2 pt-1 text-[13px] font-medium tracking-[0.04em] text-[#8A94A6]">
      {children}
    </p>
  );
}
