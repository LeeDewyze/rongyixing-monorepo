import { useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import type { CredentialFormMode, CredentialFormValues } from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CredentialFormShell } from "@/components/passenger/CredentialFormShell";
import { PassengerCredentialForm } from "@/components/passenger/PassengerCredentialForm";
import { usePageHeader } from "@/components/layout";
import {
  useRemoveExternalPassenger,
  useRemoveStaffCredential,
  useSaveExternalCredential,
  useSaveStaffCredential,
} from "@/hooks/usePassengerCredential";
import {
  buildCredentialReturnPath,
  credentialFormFromCredential,
  credentialFormFromPassenger,
  emptyCredentialForm,
  validateCredentialForm,
} from "@/lib/credential-form";
import { formatApiError } from "@/lib/formatApiError";
import { useMemberProfile } from "@/hooks/useMemberProfile";
import { normalizeCredentialName } from "@/lib/credential-name";
import type { MemberPassenger, PassengerCredential } from "@ryx/shared-types";

interface CredentialLocationState {
  passenger?: MemberPassenger;
  credential?: PassengerCredential;
  staffId?: string;
}

export function PassengerCredentialPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = (location.state ?? {}) as CredentialLocationState;
  const { data: memberProfile } = useMemberProfile();

  const mode = (searchParams.get("mode") ?? "external") as CredentialFormMode;
  const addNew = searchParams.get("addNew") === "1";
  const staffId = searchParams.get("staffId") ?? state.staffId;
  const returnTo =
    searchParams.get("returnTo") ??
    buildCredentialReturnPath("/hotel", Number(searchParams.get("forType") ?? "2") || undefined);
  const forType = searchParams.get("forType");

  const initialValues = useMemo((): CredentialFormValues => {
    if (state.passenger) return credentialFormFromPassenger(state.passenger, staffId);
    if (state.credential) return credentialFormFromCredential(state.credential, staffId);
    return emptyCredentialForm(staffId);
  }, [memberProfile?.Name, memberProfile?.RealName, mode, state.credential, state.passenger, staffId]);

  const [values, setValues] = useState<CredentialFormValues>(initialValues);
  const [error, setError] = useState("");
  const [showExternalDeleteConfirm, setShowExternalDeleteConfirm] = useState(false);

  const saveExternal = useSaveExternalCredential();
  const saveStaff = useSaveStaffCredential();
  const removeExternal = useRemoveExternalPassenger();
  const removeStaff = useRemoveStaffCredential();

  const isEdit = Boolean(values.Id) && !addNew;
  const isSaving = saveExternal.isPending || saveStaff.isPending;
  const isRemoving = removeExternal.isPending || removeStaff.isPending;
  const isCredentialOnlyMode = mode === "self" || mode === "staff";
  const fixedName = mode === "self" ? normalizeCredentialName(memberProfile?.RealName ?? memberProfile?.Name ?? "") : "";
  const title = isCredentialOnlyMode
    ? isEdit
      ? "编辑证件"
      : "新增证件"
    : isEdit
      ? "编辑乘机人信息"
      : "新增乘机人信息";
  const primaryLabel = isSaving
    ? "保存中…"
    : isCredentialOnlyMode
      ? isEdit
        ? "修改信息"
        : "保存"
      : "保存并使用该证件";

  usePageHeader({ visible: false });

  async function handleSave() {
    if (mode === "self" && normalizeCredentialName(values.Name) !== fixedName) {
      setError("证件姓名必须与真实姓名一致");
      return;
    }
    const validationError = validateCredentialForm(values, mode);
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    try {
      if (mode === "external") {
        await saveExternal.mutateAsync(values);
      } else {
        await saveStaff.mutateAsync({ ...values, StaffId: staffId ?? values.StaffId });
      }
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function handleRemoveClick() {
    if (!values.Id) return;
    if (mode === "external") {
      setShowExternalDeleteConfirm(true);
      return;
    }
    void handleStaffRemove();
  }

  async function handleStaffRemove() {
    if (!values.Id) return;
    if (!window.confirm("确定删除该证件？")) return;
    try {
      await removeStaff.mutateAsync({ ...values, StaffId: staffId ?? values.StaffId });
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  async function confirmExternalRemove() {
    if (!values.Id) return;
    try {
      await removeExternal.mutateAsync(values.Id);
      setShowExternalDeleteConfirm(false);
      navigate(returnTo, { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  return (
    <>
      <CredentialFormShell
        title={title}
        onBack={() => navigate(returnTo)}
        footer={
          <div className="mx-auto max-w-lg space-y-3">
            <button
              type="button"
              disabled={isSaving}
              className="flex h-11 w-full items-center justify-center rounded-lg bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-sm font-medium text-white active:opacity-90 disabled:opacity-50"
              onClick={() => void handleSave()}
            >
              {primaryLabel}
            </button>
            {isEdit ? (
              <button
                type="button"
                disabled={isRemoving}
                className="flex h-10 w-full items-center justify-center text-sm text-[#ff4d4f] active:opacity-80 disabled:opacity-50"
                onClick={() => handleRemoveClick()}
              >
                {isRemoving ? "删除中…" : "删除证件"}
              </button>
            ) : null}
          </div>
        }
      >
        <PassengerCredentialForm
          mode={mode}
          values={values}
          onChange={setValues}
          error={error}
          fixedName={fixedName}
        />
      </CredentialFormShell>

      {forType ? <input type="hidden" value={forType} readOnly /> : null}

      {mode === "external" ? (
        <ConfirmDialog
          open={showExternalDeleteConfirm}
          title="删除出行人"
          message={`确定删除非公司员工「${values.Name || "该出行人"}」？删除后将无法恢复。`}
          confirmLabel="删除"
          loading={removeExternal.isPending}
          onConfirm={() => void confirmExternalRemove()}
          onCancel={() => setShowExternalDeleteConfirm(false)}
        />
      ) : null}
    </>
  );
}
