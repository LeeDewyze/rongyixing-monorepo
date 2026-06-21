import { CREDENTIAL_NAME_RULES } from "@/lib/credential-name";

interface CredentialNameRulesDialogProps {
  open: boolean;
  onClose: () => void;
}

/** Centered modal — Legacy「姓名填写规则」. */
export function CredentialNameRulesDialog({ open, onClose }: CredentialNameRulesDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 px-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="credential-name-rules-title"
        className="flex max-h-[min(80vh,640px)] w-full max-w-sm flex-col overflow-hidden rounded-2xl bg-white shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-5 pb-3 pt-5">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-[#eeeeee]" aria-hidden />
            <div className="shrink-0 text-center">
              <h2 id="credential-name-rules-title" className="text-base font-semibold text-[#333333]">
                姓名填写规则
              </h2>
              <div className="mx-auto mt-1.5 h-0.5 w-10 rounded-full bg-[#5099fe]" aria-hidden />
            </div>
            <div className="h-px flex-1 bg-[#eeeeee]" aria-hidden />
          </div>
        </div>

        <ol className="min-h-0 flex-1 overflow-y-auto px-5 pb-4 text-sm leading-relaxed text-[#666666]">
          {CREDENTIAL_NAME_RULES.map((rule, index) => (
            <li key={rule} className="mb-3 last:mb-0">
              {index + 1}.{rule}
            </li>
          ))}
        </ol>

        <div className="shrink-0 px-5 pb-5">
          <button
            type="button"
            className="flex h-11 w-full items-center justify-center rounded-full bg-[#5099fe] text-sm font-medium text-white active:opacity-90"
            onClick={onClose}
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}

/** @deprecated Use CredentialNameRulesDialog */
export const CredentialNameRulesSheet = CredentialNameRulesDialog;
