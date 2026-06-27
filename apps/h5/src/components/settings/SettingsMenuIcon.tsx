import type { ReactNode } from "react";

type SettingsMenuIconVariant =
  | "security"
  | "notification"
  | "device"
  | "password"
  | "phone"
  | "history";

const ICON_CLASS = "size-[18px]";

function SecurityIcon() {
  return (
    <svg viewBox="0 0 20 20" className={ICON_CLASS} fill="none" aria-hidden>
      <path
        d="M10 2.5 4.5 5v4.8c0 3.1 2.3 5.9 5.5 7.2 3.2-1.3 5.5-4.1 5.5-7.2V5L10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.2 10.2 9.4 11.4l2.6-2.8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 20 20" className={ICON_CLASS} fill="none" aria-hidden>
      <path
        d="M10 3a4.2 4.2 0 0 1 4.2 4.2v2.4c0 .5.2 1 .5 1.4l.7 1c.3.4.1 1-.4 1H5c-.5 0-.7-.6-.4-1l.7-1c.3-.4.5-.9.5-1.4V7.2A4.2 4.2 0 0 1 10 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 14.5a1.5 1.5 0 0 0 3 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DeviceIcon() {
  return (
    <svg viewBox="0 0 20 20" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="5.5" y="3" width="9" height="14" rx="1.8" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.5 15.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function PasswordIcon() {
  return (
    <svg viewBox="0 0 20 20" className={ICON_CLASS} fill="none" aria-hidden>
      <rect
        x="4.5"
        y="8.5"
        width="11"
        height="8"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M7 8.5V6.2a3 3 0 1 1 6 0V8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="10" cy="12.5" r="1" fill="currentColor" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 20 20" className={ICON_CLASS} fill="none" aria-hidden>
      <rect x="6" y="3" width="8" height="14" rx="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8.5 14.5h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function HistoryIcon() {
  return (
    <svg viewBox="0 0 20 20" className={ICON_CLASS} fill="none" aria-hidden>
      <circle cx="10" cy="10" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M10 6.5V10l2.5 2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const VARIANT_STYLES: Record<SettingsMenuIconVariant, { shell: string; icon: ReactNode }> = {
  security: {
    shell: "bg-[#EEF4FF] text-brand-primary",
    icon: <SecurityIcon />,
  },
  notification: {
    shell: "bg-[#FFF4E8] text-[#F59E0B]",
    icon: <NotificationIcon />,
  },
  device: {
    shell: "bg-[#EEF4FF] text-brand-primary",
    icon: <DeviceIcon />,
  },
  password: {
    shell: "bg-[#EEF4FF] text-brand-primary",
    icon: <PasswordIcon />,
  },
  phone: {
    shell: "bg-[#ECFDF5] text-[#10B981]",
    icon: <PhoneIcon />,
  },
  history: {
    shell: "bg-[#F5F3FF] text-[#7C3AED]",
    icon: <HistoryIcon />,
  },
};

interface SettingsMenuIconProps {
  variant: SettingsMenuIconVariant;
}

export function SettingsMenuIcon({ variant }: SettingsMenuIconProps) {
  const { shell, icon } = VARIANT_STYLES[variant];

  return (
    <span
      className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${shell}`}
      aria-hidden
    >
      {icon}
    </span>
  );
}

export function settingsMenuIconForId(id: string): SettingsMenuIconVariant | undefined {
  if (id === "security") return "security";
  if (id === "notifications") return "notification";
  return undefined;
}
