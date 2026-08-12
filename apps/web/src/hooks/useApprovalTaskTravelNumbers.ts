import type { ApprovalTask } from "@ryx/shared-types";
import { useEffect, useMemo, useRef, useState } from "react";

import { fetchTravelNumberByApprovalTask } from "@/lib/travel-form-list";
import { getTicket } from "@/lib/session";

function isTravelTask(task: ApprovalTask): boolean {
  if (task.tag === "Travel" || task.tag === "TravelForm") return true;
  return task.name.includes("出差申请");
}

function resolveKnownNumber(
  task: ApprovalTask,
  knownNumbersByFormId: Map<string, string>,
): string | undefined {
  if (task.consumerId) {
    const byConsumer = knownNumbersByFormId.get(task.consumerId);
    if (byConsumer) return byConsumer;
  }
  if (task.url?.includes("/Form/Detail")) {
    return knownNumbersByFormId.get(task.id);
  }
  return undefined;
}

function isAppendedTaskListKey(previousKey: string, nextKey: string): boolean {
  if (!previousKey || previousKey === nextKey) return false;
  return nextKey.startsWith(`${previousKey},`);
}

export interface ApprovalTaskTravelNumbersResult {
  tasks: ApprovalTask[];
  /** True while the first page of travel numbers is loading (tab switch / refresh). */
  isResolvingTravelNumbers: boolean;
}

/** Fill missing travel numbers on approval cards via workflow embed HTML (same as detail page). */
export function useApprovalTaskTravelNumbers(
  tasks: ApprovalTask[],
  myApplications: ApprovalTask[] | undefined,
  enabled: boolean,
): ApprovalTaskTravelNumbersResult {
  const ticket = getTicket() ?? "";
  const [resolved, setResolved] = useState<Record<string, string>>({});
  const [isResolvingTravelNumbers, setIsResolvingTravelNumbers] = useState(false);

  const knownNumbersByFormId = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of myApplications ?? []) {
      if (app.id && app.number) map.set(app.id, app.number);
    }
    return map;
  }, [myApplications]);

  const taskListKey = useMemo(
    () => tasks.map((task) => `${task.id}:${task.consumerId ?? ""}`).join(","),
    [tasks],
  );

  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const knownNumbersRef = useRef(knownNumbersByFormId);
  knownNumbersRef.current = knownNumbersByFormId;
  const prevTaskListKeyRef = useRef("");

  useEffect(() => {
    if (!enabled || !ticket) {
      setIsResolvingTravelNumbers(false);
      return;
    }

    const previousKey = prevTaskListKeyRef.current;
    const isAppend = isAppendedTaskListKey(previousKey, taskListKey);
    prevTaskListKeyRef.current = taskListKey;

    if (!isAppend && previousKey !== taskListKey) {
      setResolved({});
    }

    const targets = tasksRef.current.filter(
      (task) =>
        isTravelTask(task) &&
        !task.number &&
        !resolveKnownNumber(task, knownNumbersRef.current),
    );

    if (targets.length === 0) {
      setIsResolvingTravelNumbers(false);
      return;
    }

    if (!isAppend) {
      setIsResolvingTravelNumbers(true);
    }

    let active = true;
    void Promise.all(
      targets.map(async (task) => {
        try {
          return [task.id, await fetchTravelNumberByApprovalTask(task)] as const;
        } catch {
          return [task.id, undefined] as const;
        }
      }),
    )
      .then((results) => {
        if (!active) return;
        setResolved((prev) => {
          const next = { ...prev };
          for (const [taskId, number] of results) {
            if (number) next[taskId] = number;
          }
          return next;
        });
      })
      .finally(() => {
        if (active) setIsResolvingTravelNumbers(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, taskListKey, ticket]);

  const enrichedTasks = useMemo(() => {
    return tasks.map((task) => {
      if (task.number || !isTravelTask(task)) return task;
      const number = resolveKnownNumber(task, knownNumbersByFormId) ?? resolved[task.id];
      return number ? { ...task, number } : task;
    });
  }, [knownNumbersByFormId, resolved, tasks]);

  return { tasks: enrichedTasks, isResolvingTravelNumbers };
}
