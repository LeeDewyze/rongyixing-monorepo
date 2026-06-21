import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { MemberPassenger, PassengerBookInfo, PassengerCredential } from "@ryx/shared-types";
import { parseProductType } from "@ryx/shared-types";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  EmployeePassengerCard,
  ExternalPassengerCard,
  PassengerAddExternalButton,
  PassengerPickerFooter,
  PassengerSegmentTabs,
  SelectedPassengersSheet,
  type PassengerTabKey,
} from "@/components/passenger";
import { PickerShell } from "@/components/search/PickerShell";
import {
  useAllowExternalPassengers,
  useExternalPassengerList,
  usePassengerSelection,
  useStaffList,
} from "@/hooks/usePassenger";
import {
  useRemoveExternalPassenger,
  useRemoveStaffCredential,
} from "@/hooks/usePassengerCredential";
import { credentialFormFromCredential } from "@/lib/credential-form";
import { formatApiError } from "@/lib/formatApiError";
import {
  buildCredentialPagePath,
  buildPassengerSelectReturnPath,
  credentialNavigationState,
} from "@/lib/passenger-credential-nav";
import { toggleSelection, removeDeletedFromSelection } from "@/lib/passenger-select-logic";
import { loadPassengerSelection, savePassengerSelection } from "@/lib/passenger-selection";

