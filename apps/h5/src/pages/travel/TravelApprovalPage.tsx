import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { buildTravelFormDetailOpenUrl, buildTravelFormEditUrl } from "@/lib/travel-form-list";
import { formatApiError } from "@/lib/formatApiError";
import { getTicket } from "@/lib/session";
import { isTravelFormRevokable, revokeTravelApply } from "@/lib/travel-apply";

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

  const [revokingId, setRevokingId] = useState<string | null>(null);

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

  const handleRevoke = useCallback(
    async (task: ApprovalTask) => {
      if (revokingId === task.id) return;
      setRevokingId(task.id);
      try {
        const ticket = getTicket();
        if (!ticket) return;
        const result = await revokeTravelApply(ticket, task.id);
        if (result.Status) {
          void queryClient.invalidateQueries({ queryKey: ["approval"] });
        } else {
          alert(result.Message ?? "撤回失败");
        }
      } catch {
        alert("撤回失败，请重试");
      } finally {
        setRevokingId(null);
      }
    },
    [queryClient, revokingId],
  );

  const handleEdit = useCallback(
    (task: ApprovalTask) => {
      navigate(buildTravelFormEditUrl(task.id));
    },
    [navigate],
  );

  const renderActions = useCallback(
    (task: ApprovalTask) => {
      if (!task.tag || task.tag !== "Travel") return null;
      const status =
        typeof task.status === "string" ? Number(task.status) : (task.status ?? 0);
      const canRevoke = isTravelFormRevokable(status);
      const canEdit = status === 1 || status === 5;
      return (
        <>
          {canEdit ? (
            <button
              type="button"
              className="rounded-lg border border-brand-primary px-3 py-1 text-xs font-medium text-brand-primary"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(task);
              }}
            >
              编辑
            </button>
          ) : null}
          {canRevoke ? (
            <button
              type="button"
              disabled={revokingId === task.id}
              className="rounded-lg border border-[#EF4444] px-3 py-1 text-xs font-medium text-[#EF4444] disabled:opacity-50"
              onClick={(e) => {
                e.stopPropagation();
                void handleRevoke(task);
              }}
            >
              {revokingId === task.id ? "撤回中…" : "撤回"}
            </button>
          ) : null}
        </>
      );
    },
    [handleEdit, handleRevoke, revokingId],
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
              tab === value ? "font-medium text-brand-primary" : "text-[#666666]"
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
        renderActions={tab === "mine" ? renderActions : undefined}
      />
    </div>
  );
}
