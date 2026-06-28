import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { AccountCard } from "@ryx/shared-types";
import { maskBankCardNumber, parseAccountCardVariables } from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePageHeader } from "@/components/layout";
import { useAccountCards, useRemoveAccountCard } from "@/hooks/useAccountCards";
import { formatApiError } from "@/lib/formatApiError";

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`size-5 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M17 10a7 7 0 01-7 7 7 7 0 01-5.16-2.26M3 10a7 7 0 017-7 7 7 0 015.16 2.26"
        strokeLinecap="round"
      />
      <path d="M16 2v3h-3M4 18v-3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BankCardIcon() {
  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF5FF] text-brand-primary">
      <svg
        viewBox="0 0 24 24"
        className="size-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="mx-4 rounded-2xl bg-white px-6 py-10 text-center shadow-sm">
      <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-[#EEF5FF] text-brand-primary">
        <svg
          viewBox="0 0 24 24"
          className="size-7"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 15h.01M12 15h2" />
        </svg>
      </div>
      <p className="mt-4 text-[16px] font-semibold text-brand-title">暂无银行卡</p>
      <p className="mt-1 text-sm leading-relaxed text-[#777777]">添加后可在个人中心统一管理。</p>
      <button
        type="button"
        className="mt-5 inline-flex h-10 items-center justify-center rounded-full bg-brand-primary px-5 text-sm font-medium text-white active:opacity-90"
        onClick={onAdd}
      >
        添加银行卡
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-3 px-4">
      {[0, 1].map((item) => (
        <div key={item} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="size-10 animate-pulse rounded-xl bg-[#EEF0F4]" />
            <div className="min-w-0 flex-1">
              <div className="h-4 w-28 animate-pulse rounded bg-[#EEF0F4]" />
              <div className="mt-3 h-3 w-44 animate-pulse rounded bg-[#EEF0F4]" />
              <div className="mt-3 h-3 w-32 animate-pulse rounded bg-[#EEF0F4]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function AccountCardItem({
  card,
  onEdit,
  onDelete,
}: {
  card: AccountCard;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const variables = parseAccountCardVariables(card);

  return (
    <article className="mx-4 mb-3 rounded-2xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <BankCardIcon />
        <button type="button" className="min-w-0 flex-1 text-left" onClick={onEdit}>
          <div className="flex min-w-0 items-center gap-2">
            <h2 className="truncate text-[16px] font-semibold text-brand-title">{card.Name}</h2>
            <span className="shrink-0 rounded-full bg-[#EEF5FF] px-2 py-0.5 text-xs font-medium text-brand-primary">
              储蓄卡
            </span>
          </div>
          <p className="mt-2 font-mono text-[15px] leading-none text-[#333333]">
            {maskBankCardNumber(card.Number)}
          </p>
          <div className="mt-3 space-y-1 text-sm leading-relaxed text-[#666666]">
            <p className="truncate">
              <span className="text-[#999999]">持卡人 </span>
              {variables.Cardholder || "-"}
            </p>
            <p className="truncate">
              <span className="text-[#999999]">开户网点 </span>
              {variables.BankOutlets || "-"}
            </p>
          </div>
        </button>
        <div className="flex shrink-0 items-start gap-1.5">
          <button
            type="button"
            className="flex h-8 items-center rounded-full bg-[#EEF5FF] px-3 text-xs font-medium text-brand-primary active:opacity-80"
            onClick={onEdit}
          >
            编辑
          </button>
          <button
            type="button"
            className="flex h-8 items-center rounded-full bg-[#FFF1F0] px-3 text-xs font-medium text-[#FF4D4F] active:opacity-80"
            onClick={onDelete}
          >
            删除
          </button>
        </div>
      </div>
    </article>
  );
}

export function AccountCardListPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });

  const cardsQuery = useAccountCards();
  const removeCard = useRemoveAccountCard();
  const [deleteTarget, setDeleteTarget] = useState<AccountCard | null>(null);
  const [pageError, setPageError] = useState("");

  function navigateAdd() {
    navigate("/bank-cards/new");
  }

  function navigateEdit(card: AccountCard) {
    if (!card.Id) return;
    navigate(`/bank-cards/${encodeURIComponent(card.Id)}`);
  }

  async function handleRemove() {
    if (!deleteTarget) return;
    try {
      await removeCard.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    } catch (error) {
      setPageError(formatApiError(error));
    }
  }

  const cards = cardsQuery.data ?? [];
  const isRefreshing = cardsQuery.isFetching && !cardsQuery.isLoading;

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
            onClick={() => navigate("/home/mine", { replace: true })}
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
            银行卡管理
          </h1>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70 disabled:opacity-50"
            aria-label={isRefreshing ? "正在刷新" : "刷新"}
            disabled={isRefreshing}
            onClick={() => {
              setPageError("");
              void cardsQuery.refetch();
            }}
          >
            <RefreshIcon spinning={isRefreshing} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-4 pt-3">
        {isRefreshing ? (
          <div className="mx-4 mb-3 rounded-full bg-white/75 px-4 py-2 text-center text-xs font-medium text-brand-primary shadow-sm">
            正在刷新银行卡信息…
          </div>
        ) : null}

        {cardsQuery.isLoading ? <ListSkeleton /> : null}

        {cardsQuery.error ? (
          <div className="mx-4 rounded-xl bg-white px-4 py-3 text-sm text-[#ff4d4f] shadow-sm">
            {formatApiError(cardsQuery.error)}
          </div>
        ) : null}

        {pageError ? (
          <div className="mx-4 mb-3 rounded-xl bg-[#FFF1F0] px-4 py-3 text-sm text-[#ff4d4f]">
            {pageError}
          </div>
        ) : null}

        {!cardsQuery.isLoading && !cardsQuery.error ? (
          cards.length > 0 ? (
            cards.map((card) => (
              <AccountCardItem
                key={card.Id ?? card.Number}
                card={card}
                onEdit={() => navigateEdit(card)}
                onDelete={() => setDeleteTarget(card)}
              />
            ))
          ) : (
            <EmptyState onAdd={navigateAdd} />
          )
        ) : null}
      </div>

      <div className="shrink-0 border-t border-[#ECECEC] bg-[#F5F6F9] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white active:opacity-90 disabled:opacity-50"
          disabled={removeCard.isPending}
          onClick={navigateAdd}
        >
          添加银行卡
        </button>
      </div>

      <ConfirmDialog
        open={deleteTarget != null}
        title="删除银行卡"
        message={
          deleteTarget
            ? `确定删除「${parseAccountCardVariables(deleteTarget).Cardholder || deleteTarget.Name}」的${deleteTarget.Name}？删除后将无法恢复。`
            : ""
        }
        confirmLabel="删除"
        loading={removeCard.isPending}
        onConfirm={() => void handleRemove()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
