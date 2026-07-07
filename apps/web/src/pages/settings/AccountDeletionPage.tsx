import { useState } from "react";

import { DangerWarningIcon } from "@/components/icons/DangerWarningIcon";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { PageToast } from "@/components/layout/PageToast";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { useAccountDeletion } from "@/hooks/useAccountDeletion";
import {
  ACCOUNT_DELETION_AGREEMENT_LABEL,
  ACCOUNT_DELETION_CONFIRM_BUTTON,
  ACCOUNT_DELETION_DIALOG_CANCEL,
  ACCOUNT_DELETION_DIALOG_CONFIRM,
  ACCOUNT_DELETION_DIALOG_MESSAGE,
  ACCOUNT_DELETION_DIALOG_TITLE,
  ACCOUNT_DELETION_PAGE_TITLE,
  ACCOUNT_DELETION_RULES,
  ACCOUNT_DELETION_SUBTITLE,
  ACCOUNT_DELETION_TOAST_AGREEMENT_REQUIRED,
} from "@/lib/account-deletion";
import { formatApiError } from "@/lib/formatApiError";

function WarningIcon() {
  return (
    <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-[#FFF1F0] text-[#FF4D4F] shadow-[inset_0_0_0_1px_rgba(255,77,79,0.12)]">
      <DangerWarningIcon className="size-5" />
    </span>
  );
}

function RuleNumber({ index }: { index: number }) {
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white text-[13px] font-semibold text-[#FF4D4F] shadow-[0_1px_4px_rgba(255,77,79,0.12)] ring-1 ring-[#FFE4E1]">
      {index}
    </span>
  );
}

function DeletionCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-5 shrink-0 items-center justify-center rounded-[6px] border transition-all duration-200 ${
        checked
          ? "border-[#FF4D4F] bg-[#FF4D4F] text-white shadow-[0_2px_8px_rgba(255,77,79,0.24)]"
          : "border-[#D0D5DD] bg-white"
      }`}
      aria-hidden
    >
      {checked ? (
        <svg viewBox="0 0 12 12" className="size-3" fill="none">
          <path
            d="M2.5 6l2.5 2.5 4.5-5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : null}
    </span>
  );
}

export function AccountDeletionPage() {
  usePageHeader({ visible: false });

  const deleteAccount = useAccountDeletion();

  const [agreed, setAgreed] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function handleConfirmClick() {
    if (!agreed) {
      showToast(ACCOUNT_DELETION_TOAST_AGREEMENT_REQUIRED);
      return;
    }
    setConfirmOpen(true);
  }

  async function handleConfirmDeletion() {
    try {
      await deleteAccount.mutateAsync();
      setConfirmOpen(false);
    } catch (err) {
      showToast(formatApiError(err));
      setConfirmOpen(false);
    }
  }

  return (
    <SettingsPageChrome title={ACCOUNT_DELETION_PAGE_TITLE} backTo="/settings/security">
      <div className={`flex min-h-full flex-col ${HOTEL_DETAIL_FONT}`}>
        <div className="flex min-h-full flex-1 flex-col rounded-t-2xl bg-white pb-[calc(5.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-4 mt-5 rounded-2xl border border-[#FFE4E1] bg-gradient-to-br from-[#FFF9F8] via-[#FFF5F3] to-[#FFF1F0] px-4 py-4 shadow-[0_4px_16px_rgba(255,77,79,0.06)]">
            <div className="flex items-start gap-3">
              <WarningIcon />
              <p className="pt-2 text-[14px] leading-[1.65] text-[#5C6678]">
                {ACCOUNT_DELETION_SUBTITLE}
              </p>
            </div>
          </div>

          <div className="mx-4 mt-5 overflow-hidden rounded-xl border border-[#EEF0F4] bg-[#FAFBFC] shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
            {ACCOUNT_DELETION_RULES.map((rule, index) => (
              <div
                key={rule}
                className={`flex items-start gap-3 px-4 py-3.5 ${
                  index < ACCOUNT_DELETION_RULES.length - 1 ? "border-b border-[#EEF0F4]" : ""
                }`}
              >
                <RuleNumber index={index + 1} />
                <p className="pt-1 text-[14px] leading-relaxed text-[#333333]">{rule}</p>
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`mx-4 mt-5 flex w-[calc(100%-2rem)] items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200 active:scale-[0.995] ${
              agreed
                ? "border-[#FFCCC7] bg-[#FFF9F8] shadow-[0_2px_12px_rgba(255,77,79,0.08)]"
                : "border-[#EEF0F4] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.03)]"
            }`}
            onClick={() => setAgreed((value) => !value)}
          >
            <DeletionCheckbox checked={agreed} />
            <span className="text-[13px] leading-[1.65] text-[#5C6678]">
              {ACCOUNT_DELETION_AGREEMENT_LABEL}
            </span>
          </button>
        </div>

        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-[#EEF0F4] bg-white/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-8px_24px_rgba(15,23,42,0.06)] backdrop-blur-md">
          <button
            type="button"
            className="flex h-12 w-full items-center justify-center rounded-full bg-[#FF4D4F] text-[16px] font-medium text-white shadow-[0_8px_20px_rgba(255,77,79,0.28)] transition-opacity duration-200 active:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={deleteAccount.isPending}
            onClick={handleConfirmClick}
          >
            {deleteAccount.isPending ? "处理中…" : ACCOUNT_DELETION_CONFIRM_BUTTON}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={ACCOUNT_DELETION_DIALOG_TITLE}
        message={ACCOUNT_DELETION_DIALOG_MESSAGE}
        confirmLabel={ACCOUNT_DELETION_DIALOG_CONFIRM}
        cancelLabel={ACCOUNT_DELETION_DIALOG_CANCEL}
        variant="destructive"
        loading={deleteAccount.isPending}
        onConfirm={() => void handleConfirmDeletion()}
        onCancel={() => setConfirmOpen(false)}
      />

      {toast ? <PageToast message={toast} tone="error" /> : null}
    </SettingsPageChrome>
  );
}
