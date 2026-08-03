import type { ReactNode } from "react";
import type { ApprovalTask } from "@ryx/shared-types";

interface ApprovalTaskListProps {
  tasks: ApprovalTask[];
  emptyMessage: string;
  isLoading?: boolean;
  errorMessage?: string;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isFetchingMore?: boolean;
  onOpenTask: (task: ApprovalTask) => void;
  /** Optional actions rendered below each task card's info. */
  renderActions?: (task: ApprovalTask) => ReactNode;
  className?: string;
}

function TaskChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" fill="none" aria-hidden>
      <path
        d="M6 3.5 10.5 8 6 12.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function EmptyStateIcon() {
  return (
    <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-blue-50 text-brand-primary">
      <svg viewBox="0 0 24 24" className="size-6" fill="none" aria-hidden>
        <path
          d="M7 4.75h10A2.25 2.25 0 0 1 19.25 7v10A2.25 2.25 0 0 1 17 19.25H7A2.25 2.25 0 0 1 4.75 17V7A2.25 2.25 0 0 1 7 4.75Z"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <path
          d="M8 9h8M8 12h5M8 15h3"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

function TaskListSkeleton() {
  return (
    <div className="space-y-3 px-4 pt-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="motion-safe:animate-pulse">
            <div className="flex items-start justify-between gap-3">
              <div className="h-5 w-28 rounded-full bg-gray-100" />
              <div className="h-6 w-16 rounded-full bg-blue-50" />
            </div>
            <div className="mt-4 h-4 w-56 rounded-full bg-gray-100" />
            <div className="mt-3 h-3 w-40 rounded-full bg-gray-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function resolveStatusPill(statusName?: string) {
  const label = statusName?.trim() || "待处理";

  if (label.includes("通过") || label.includes("完成")) {
    return {
      label,
      className: "bg-emerald-50 text-emerald-700 ring-emerald-100",
      dotClassName: "bg-emerald-500",
    };
  }

  if (label.includes("拒") || label.includes("驳") || label.includes("失败")) {
    return {
      label,
      className: "bg-red-50 text-red-600 ring-red-100",
      dotClassName: "bg-red-500",
    };
  }

  if (label.includes("撤") || label.includes("取消")) {
    return {
      label,
      className: "bg-gray-100 text-gray-600 ring-gray-200",
      dotClassName: "bg-gray-400",
    };
  }

  return {
    label,
    className: "bg-blue-50 text-brand-primary ring-blue-100",
    dotClassName: "bg-brand-primary",
  };
}

function TaskMetaLine({ label, value }: { label: string; value: string }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-[12px] leading-snug text-gray-500">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="min-w-0 truncate font-medium text-gray-600">{value}</span>
    </p>
  );
}

export function ApprovalTaskList({
  tasks,
  emptyMessage,
  isLoading,
  errorMessage,
  onLoadMore,
  hasMore,
  isFetchingMore,
  onOpenTask,
  renderActions,
  className,
}: ApprovalTaskListProps) {
  if (isLoading && tasks.length === 0) {
    return <TaskListSkeleton />;
  }

  if (errorMessage) {
    return (
      <div className="px-4 pt-3">
        <div className="rounded-2xl bg-red-50 px-4 py-4 text-sm leading-relaxed text-red-600 ring-1 ring-red-100">
          {errorMessage}
        </div>
      </div>
    );
  }

  if (!tasks.length) {
    return (
      <div className="px-4 pt-8">
        <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-sm ring-1 ring-black/5">
          <EmptyStateIcon />
          <p className="mt-4 text-[15px] font-medium text-brand-title">{emptyMessage}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-gray-500">新的审批动态会显示在这里</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className ?? "px-4 pt-3 pb-6"}`}>
      {tasks.map((task) => {
        const status = resolveStatusPill(task.statusName);
        return (
        <article key={task.id} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
          <button
            type="button"
            className="group block w-full p-4 text-left outline-none transition-colors hover:bg-gray-50 active:bg-gray-100 focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2"
            onClick={() => onOpenTask(task)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-[16px] font-semibold leading-snug text-brand-title">
                  {task.name}
                </p>
                {task.number ? <TaskMetaLine label="单号" value={task.number} /> : null}
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium leading-none ring-1 ${status.className}`}
              >
                <span className={`size-1.5 rounded-full ${status.dotClassName}`} aria-hidden />
                {status.label}
              </span>
            </div>

            <div className="mt-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {task.expiredTime ? (
                  <TaskMetaLine label="过期" value={task.expiredTime} />
                ) : (
                  <p className="text-[12px] text-gray-400">点击查看详情</p>
                )}
              </div>
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-400 transition-colors group-hover:bg-blue-50 group-hover:text-brand-primary">
                <TaskChevronIcon />
              </span>
            </div>
          </button>
          {renderActions ? (
            <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50/60 px-4 py-2.5">
              {renderActions(task)}
            </div>
          ) : null}
        </article>
        );
      })}

      {hasMore ? (
        <button
          type="button"
          className="w-full rounded-full border border-brand-primary bg-white py-2.5 text-sm font-medium text-brand-primary shadow-sm transition-colors hover:bg-blue-50 active:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isFetchingMore}
          onClick={onLoadMore}
        >
          {isFetchingMore ? "加载中…" : "加载更多"}
        </button>
      ) : null}
    </div>
  );
}
