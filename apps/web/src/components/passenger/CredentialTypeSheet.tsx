import {
  CREDENTIAL_TYPE_LABELS,
  LEGACY_MEMBER_CREDENTIAL_TYPE_OPTIONS,
} from "@ryx/shared-types";

interface CredentialTypeSheetProps {
  open: boolean;
  value: number;
  onClose: () => void;
  onSelect: (type: number) => void;
}

export function CredentialTypeSheet({
  open,
  value,
  onClose,
  onSelect,
}: CredentialTypeSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <h2 className="mb-4 text-center text-base font-semibold text-[#333333]">证件类型</h2>
        <ul className="divide-y divide-[#eeeeee]">
          {LEGACY_MEMBER_CREDENTIAL_TYPE_OPTIONS.map((type) => {
            const selected = type === value;
            return (
              <li key={type}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left text-sm active:bg-[#f5f7fa]"
                  onClick={() => {
                    onSelect(type);
                    onClose();
                  }}
                >
                  <span className={selected ? "font-medium text-[#5099fe]" : "text-[#333333]"}>
                    {CREDENTIAL_TYPE_LABELS[type]}
                  </span>
                  {selected ? (
                    <span className="text-[#5099fe]" aria-hidden>
                      ✓
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