export function PassengerSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forType = parseProductType(searchParams.get("forType"));
  const returnTo = searchParams.get("returnTo") ?? "/home";
  const selectReturnTo = buildPassengerSelectReturnPath(forType, returnTo);

  const { setSelected } = usePassengerSelection(forType);
  const { data: allowExternal } = useAllowExternalPassengers();
  const removeExternal = useRemoveExternalPassenger();
  const removeStaffCredential = useRemoveStaffCredential();

  const [tab, setTab] = useState<PassengerTabKey>("employee");
  const [keyword, setKeyword] = useState("");
  const [draft, setDraft] = useState<PassengerBookInfo[]>(() =>
    loadPassengerSelection(forType),
  );
  const [error, setError] = useState("");
  const [selectedSheetOpen, setSelectedSheetOpen] = useState(false);
  const [externalDeleteTarget, setExternalDeleteTarget] = useState<MemberPassenger | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedKeywordRef = useRef(keyword);
  const [debouncedKeyword, setDebouncedKeyword] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      debouncedKeywordRef.current = keyword;
      setDebouncedKeyword(keyword.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [keyword]);

  useEffect(() => {
    setDraft(loadPassengerSelection(forType));
  }, [forType]);

  const staffQuery = useStaffList(debouncedKeyword, tab === "employee");
  const externalQuery = useExternalPassengerList(debouncedKeyword, tab === "external");

  const staffList = useMemo(
    () => staffQuery.data?.pages.flatMap((p) => p.Staffs ?? []) ?? [],
    [staffQuery.data],
  );

  const externalList = useMemo(
    () => externalQuery.data?.pages.flatMap((p) => p.Passengers ?? []) ?? [],
    [externalQuery.data],
  );

  function handleToggle(info: PassengerBookInfo, checked: boolean) {
    const result = toggleSelection(draft, info, checked, forType);
    setDraft(result.items);
    setError(result.error ?? "");
  }

  function handleRemove(item: PassengerBookInfo) {
    handleToggle(item, false);
  }

  function handleConfirm() {
    if (draft.length === 0) {
      setError("请至少选择一位出行人");
      return;
    }
    setSelected(draft);
    navigate(returnTo, { replace: true });
  }

  function handleBack() {
    navigate(returnTo, { replace: true });
  }

  function openExternalAdd() {
    navigate(
      buildCredentialPagePath({
        mode: "external",
        returnTo: selectReturnTo,
        forType,
        addNew: true,
      }),
    );
  }

  function openExternalEdit(passenger: MemberPassenger) {
    navigate(
      buildCredentialPagePath({
        mode: "external",
        returnTo: selectReturnTo,
        forType,
        passenger,
      }),
      { state: credentialNavigationState({ mode: "external", returnTo: selectReturnTo, forType, passenger }) },
    );
  }

  function handleExternalRemove(passenger: MemberPassenger) {
    setExternalDeleteTarget(passenger);
  }

  function pruneDraftAfterDelete(
    target: { passengerId?: string; credential?: PassengerCredential },
  ) {
    setDraft((prev) => {
      const next = removeDeletedFromSelection(prev, target);
      if (next.length !== prev.length) {
        savePassengerSelection(forType, next);
      }
      return next;
    });
  }

  async function confirmExternalRemove() {
    if (!externalDeleteTarget) return;
    const target = externalDeleteTarget;
    try {
      await removeExternal.mutateAsync(target.Id);
      pruneDraftAfterDelete({ passengerId: target.Id });
      setExternalDeleteTarget(null);
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  function openStaffAdd(staffId: string) {
    navigate(
      buildCredentialPagePath({
        mode: "staff",
        returnTo: selectReturnTo,
        forType,
        addNew: true,
        staffId,
      }),
    );
  }

  function openStaffEdit(staffId: string, credential: PassengerCredential) {
    navigate(
      buildCredentialPagePath({
        mode: "staff",
        returnTo: selectReturnTo,
        forType,
        staffId,
        credential,
      }),
      {
        state: credentialNavigationState({
          mode: "staff",
          returnTo: selectReturnTo,
          forType,
          staffId,
          credential,
        }),
      },
    );
  }

  async function handleStaffCredentialRemove(staffId: string, credential: PassengerCredential) {
    if (!window.confirm("确定删除该证件？")) return;
    try {
      await removeStaffCredential.mutateAsync(credentialFormFromCredential(credential, staffId));
      pruneDraftAfterDelete({ credential });
    } catch (err) {
      setError(formatApiError(err));
    }
  }

  const isLoading =
    tab === "employee" ? staffQuery.isLoading : externalQuery.isLoading;
  const listError = tab === "employee" ? staffQuery.error : externalQuery.error;
  const hasMore =
    tab === "employee" ? staffQuery.hasNextPage : externalQuery.hasNextPage;
  const fetchMore =
    tab === "employee" ? staffQuery.fetchNextPage : externalQuery.fetchNextPage;
  const isFetchingMore =
    tab === "employee" ? staffQuery.isFetchingNextPage : externalQuery.isFetchingNextPage;

  return (
    <>
      <PickerShell
        title="选择出行人"
        searchPlaceholder="请输入姓名、手机号"
        keyword={keyword}
        onKeywordChange={setKeyword}
        onBack={handleBack}
        onSearchClick={() => inputRef.current?.focus()}
        inputRef={inputRef}
        tabs={
          allowExternal ? (
            <PassengerSegmentTabs active={tab} onChange={setTab} />
          ) : null
        }
        footer={
          <PassengerPickerFooter
            selectedCount={draft.length}
            onShowSelected={() => setSelectedSheetOpen(true)}
            onConfirm={handleConfirm}
            confirmDisabled={draft.length === 0}
          />
        }
      >
        <div className="pb-4 pt-1">
          {error ? (
            <p className="mx-4 mb-2 text-sm text-[#ff4d4f]" role="alert">
              {error}
            </p>
          ) : null}

          {tab === "external" && allowExternal ? (
            <PassengerAddExternalButton onClick={openExternalAdd} />
          ) : null}

          {isLoading ? (
            <p className="py-10 text-center text-sm text-[#999999]">加载中…</p>
          ) : null}

          {listError ? (
            <p className="mx-4 py-4 text-sm text-[#ff4d4f]">{formatApiError(listError)}</p>
          ) : null}

          {tab === "employee" ? (
            <>
              {staffList.map((staff) => (
                <EmployeePassengerCard
                  key={staff.Id}
                  staff={staff}
                  forType={forType}
                  selected={draft}
                  onToggle={handleToggle}
                  onAddCredential={openStaffAdd}
                  onEditCredential={openStaffEdit}
                  onRemoveCredential={handleStaffCredentialRemove}
                />
              ))}
              {!isLoading && staffList.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#999999]">暂无员工数据</p>
              ) : null}
            </>
          ) : (
            <>
              {externalList.map((p) => (
                <ExternalPassengerCard
                  key={p.Id}
                  passenger={p}
                  forType={forType}
                  selected={draft}
                  onToggle={handleToggle}
                  onEdit={openExternalEdit}
                  onRemove={handleExternalRemove}
                />
              ))}
              {!isLoading && externalList.length === 0 ? (
                <p className="py-10 text-center text-sm text-[#999999]">暂无常旅客</p>
              ) : null}
            </>
          )}

          {hasMore ? (
            <div className="mx-4 mt-2">
              <button
                type="button"
                disabled={isFetchingMore}
                className="flex h-10 w-full items-center justify-center rounded-full border border-[#eeeeee] bg-white text-sm text-[#666666] active:bg-[#f5f5f5] disabled:opacity-50"
                onClick={() => void fetchMore()}
              >
                {isFetchingMore ? "加载中…" : "加载更多"}
              </button>
            </div>
          ) : null}
        </div>
      </PickerShell>

      <SelectedPassengersSheet
        open={selectedSheetOpen}
        items={draft}
        onClose={() => setSelectedSheetOpen(false)}
        onRemove={handleRemove}
      />

      <ConfirmDialog
        open={externalDeleteTarget != null}
        title="删除出行人"
        message={
          externalDeleteTarget
            ? `确定删除非公司员工「${externalDeleteTarget.Name}」？删除后将无法恢复。`
            : ""
        }
        confirmLabel="删除"
        loading={removeExternal.isPending}
        onConfirm={() => void confirmExternalRemove()}
        onCancel={() => setExternalDeleteTarget(null)}
      />
    </>
  );
}
