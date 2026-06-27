import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import type { PassengerCredential } from "@ryx/shared-types";
import {
  credentialDisplayType,
  credentialTypeValue,
  maskCredentialNumber,
} from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { usePageHeader } from "@/components/layout";
import { PassengerCredentialActionButton } from "@/components/passenger/PassengerCredentialActionButton";
import { useCredentialList } from "@/hooks/useCredentialList";
import { useRemoveStaffCredential } from "@/hooks/usePassengerCredential";
import { credentialFormFromCredential } from "@/lib/credential-form";
import { formatApiError } from "@/lib/formatApiError";

function CredentialCard({
  name,
  typeLabel,
  number,
  mobile,
  orgName,
  onEdit,
  onDelete,
}: {
  name: string;
  typeLabel: string;
  number: string;
  mobile?: string;
  orgName?: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="mx-4 mb-3 rounded-xl bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-[#333333]">{name}</p>
          {orgName ? <p className="mt-1 truncate text-sm text-[#666666]">{orgName}</p> : null}
          <p className="mt-1 text-sm text-[#333333]">
            <span className="text-[#999999]">{typeLabel} </span>
            {number}
          </p>
          {mobile ? <p className="mt-0.5 text-sm text-[#666666]">{mobile}</p> : null}
        </div>
        <div className="flex shrink-0 items-start gap-1.5">
          <PassengerCredentialActionButton label="编辑" tone="edit" onClick={onEdit} />
          <PassengerCredentialActionButton label="删除" tone="delete" onClick={onDelete} />
        </div>
      </div>
    </div>
  );
}

function displayCredentialNumber(credential: PassengerCredential): string {
  return (
    credential.HideNumber ??
    credential.HideCredentialsNumber ??
    maskCredentialNumber(credential.Number ?? "")
  );
}

export function CredentialListPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });

  const queryClient = useQueryClient();
  const credentialQuery = useCredentialList();
  const [deleteTargetCredential, setDeleteTargetCredential] = useState<PassengerCredential | null>(
    null,
  );
  const [pageError, setPageError] = useState("");

  const removeStaff = useRemoveStaffCredential();

  const credentials = useMemo(
    () =>
      [...(credentialQuery.data ?? [])].sort(
        (a, b) => credentialTypeValue(a) - credentialTypeValue(b),
      ),
    [credentialQuery.data],
  );

  function navigateAdd() {
    navigate("/passenger/credential?mode=self&addNew=1&returnTo=/credentials");
  }

  function navigateEditCredential(credential: PassengerCredential) {
    navigate("/passenger/credential?mode=self&returnTo=/credentials", {
      state: {
        credential,
      },
    });
  }

  async function handleStaffRemove() {
    if (!deleteTargetCredential) return;
    try {
      await removeStaff.mutateAsync(credentialFormFromCredential(deleteTargetCredential));
      setDeleteTargetCredential(null);
    } catch (err) {
      setPageError(formatApiError(err));
    }
  }

  const isRemoving = removeStaff.isPending;

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
            证件列表
          </h1>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70"
            aria-label="刷新"
            onClick={() => {
              void queryClient.invalidateQueries({ queryKey: ["credential"] });
            }}
          >
            <svg
              viewBox="0 0 20 20"
              className="size-5"
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
          </button>
        </div>
      </div>

      <div className="flex-1 pb-4 pt-3">
        {credentialQuery.isLoading ? (
          <p className="py-10 text-center text-sm text-[#999999]">加载中…</p>
        ) : null}

        {credentialQuery.error ? (
          <p className="mx-4 py-4 text-sm text-[#ff4d4f]">
            {formatApiError(credentialQuery.error)}
          </p>
        ) : null}

        {pageError ? <p className="mx-4 py-2 text-sm text-[#ff4d4f]">{pageError}</p> : null}

        {!credentialQuery.isLoading ? (
          <>
            {credentials.map((c) => (
              <CredentialCard
                key={c.Id}
                name={c.Name}
                typeLabel={credentialDisplayType(c)}
                number={displayCredentialNumber(c)}
                mobile={c.Mobile}
                orgName={c.OrgName}
                onEdit={() => navigateEditCredential(c)}
                onDelete={() => setDeleteTargetCredential(c)}
              />
            ))}
            {credentials.length === 0 ? (
              <p className="py-10 text-center text-sm text-[#999999]">暂无证件</p>
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
          添加证件
        </button>
      </div>

      {/* Staff delete confirm */}
      <ConfirmDialog
        open={deleteTargetCredential != null}
        title="删除证件"
        message={
          deleteTargetCredential
            ? `确定删除「${deleteTargetCredential.Name}」的${credentialDisplayType(deleteTargetCredential)}？删除后将无法恢复。`
            : ""
        }
        confirmLabel="删除"
        loading={removeStaff.isPending}
        onConfirm={() => void handleStaffRemove()}
        onCancel={() => setDeleteTargetCredential(null)}
      />
    </div>
  );
}
