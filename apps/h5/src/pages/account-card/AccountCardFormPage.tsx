import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { AccountCard, AccountCardFormValues } from "@ryx/shared-types";
import {
  BANK_NAME_OPTIONS,
  accountCardToFormValues,
  maskBankCardNumber,
  parseAccountCardVariables,
} from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePageHeader } from "@/components/layout";
import { ClearFieldButton, ClearableFieldInput } from "@/components/form";
import {
  useAccountCards,
  useRemoveAccountCard,
  useSaveAccountCard,
} from "@/hooks/useAccountCards";
import { formatApiError } from "@/lib/formatApiError";

function FormRow({
  label,
  children,
  divider = true,
  onClick,
}: {
  label: string;
  children: ReactNode;
  divider?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <div
      className={`flex min-h-[54px] items-center gap-3 px-4 ${
        divider ? "border-b border-[#eeeeee]" : ""
      }`}
    >
      <span className="shrink-0 text-sm text-[#333333]">{label}</span>
      <div className="flex min-w-0 flex-1 items-center justify-end gap-2">{children}</div>
    </div>
  );

  if (!onClick) return content;

  return (
    <button type="button" className="block w-full text-left active:bg-[#fafafa]" onClick={onClick}>
      {content}
    </button>
  );
}

function ChevronRight() {
  return (
    <span className="shrink-0 text-sm text-[#cccccc]" aria-hidden>
      ›
    </span>
  );
}

function SelectedCheckIcon() {
  return (
    <span className="text-brand-primary" aria-hidden>
      ✓
    </span>
  );
}

