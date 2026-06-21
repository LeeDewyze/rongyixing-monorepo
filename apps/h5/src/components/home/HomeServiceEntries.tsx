import { Link } from "react-router-dom";

interface ServiceEntry {
  id: string;
  label: string;
  bg: string;
  to?: string;
  icon: React.ReactNode;
}

function FlightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
      <path
        d="M19.5 12.5 9 7.5v3L4.5 9.5 3 11l6 1.5v3.5l-1.5 1 1.5 1 2-2.5 5.5 1.5 1.5-1.5-6-1.5v-3l10.5-5 1.5 1.5-1.5 1.5Z"
        fill="#fff"
      />
    </svg>
  );
}

function TrainIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
      <rect x="5" y="5" width="14" height="11" rx="2.5" fill="#fff" />
      <rect x="7" y="8" width="4.5" height="3.5" rx="0.75" fill="#F87171" />
      <rect x="12.5" y="8" width="4.5" height="3.5" rx="0.75" fill="#F87171" />
      <circle cx="8" cy="18.5" r="1.5" fill="#fff" />
      <circle cx="16" cy="18.5" r="1.5" fill="#fff" />
      <path d="M5 16h14" stroke="#fff" strokeWidth="1.5" />
    </svg>
  );
}

function HotelIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" aria-hidden>
      <path
        d="M5 5h14v14H5V5Zm2 2v3h3V7H7Zm0 5v3h3v-3H7Zm5-5v3h3V7h-3Zm0 5v3h3v-3h-3Z"
        fill="#fff"
      />
      <rect x="5" y="17" width="14" height="2" fill="#fff" />
    </svg>
  );
}

const ENTRIES: ServiceEntry[] = [
  {
    id: "flight",
    label: "机票",
    bg: "linear-gradient(180deg, #8EB5FF 0%, #6B9BFF 100%)",
    icon: <FlightIcon />,
  },
  {
    id: "train",
    label: "火车票",
    bg: "linear-gradient(180deg, #FF9B8E 0%, #FF7A6B 100%)",
    icon: <TrainIcon />,
  },
  {
    id: "hotel",
    label: "酒店",
    bg: "linear-gradient(180deg, #FFD66B 0%, #F5B942 100%)",
    to: "/hotel",
    icon: <HotelIcon />,
  },
];

function EntryContent({ entry }: { entry: ServiceEntry }) {
  return (
    <>
      <span
        className="flex h-14 w-14 items-center justify-center rounded-full shadow-sm"
        style={{ background: entry.bg }}
      >
        {entry.icon}
      </span>
      <span className="mt-2 text-sm text-[#374151]">{entry.label}</span>
    </>
  );
}

export function HomeServiceEntries() {
  return (
    <div className="mt-6 rounded-2xl bg-white px-4 py-5 shadow-sm">
      <div className="flex items-start justify-around">
        {ENTRIES.map((entry) =>
          entry.to ? (
            <Link
              key={entry.id}
              to={entry.to}
              className="flex flex-col items-center no-underline"
            >
              <EntryContent entry={entry} />
            </Link>
          ) : (
            <button
              key={entry.id}
              type="button"
              className="flex flex-col items-center border-none bg-transparent p-0"
              aria-label={`${entry.label}（即将上线）`}
            >
              <EntryContent entry={entry} />
            </button>
          ),
        )}
      </div>
    </div>
  );
}
