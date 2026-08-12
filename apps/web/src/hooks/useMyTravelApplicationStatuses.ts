import type { ApprovalTask } from "@ryx/shared-types";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchTravelFormStatusByFormId } from "@/lib/travel-form-list";
import { getTicket } from "@/lib/session";

function shouldEnrichTravelFormStatus(task: ApprovalTask): boolean {
  const status = typeof task.status === "string" ? Number(task.status) : (task.status ?? 0);
  return status === 2 || status === 4;
}

function isAppendedTaskListKey(previousKey: string, nextKey: string): boolean {
  if (!previousKey || previousKey === nextKey) return false;
  return nextKey.startsWith(`${previousKey},`);
}

export interface MyTravelApplicationStatusesResult {
  tasks: ApprovalTask[];
  isResolvingStatuses: boolean;
}

/** Form/List Status can lag — resolve display status from Form/Detail 基础信息. */
export function useMyTravelApplicationStatuses(
  tasks: ApprovalTask[],
  enabled: boolean,
): MyTravelApplicationStatusesResult {
  const ticket = getTicket() ?? "";
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [isResolvingStatuses, setIsResolvingStatuses] = useState(false);

  const taskListKey = useMemo(() => tasks.map((task) => task.id).join(","), [tasks]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const prevTaskListKeyRef = useRef("");

  useEffect(() => {
    if (!enabled || !ticket) {
      setIsResolvingStatuses(false);
      return;
    }

    const previousKey = prevTaskListKeyRef.current;
    const isAppend = isAppendedTaskListKey(previousKey, taskListKey);
    prevTaskListKeyRef.current = taskListKey;

    if (!isAppend && previousKey !== taskListKey) {
      setResolved({});
    }

    const targets = tasksRef.current.filter(shouldEnrichTravelFormStatus);
    if (targets.length === 0) {
      setIsResolvingStatuses(false);
      return;
    }

    if (!isAppend) {
      setIsResolvingStatuses(true);
    }

    let active = true;
    void Promise.all(
      targets.map(async (task) => {
        try {
          return [task.id, await fetchTravelFormStatusByFormId(ticket, task.id)] as const;
        } catch {
          return [task.id, undefined] as const;
        }
      }),
    )
      .then((results) => {
        if (!active) return;
        setResolved((prev) => {
          const next = { ...prev };
          for (const [taskId, statusName] of results) {
            if (statusName) next[taskId] = statusName;
          }
          return next;
        });
      })
      .finally(() => {
        if (active) setIsResolvingStatuses(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, taskListKey, ticket]);

  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      const statusName = resolved[task.id];
      return statusName ? { ...task, statusName } : task;
    });
  }, [resolved, tasks]);

  return { tasks: enrichedTasks, isResolvingStatuses };
}