function BankNameSheet({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: string;
  onClose: () => void;
  onSelect: (value: string) => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="max-h-[70vh] overflow-y-auto rounded-t-2xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
        <h2 className="mb-4 text-center text-base font-semibold text-[#333333]">发卡银行</h2>
        <ul className="divide-y divide-[#eeeeee]">
          {BANK_NAME_OPTIONS.map((option) => {
            const selected = option === value;
            return (
              <li key={option}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between py-4 text-left text-sm active:bg-[#f5f7fa]"
                  onClick={() => {
                    onSelect(option);
                    onClose();
                  }}
                >
                  <span className={selected ? "font-medium text-brand-primary" : "text-[#333333]"}>
                    {option}
                  </span>
                  {selected ? <SelectedCheckIcon /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function AccountCardPreview({ values }: { values: AccountCardFormValues }) {
  return (
    <div className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="rounded-2xl bg-gradient-to-br from-brand-header-start to-brand-primary p-4 text-white shadow-[0_10px_24px_rgba(39,104,250,0.22)]">
        <p className="text-sm opacity-90">{values.Name || "请选择发卡银行"}</p>
        <p className="mt-5 font-mono text-[19px] font-semibold tracking-normal">
          {values.Number ? maskBankCardNumber(values.Number) : "---- ---- ---- ----"}
        </p>
        <div className="mt-5 flex items-center justify-between gap-3 text-xs opacity-90">
          <span className="truncate">{values.Cardholder || "持卡人姓名"}</span>
          <span className="shrink-0">Bank Card</span>
        </div>
      </div>
    </div>
  );
}

function findCard(cards: AccountCard[], cardId?: string): AccountCard | null {
  if (!cardId || cardId === "new") return null;
  return cards.find((card) => String(card.Id) === cardId) ?? null;
}

function normalizeNumberInput(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function validateValues(values: AccountCardFormValues): string {
  if (!values.Name.trim()) return "请选择发卡银行";
  if (!values.Cardholder.trim()) return "请填写持卡人姓名";
  if (!values.Number.trim()) return "请填写卡号";
  if (values.Number.replace(/\s+/g, "").length < 8) return "请填写正确的卡号";
  return "";
}

export function AccountCardFormPage() {
  const navigate = useNavigate();
  const { cardId } = useParams();
  usePageHeader({ visible: false });

  const cardsQuery = useAccountCards();
  const saveCard = useSaveAccountCard();
  const removeCard = useRemoveAccountCard();
  const editingCard = useMemo(() => findCard(cardsQuery.data ?? [], cardId), [cardId, cardsQuery.data]);
  const isEdit = Boolean(cardId && cardId !== "new");

  const [values, setValues] = useState<AccountCardFormValues>(() => accountCardToFormValues(null));
  const [bankSheetOpen, setBankSheetOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pageError, setPageError] = useState("");

  useEffect(() => {
    if (isEdit && editingCard) {
      setValues(accountCardToFormValues(editingCard));
    }
    if (!isEdit) {
      setValues(accountCardToFormValues(null));
    }
  }, [editingCard, isEdit]);

  function updateValues(patch: Partial<AccountCardFormValues>) {
    setPageError("");
    setValues((current) => ({ ...current, ...patch }));
  }

  async function handleSave() {
    const error = validateValues(values);
    if (error) {
      setPageError(error);
      return;
    }

    try {
      await saveCard.mutateAsync(values);
      navigate("/bank-cards", { replace: true });
    } catch (err) {
      setPageError(formatApiError(err));
    }
  }

  async function handleRemove() {
    if (!editingCard) return;
    try {
      await removeCard.mutateAsync(editingCard);
      setDeleteOpen(false);
      navigate("/bank-cards", { replace: true });
    } catch (err) {
      setPageError(formatApiError(err));
    }
  }

  const isBusy = saveCard.isPending || removeCard.isPending;
  const variables = editingCard ? parseAccountCardVariables(editingCard) : null;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <div className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1 pb-2 pt-1">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70"
            aria-label="返回"
            onClick={() => navigate("/bank-cards")}
          >
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-medium text-brand-title">
            {isEdit ? "编辑银行卡" : "添加银行卡"}
          </h1>
          <div className="size-10 shrink-0" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-24 pt-3">
        <AccountCardPreview values={values} />

        {cardsQuery.isLoading && isEdit ? (
          <p className="mx-4 mb-3 rounded-xl bg-white px-4 py-3 text-sm text-[#777777] shadow-sm">
            正在加载银行卡信息…
          </p>
        ) : null}

        {isEdit && !cardsQuery.isLoading && !editingCard ? (
          <p className="mx-4 mb-3 rounded-xl bg-[#FFF1F0] px-4 py-3 text-sm text-[#ff4d4f]">
            未找到该银行卡，请返回列表后重试。
          </p>
        ) : null}

        {pageError ? (
          <p className="mx-4 mb-3 rounded-xl bg-[#FFF1F0] px-4 py-3 text-sm text-[#ff4d4f]">
            {pageError}
          </p>
        ) : null}

        <div className="mx-4 overflow-hidden rounded-2xl bg-white shadow-sm">
          <FormRow label="发卡银行" onClick={() => setBankSheetOpen(true)}>
            <span className={`min-w-0 flex-1 truncate text-right text-sm ${values.Name ? "text-[#333333]" : "text-[#bbbbbb]"}`}>
              {values.Name || "请选择"}
            </span>
            <ChevronRight />
          </FormRow>
          <FormRow label="开户网点">
            <ClearableFieldInput
              value={values.BankOutlets}
              placeholder="请输入开户网点"
              onChange={(event) => updateValues({ BankOutlets: event.target.value })}
              onClear={() => updateValues({ BankOutlets: "" })}
            />
          </FormRow>
          <FormRow label="持卡人姓名">
            <ClearableFieldInput
              value={values.Cardholder}
              placeholder="请输入持卡人姓名"
              onChange={(event) => updateValues({ Cardholder: event.target.value })}
              onClear={() => updateValues({ Cardholder: "" })}
            />
          </FormRow>
          <FormRow label="卡号" divider={false}>
            <input
              className="min-w-0 flex-1 bg-transparent text-right font-mono text-sm text-[#333333] outline-none placeholder:font-sans placeholder:text-[#bbbbbb]"
              inputMode="numeric"
              value={values.Number}
              placeholder="请输入银行卡号"
              onChange={(event) => updateValues({ Number: normalizeNumberInput(event.target.value) })}
            />
            {values.Number ? <ClearFieldButton onClear={() => updateValues({ Number: "" })} /> : null}
          </FormRow>
        </div>

        {isEdit && editingCard ? (
          <div className="mx-4 mt-3 rounded-2xl bg-white px-4 py-3 shadow-sm">
            <div className="text-xs leading-relaxed text-[#999999]">
              当前记录：{editingCard.Name}，
              {variables?.Cardholder ? `持卡人 ${variables.Cardholder}，` : ""}
              尾号 {editingCard.Number.slice(-4)}
            </div>
            <button
              type="button"
              className="mt-3 flex h-10 w-full items-center justify-center rounded-full border border-[#FFE1E1] bg-[#FFF7F7] text-sm font-medium text-[#FF4D4F] active:opacity-80 disabled:opacity-50"
              disabled={isBusy}
              onClick={() => setDeleteOpen(true)}
            >
              删除银行卡
            </button>
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#ECECEC] bg-[#F5F6F9] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white active:opacity-90 disabled:opacity-50"
          disabled={isBusy || (isEdit && !editingCard)}
          onClick={() => void handleSave()}
        >
          {saveCard.isPending ? "保存中…" : "保存"}
        </button>
      </div>

      <BankNameSheet
        open={bankSheetOpen}
        value={values.Name}
        onClose={() => setBankSheetOpen(false)}
        onSelect={(value) => updateValues({ Name: value })}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="删除银行卡"
        message={
          editingCard
            ? `确定删除「${parseAccountCardVariables(editingCard).Cardholder || editingCard.Name}」的${editingCard.Name}？删除后将无法恢复。`
            : ""
        }
        confirmLabel="删除"
        loading={removeCard.isPending}
        onConfirm={() => void handleRemove()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
