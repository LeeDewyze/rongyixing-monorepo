import type { ApprovalTask } from "@ryx/shared-types";
import { useEffect, useMemo, useState } from "react";

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

/** Fill missing travel numbers on approval cards via workflow embed HTML (same as detail page). */
export function useApprovalTaskTravelNumbers(
  tasks: ApprovalTask[],
  myApplications: ApprovalTask[] | undefined,
  enabled: boolean,
): ApprovalTask[] {
  const ticket = getTicket() ?? "";
  const [resolved, setResolved] = useState<Record<string, string | null>>({});

  const knownNumbersByFormId = useMemo(() => {
    const map = new Map<string, string>();
    for (const app of myApplications ?? []) {
      if (app.id && app.number) map.set(app.id, app.number);
    }
    return map;
  }, [myApplications]);

  const pendingTasks = useMemo(() => {
    if (!enabled || !ticket) return [];
    return tasks.filter((task) => {
      if (!isTravelTask(task) || task.number) return false;
      if (resolved[task.id] !== undefined) return false;
      return !resolveKnownNumber(task, knownNumbersByFormId);
    });
  }, [enabled, knownNumbersByFormId, resolved, tasks, ticket]);

  const pendingTaskKey = pendingTasks.map((task) => task.id).join(",");

  useEffect(() => {
    if (!ticket || pendingTasks.length === 0) return;

    let cancelled = false;
    void Promise.all(
      pendingTasks.map(async (task) => {
        const known = resolveKnownNumber(task, knownNumbersByFormId);
        if (known) return [task.id, known] as const;
        const number = await fetchTravelNumberByApprovalTask(task);
        return [task.id, number] as const;
      }),
    ).then((results) => {
      if (cancelled) return;
      setResolved((prev) => {
        const next = { ...prev };
        for (const [taskId, number] of results) {
          next[taskId] = number ?? null;
        }
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [knownNumbersByFormId, pendingTaskKey, ticket]);

  return useMemo(() => {
    return tasks.map((task) => {
      if (task.number || !isTravelTask(task)) return task;
      const number =
        resolveKnownNumber(task, knownNumbersByFormId) ?? resolved[task.id] ?? undefined;
      return number ? { ...task, number } : task;
    });
  }, [knownNumbersByFormId, resolved, tasks]);
}
