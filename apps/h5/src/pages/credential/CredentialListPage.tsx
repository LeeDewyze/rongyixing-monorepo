import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { MemberPassenger, PassengerCredential } from "@ryx/shared-types";
import {
  credentialDisplayNumber,
  credentialDisplayType,
  maskCredentialNumber,
} from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePageHeader } from "@/components/layout";
import { useStaffCredentials, useExternalPassengerListForManagement } from "@/hooks/useCredentialList";
import {
  useRemoveExternalPassenger,
  useRemoveStaffCredential,
} from "@/hooks/usePassengerCredential";
import { credentialFormFromCredential } from "@/lib/credential-form";
import { formatApiError } from "@/lib/formatApiError";
import { getLoginUserId } from "@/lib/session";
import type { PassengerTabKey } from "@/components/passenger";

/** Legacy member-credential-list + member-credential-management style tab labels. */
const TAB_LABELS: Record<PassengerTabKey, string> = {
  employee: "员工证件",
  external: "常旅客证件",
};

function CredentialCard({
  id,
  name,
  typeLabel,
  number,
  mobile,
  onEdit,
  onDelete,
}: {
  id: string;
  name: string;
  typeLabel: string;
  number: string;
  mobile?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mx-4 mb-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[#333333]">{name}</p>
          <p className="mt-1 text-sm text-[#333333]">
            <span className="text-[#999999]">{typeLabel} </span>
            {maskCredentialNumber(number)}
          </p>
          {mobile ? (
            <p className="mt-0.5 text-sm text-[#666666]">{mobile}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 items-start gap-1">
          <button
            type="button"
            className="flex size-8 items-center justify-center text-[#999999] active:opacity-70"
            aria-label="编辑"
            onClick={onEdit}
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 14.5V16h1.5L14 7.5 12.5 6 4 14.5z" />
              <path d="M11 5l2 2" />
            </svg>
          </button>
          <button
            type="button"
            className="flex size-8 items-center justify-center text-[#ff4d4f] active:opacity-70"
            aria-label="删除"
            onClick={onDelete}
          >
            <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 6h10M8 6V4h4v2M7 6v9h6V6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CredentialListPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });

  const queryClient = useQueryClient();
  const accountId = getLoginUserId();

  const [tab, setTab] = useState<PassengerTabKey>("employee");
  const [deleteTargetStaff, setDeleteTargetStaff] = useState<PassengerCredential | null>(null);
  const [deleteTargetExternal, setDeleteTargetExternal] = useState<MemberPassenger | null>(null);
  const [pageError, setPageError] = useState("");

  const staffQuery = useStaffCredentials();
  const externalQuery = useExternalPassengerListForManagement();
  const removeStaff = useRemoveStaffCredential();
  const removeExternal = useRemoveExternalPassenger();

  const staffCredentials = staffQuery.data ?? [];
  const externalPassengers = externalQuery.data ?? [];

  const isLoading = tab === "employee" ? staffQuery.isLoading : externalQuery.isLoading;
  const queryError = tab === "employee" ? staffQuery.error : externalQuery.error;

  function navigateAdd() {
    const mode = tab === "external" ? "external" : "staff";
    navigate(
      `/passenger/credential?mode=${mode}&addNew=1${tab === "staff" && accountId ? `&staffId=${accountId}` : ""}&returnTo=/credentials`,
    );
  }

  function navigateEditStaff(credential: PassengerCredential) {
    navigate(
      `/passenger/credential?mode=staff&staffId=${accountId ?? credential.AccountId ?? ""}&returnTo=/credentials`,
      {
        state: {
          credential,
          staffId: accountId ?? credential.AccountId,
        },
      },
    );
  }

  function navigateEditExternal(passenger: MemberPassenger) {
    navigate(
      `/passenger/credential?mode=external&returnTo=/credentials`,
      {
        state: { passenger },
      },
    );
  }

  async function handleStaffRemove() {
    if (!deleteTargetStaff) return;
    try {
      await removeStaff.mutateAsync(
        credentialFormFromCredential(deleteTargetStaff, accountId ?? deleteTargetStaff.AccountId),
      );
      setDeleteTargetStaff(null);
    } catch (err) {
      setPageError(formatApiError(err));
    }
  }

  async function handleExternalRemove() {
    if (!deleteTargetExternal) return;
    try {
      await removeExternal.mutateAsync(deleteTargetExternal.Id);
      setDeleteTargetExternal(null);
    } catch (err) {
      setPageError(formatApiError(err));
    }
  }

  const isRemoving = removeStaff.isPending || removeExternal.isPending;

  return (
    <div className="flex min-h-full flex-col" style={{ background: "var(--brand-form-header-gradient)" }}>
      <div className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1 pb-2 pt-1">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70"
            aria-label="返回"
            onClick={() => navigate("/home/mine", { replace: true })}
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-medium text-brand-title">
            证件管理
          </h1>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70"
            aria-label="刷新"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["credential"] });
            }}
          >
            <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 10a7 7 0 01-7 7 7 7 0 01-5.16-2.26M3 10a7 7 0 017-7 7 7 0 015.16 2.26" strokeLinecap="round" />
              <path d="M16 2v3h-3M4 18v-3h3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Segment tabs */}
        <div className="flex justify-center pb-2">
          <div className="inline-flex rounded-full bg-white/20 p-0.5">
            {(["employee", "external"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${
                  tab === key ? "bg-white text-[#5099fe] shadow-sm" : "text-brand-title/60"
                }`}
                onClick={() => setTab(key)}
              >
                {TAB_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 pb-4 pt-3">
        {isLoading ? (
          <p className="py-10 text-center text-sm text-[#999999]">加载中…</p>
        ) : null}

        {queryError ? (
          <p className="mx-4 py-4 text-sm text-[#ff4d4f]">{formatApiError(queryError)}</p>
        ) : null}

        {pageError ? (
          <p className="mx-4 py-2 text-sm text-[#ff4d4f]">{pageError}</p>
        ) : null}

        {!isLoading && tab === "employee" ? (
          <>
            {staffCredentials.map((c) => (
              <CredentialCard
                key={c.Id}
                id={c.Id}
                name={c.Name}
                typeLabel={credentialDisplayType(c)}
                number={c.Number ?? ""}
                mobile={c.Mobile}
                onEdit={() => navigateEditStaff(c)}
                onDelete={() => setDeleteTargetStaff(c)}
              />
            ))}
            {staffCredentials.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#999999]">暂无员工证件</p>
            ) : null}
          </>
        ) : null}

        {!isLoading && tab === "external" ? (
          <>
            {externalPassengers.map((p) => (
              <CredentialCard
                key={p.Id}
                id={p.Id}
                name={p.Name}
                typeLabel={p.CredentialTypeName ?? p.CredentialsTypeName ?? "证件"}
                number={p.CredentialNo ?? p.Number ?? ""}
                mobile={p.Mobile}
                onEdit={() => navigateEditExternal(p)}
                onDelete={() => setDeleteTargetExternal(p)}
              />
            ))}
            {externalPassengers.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#999999]">暂无常旅客</p>
            ) : null}
          </>
        ) : null}
      </div>

      {/* Add button — pinned at bottom */}
      <div className="shrink-0 border-t border-[#ECECEC] bg-[#F5F6F9] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        <button
          type="button"
          className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white active:opacity-90 disabled:opacity-50"
          disabled={isRemoving}
          onClick={navigateAdd}
        >
          新增{TAB_LABELS[tab]}
        </button>
      </div>

      {/* Staff delete confirm */}
      <ConfirmDialog
        open={deleteTargetStaff != null}
        title="删除证件"
        message={
          deleteTargetStaff
            ? `确定删除「${deleteTargetStaff.Name}」的${credentialDisplayType(deleteTargetStaff)}？删除后将无法恢复。`
            : ""
        }
        confirmLabel="删除"
        loading={removeStaff.isPending}
        onConfirm={() => void handleStaffRemove()}
        onCancel={() => setDeleteTargetStaff(null)}
      />

      {/* External delete confirm */}
      <ConfirmDialog
        open={deleteTargetExternal != null}
        title="删除出行人"
        message={
          deleteTargetExternal
            ? `确定删除非公司员工「${deleteTargetExternal.Name}」？删除后将无法恢复。`
            : ""
        }
        confirmLabel="删除"
        loading={removeExternal.isPending}
        onConfirm={() => void handleExternalRemove()}
        onCancel={() => setDeleteTargetExternal(null)}
      />
    </div>
  );
}
