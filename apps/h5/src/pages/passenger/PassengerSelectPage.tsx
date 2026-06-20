import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { PassengerBookInfo } from "@ryx/shared-types";
import { parseProductType, PRODUCT_TYPE_LABEL } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";

import {
  EmployeePassengerCard,
  NonEmployeePassengerRow,
  SelectedPassengersSheet,
} from "@/components/passenger";
import { usePageHeader } from "@/components/layout";
import {
  useAllowExternalPassengers,
  useExternalPassengerList,
  usePassengerSelection,
  useStaffList,
} from "@/hooks/usePassenger";
import { formatApiError } from "@/lib/formatApiError";
import { toggleSelection } from "@/lib/passenger-select-logic";
import { loadPassengerSelection } from "@/lib/passenger-selection";

type TabKey = "employee" | "external";

export function PassengerSelectPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const forType = parseProductType(searchParams.get("forType"));
  const returnTo = searchParams.get("returnTo") ?? "/home";

  const { setSelected } = usePassengerSelection(forType);
  const { data: allowExternal } = useAllowExternalPassengers();

  const [tab, setTab] = useState<TabKey>("employee");
  const [employeeKeyword, setEmployeeKeyword] = useState("");
  const [externalKeyword, setExternalKeyword] = useState("");
  const [draft, setDraft] = useState<PassengerBookInfo[]>(() =>
    loadPassengerSelection(forType),
  );
  const [error, setError] = useState("");
  const [selectedSheetOpen, setSelectedSheetOpen] = useState(false);

  const staffQuery = useStaffList(employeeKeyword, tab === "employee");
  const externalQuery = useExternalPassengerList(externalKeyword, tab === "external");

  useEffect(() => {
    setDraft(loadPassengerSelection(forType));
  }, [forType]);

  const staffList = useMemo(
    () => staffQuery.data?.pages.flatMap((p) => p.Staffs) ?? [],
    [staffQuery.data],
  );

  const externalList = useMemo(
    () => externalQuery.data?.pages.flatMap((p) => p.Passengers) ?? [],
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

  const productLabel = PRODUCT_TYPE_LABEL[forType] ?? "出行";
  const isLoading =
    tab === "employee" ? staffQuery.isLoading : externalQuery.isLoading;
  const listError = tab === "employee" ? staffQuery.error : externalQuery.error;
  const hasMore =
    tab === "employee" ? staffQuery.hasNextPage : externalQuery.hasNextPage;
  const fetchMore =
    tab === "employee" ? staffQuery.fetchNextPage : externalQuery.fetchNextPage;

  usePageHeader({
    title: "选择出行人",
    subtitle: productLabel,
    showBack: true,
    onBack: handleBack,
  });

  return (
    <div className="flex min-h-full flex-col pb-24">
      {allowExternal ? (
        <div className="flex border-b px-4">
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm ${
              tab === "employee"
                ? "border-b-2 border-primary font-medium text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setTab("employee")}
          >
            公司员工
          </button>
          <button
            type="button"
            className={`flex-1 py-2.5 text-sm ${
              tab === "external"
                ? "border-b-2 border-primary font-medium text-primary"
                : "text-muted-foreground"
            }`}
            onClick={() => setTab("external")}
          >
            非公司员工
          </button>
        </div>
      ) : null}

      <div className="flex-1 space-y-3 px-4 py-3">
        <input
          className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          placeholder="请输入姓名、手机号"
          value={tab === "employee" ? employeeKeyword : externalKeyword}
          onChange={(e) =>
            tab === "employee"
              ? setEmployeeKeyword(e.target.value)
              : setExternalKeyword(e.target.value)
          }
        />

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {isLoading ? (
          <p className="text-sm text-muted-foreground">加载中…</p>
        ) : null}

        {listError ? (
          <p className="text-sm text-destructive">{formatApiError(listError)}</p>
        ) : null}

        {tab === "employee" ? (
          <div className="space-y-3">
            {staffList.map((staff) => (
              <EmployeePassengerCard
                key={staff.Id}
                staff={staff}
                forType={forType}
                selected={draft}
                onToggle={handleToggle}
              />
            ))}
            {!isLoading && staffList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无员工数据</p>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">
            {externalList.map((p) => (
              <NonEmployeePassengerRow
                key={p.Id}
                passenger={p}
                forType={forType}
                selected={draft}
                onToggle={handleToggle}
              />
            ))}
            {!isLoading && externalList.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">暂无常旅客</p>
            ) : null}
          </div>
        )}

        {hasMore ? (
          <Button
            variant="outline"
            className="w-full"
            disabled={staffQuery.isFetchingNextPage || externalQuery.isFetchingNextPage}
            onClick={() => fetchMore()}
          >
            加载更多
          </Button>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto flex max-w-lg gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setSelectedSheetOpen(true)}
          >
            已选择{draft.length}人
          </Button>
          <Button className="flex-1" disabled={draft.length === 0} onClick={handleConfirm}>
            确认
          </Button>
        </div>
      </div>

      <SelectedPassengersSheet
        open={selectedSheetOpen}
        items={draft}
        onClose={() => setSelectedSheetOpen(false)}
        onRemove={handleRemove}
      />
    </div>
  );
}
