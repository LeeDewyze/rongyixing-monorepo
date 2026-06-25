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
}: ApprovalTaskListProps) {
  if (isLoading && tasks.length === 0) {
    return <p className="py-8 text-center text-sm text-[#808080]">加载中…</p>;
  }

  if (errorMessage) {
    return <p className="p-4 text-sm text-[#FF4D4F]">{errorMessage}</p>;
  }

  if (!tasks.length) {
    return <p className="py-12 text-center text-sm text-[#808080]">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-3 p-3">
      {tasks.map((task) => (
        <button
          key={task.id}
          type="button"
          className="block w-full rounded-xl bg-white p-4 text-left shadow-sm"
          onClick={() => onOpenTask(task)}
        >
          <p className="text-base font-medium text-[#010101]">{task.name}</p>
          {task.statusName ? (
            <p className="mt-2 text-sm text-[#2768FA]">{task.statusName}</p>
          ) : null}
          {task.expiredTime ? (
            <p className="mt-1 text-xs text-[#999999]">过期时间：{task.expiredTime}</p>
          ) : null}
          {task.number ? (
            <p className="mt-1 text-xs text-[#999999]">{task.number}</p>
          ) : null}
        </button>
      ))}

      {hasMore ? (
        <button
          type="button"
          className="w-full rounded-full border border-[#2768FA] py-2.5 text-sm text-[#2768FA]"
          disabled={isFetchingMore}
          onClick={onLoadMore}
        >
          {isFetchingMore ? "加载中…" : "加载更多"}
        </button>
      ) : null}
    </div>
  );
}
