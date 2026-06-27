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

const APPROVAL_TABS: ApprovalTab[] = ["mine", "pending", "done"];

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
  usePageHeader({ visible: false });

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
              className="inline-flex h-8 items-center rounded-full border border-brand-primary bg-white px-3 text-xs font-medium text-brand-primary transition-colors hover:bg-blue-50 active:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
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
              className="inline-flex h-8 items-center rounded-full border border-red-500 bg-white px-3 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 active:bg-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
  const waitingTaskCount = waitingCount.data ?? 0;

  function handleTabChange(value: ApprovalTab) {
    setSearchParams({ tab: value }, { replace: true });
  }

  return (
    <div className="min-h-full bg-[#F5F6F9]" style={{ background: "var(--brand-form-header-gradient)" }}>
      <div className="sticky top-0 z-20 pb-7 pt-[env(safe-area-inset-top)]">
        <div className="flex h-11 items-center px-1">
          <button
            type="button"
            className="flex h-11 w-10 shrink-0 items-center justify-center rounded-full text-[26px] font-light leading-none text-brand-title transition-opacity hover:opacity-80 active:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            aria-label="返回"
            onClick={goHome}
          >
            ‹
          </button>
          <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-medium text-brand-title">
            审批任务
          </h1>
          <span className="w-10 shrink-0" aria-hidden />
        </div>

        <div className="px-4 pt-2">
          <div className="grid grid-cols-3 rounded-2xl bg-white/85 p-1 shadow-sm ring-1 ring-white/70 backdrop-blur">
            {APPROVAL_TABS.map((value) => {
              const active = tab === value;
              const hasPendingCount = value === "pending" && waitingTaskCount > 0;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  className={`relative flex h-10 items-center justify-center rounded-xl text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 ${
                    active
                      ? "bg-brand-primary text-white shadow-sm"
                      : "text-gray-600 hover:bg-blue-50 hover:text-brand-primary active:bg-blue-100"
                  }`}
                  onClick={() => handleTabChange(value)}
                >
                  {TAB_LABELS[value]}
                  {hasPendingCount ? (
                    <span
                      className={`ml-1 min-w-4 rounded-full px-1 text-[10px] leading-4 ${
                        active ? "bg-white text-brand-primary" : "bg-red-500 text-white"
                      }`}
                    >
                      {waitingTaskCount}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
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
        className="-mt-4 px-4 pb-6"
      />
    </div>
  );
}
