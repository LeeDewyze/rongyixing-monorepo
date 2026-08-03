export type PassengerTabKey = "employee" | "external";

interface PassengerSegmentTabsProps {
  active: PassengerTabKey;
  onChange: (tab: PassengerTabKey) => void;
}

export function PassengerSegmentTabs({ active, onChange }: PassengerSegmentTabsProps) {
  const tabs: { key: PassengerTabKey; label: string }[] = [
    { key: "employee", label: "公司员工" },
    { key: "external", label: "非公司员工" },
  ];

  return (
    <div className="mx-4 mb-3 flex rounded-full bg-white/90 p-0.5 shadow-sm">
      {tabs.map((tab) => {
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            type="button"
            className={`flex-1 rounded-full py-2 text-sm transition-colors ${
              isActive
                ? "bg-[#5099fe] font-medium text-white shadow-sm"
                : "text-[#666666] active:bg-black/[0.04]"
            }`}
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
