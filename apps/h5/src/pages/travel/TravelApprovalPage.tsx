import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { ApprovalTask } from "@ryx/shared-types";

import { ApprovalTaskList } from "@/components/travel/ApprovalTaskList";
import { usePageHeader } from "@/components/layout";
import {
  useMyTravelApplications,
  useOrderApprovalTasks,
  useWaitingTaskCount,
} from "@/hooks/useApprovalTasks";
import { useHomeBack } from "@/lib/app-back";
import { buildApprovalTaskOpenUrl } from "@/lib/approval-task-url";
import { buildTravelFormDetailOpenUrl } from "@/lib/travel-form-list";
import { formatApiError } from "@/lib/formatApiError";

type ApprovalTab = "mine" | "pending" | "done";

const TAB_LABELS: Record<ApprovalTab, string> = {
  mine: "我的申请",
  pending: "待我审批",
  done: "已审任务",
};

function resolveTab(value: string | null): ApprovalTab {
  if (value === "mine" || value === "done") return value;
  return "pending";
}

/** Legacy `tmc-approval-task` — one page for 我的审批 / 待我审批 / 已审任务. */
export function TravelApprovalPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = resolveTab(searchParams.get("tab"));

  const myApplications = useMyTravelApplications();
  const pendingTasks = useOrderApprovalTasks(1);
  const doneTasks = useOrderApprovalTasks(2);
  const waitingCount = useWaitingTaskCount();

  const goHome = useHomeBack();
  usePageHeader({ title: "审批任务", showBack: true, onBack: goHome });

  const activeQuery =
    tab === "mine" ? myApplications : tab === "done" ? doneTasks : pendingTasks;

  const tasks = useMemo(() => {
    if (tab === "mine") {
      return myApplications.data ?? [];
    }
    const data = tab === "done" ? doneTasks.data : pendingTasks.data;
    return data?.pages.flat() ?? [];
  }, [doneTasks.data, myApplications.data, pendingTasks.data, tab]);

  const handleOpenTask = useCallback(
    (task: ApprovalTask) => {
      const url =
        tab === "mine" ? buildTravelFormDetailOpenUrl(task.id) : buildApprovalTaskOpenUrl(task);
      if (!url) return;
      navigate("/travel/task", { state: { url, title: task.name, returnTab: tab } });
    },
    [navigate, tab],
  );

  useEffect(() => {
    function refreshOnVisible() {
      if (document.visibilityState === "visible") {
        void queryClient.invalidateQueries({ queryKey: ["approval"] });
      }
    }
    document.addEventListener("visibilitychange", refreshOnVisible);
    return () => document.removeEventListener("visibilitychange", refreshOnVisible);
  }, [queryClient]);

  const isLoading = activeQuery.isLoading;
  const error = activeQuery.error;
  const emptyMessage =
    tab === "mine" ? "暂无申请" : tab === "pending" ? "暂无审批" : "暂无内容";
  const hasMore = tab === "mine" ? false : tab === "done" ? doneTasks.hasNextPage : pendingTasks.hasNextPage;
  const isFetchingMore =
    tab === "mine" ? false : tab === "done" ? doneTasks.isFetchingNextPage : pendingTasks.isFetchingNextPage;
  const loadMore =
    tab === "mine"
      ? undefined
      : () => void (tab === "done" ? doneTasks.fetchNextPage() : pendingTasks.fetchNextPage());

  return (
    <div className="flex min-h-full flex-col bg-[#F5F6F9]">
      <div className="sticky top-0 z-10 flex border-b border-[#ECECEC] bg-white">
        {(["mine", "pending", "done"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`flex-1 py-3 text-sm ${
              tab === value ? "font-medium text-[#2768FA]" : "text-[#666666]"
            }`}
            onClick={() => setSearchParams({ tab: value }, { replace: true })}
          >
            {TAB_LABELS[value]}
            {value === "pending" && waitingCount.data && waitingCount.data > 0 ? (
              <span className="ml-1 rounded-full bg-[#FF4D4F] px-1.5 text-xs text-white">
                {waitingCount.data}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <ApprovalTaskList
        tasks={tasks}
        isLoading={isLoading}
        errorMessage={error ? formatApiError(error) : undefined}
        emptyMessage={emptyMessage}
        hasMore={hasMore}
        isFetchingMore={isFetchingMore}
        onLoadMore={loadMore}
        onOpenTask={handleOpenTask}
      />
    </div>
  );
}
