import { useMemo } from "react";
import type { BookOrganizationOption } from "@ryx/shared-types";

interface FlightBookOrganizationSheetProps {
  open: boolean;
  organizations: BookOrganizationOption[];
  selectedCode?: string;
  onClose: () => void;
  onSelect: (organization: { code: string; name: string }) => void;
}

export function FlightBookOrganizationSheet({
  open,
  organizations,
  selectedCode,
  onClose,
  onSelect,
}: FlightBookOrganizationSheetProps) {
  const items = useMemo(
    () =>
      organizations.filter(
        (item) => item.Id !== (item.Parent?.Id ?? item.ParentId),
      ),
    [organizations],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="sticky top-0 border-b border-[#eeeeee] bg-white px-4 py-3">
          <p className="text-center text-[16px] font-semibold text-[#333333]">选择部门</p>
        </div>
        <ul className="divide-y divide-[#f0f0f0] px-4">
          {items.length === 0 ? (
            <li className="py-8 text-center text-[13px] text-[#999999]">暂无部门</li>
          ) : (
            items.map((item) => {
              const selected = item.Code === selectedCode;
              return (
                <li key={item.Id ?? item.Code ?? item.Name}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between py-3.5 text-left text-[15px] active:bg-[#f5f7fa]"
                    onClick={() => {
                      onSelect({ code: item.Code ?? "", name: item.Name ?? "" });
                      onClose();
                    }}
                  >
                    <span className={selected ? "font-medium text-[#5099fe]" : "text-[#333333]"}>
                      {item.Name}
                    </span>
                    {selected ? <span className="text-[#5099fe]">✓</span> : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>
  );
}
