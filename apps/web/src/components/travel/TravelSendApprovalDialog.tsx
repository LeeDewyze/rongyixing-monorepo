import { useCallback, useEffect, useState } from "react";

import { ResourcePicker, type PickerOption } from "@/components/search";
import { sendTravelApplyForApprovalByTicket } from "@/lib/travel-apply";
import {
  fetchTravelLaunchView,
  notifierDisplayName,
  resolveTravelLaunchDiagram,
  searchTravelLaunchStaffOptions,
  type TravelLaunchNotifier,
  type TravelLaunchView,
} from "@/lib/travel-launch";
import { getTicket } from "@/lib/session";

interface TravelSendApprovalDialogProps {
  open: boolean;
  formId: string | null;
  onClose: () => void;
}

type LaunchTab = "diagram" | "records";

const EMPTY_VIEW: TravelLaunchView = {
  records: [],
  nodes: [],
  diagramImageUrls: [],
  notifyTypes: [],
};

function launchNodeStatusStyle(status: string) {
  const label = status.trim() || "待处理";
  if (/通过|完成|同意/.test(label)) {
    return { label, className: "bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" };
  }
  if (/拒|驳|失败/.test(label)) {
    return { label, className: "bg-red-50 text-red-600", dot: "bg-red-500" };
  }
  if (/撤|取消/.test(label)) {
    return { label, className: "bg-gray-100 text-gray-600", dot: "bg-gray-400" };
  }
  return { label, className: "bg-blue-50 text-brand-primary", dot: "bg-brand-primary" };
}

function LaunchDiagram({ view }: { view: TravelLaunchView }) {
  const diagram = resolveTravelLaunchDiagram(view);
  if (diagram.images.length > 0) {
    return (
      <div className="space-y-2">
        {diagram.images.map((src) => (
          <img key={src} src={src} alt="审批图" className="max-w-full" />
        ))}
      </div>
    );
  }
  if (diagram.steps.length === 0) {
    return <p className="py-6 text-center text-sm text-[#808080]">暂无审批图</p>;
  }
  return (
    <ol className="m-0 list-none p-0">
      {diagram.steps.map((step, index) => {
        const status = launchNodeStatusStyle(step.status);
        const people = step.people.length > 0 ? step.people : ["未指定"];
        return (
          <li key={`${people.join("-")}-${index}`} className="flex gap-3">
            <div className="flex w-6 shrink-0 flex-col items-center">
              <div className="flex size-6 items-center justify-center rounded-full bg-brand-primary text-[11px] font-medium text-white">
                {index + 1}
              </div>
              {index < diagram.steps.length - 1 ? (
                <span className="my-1 min-h-4 w-px flex-1 bg-[#E8EBF0]" />
              ) : null}
            </div>
            <div
              className={`min-w-0 flex-1 rounded-lg border border-[#E8EBF0] bg-[#FAFBFC] px-3 py-2.5 ${
                index < diagram.steps.length - 1 ? "mb-3" : ""
              }`}
            >
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {people.map((person) => (
                  <span key={person} className="truncate text-[14px] font-medium text-[#333333]">
                    {person}
                  </span>
                ))}
              </div>
              <span
                className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] ${status.className}`}
              >
                <span className={`size-1.5 rounded-full ${status.dot}`} />
                {status.label}
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/** Native 报审 dialog — same content as legacy FormTask/Launch (信息). */
export function TravelSendApprovalDialog({ open, formId, onClose }: TravelSendApprovalDialogProps) {
  const [tab, setTab] = useState<LaunchTab>("records");
  const [view, setView] = useState<TravelLaunchView>(EMPTY_VIEW);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notifiers, setNotifiers] = useState<TravelLaunchNotifier[]>([]);
  const [notifyType, setNotifyType] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [staffOptions, setStaffOptions] = useState<PickerOption[]>([]);

  useEffect(() => {
    if (!open || !formId) {
      setView(EMPTY_VIEW);
      setError(null);
      setTab("records");
      setNotifiers([]);
      setNotifyType("");
      setPickerOpen(false);
      setStaffOptions([]);
      return;
    }

    let cancelled = false;
    const ticket = getTicket();
    if (!ticket) {
      setError("登录已过期，请重新登录");
      return;
    }

    setLoading(true);
    setError(null);
    void fetchTravelLaunchView(ticket, formId)
      .then((next) => {
        if (!cancelled) setView(next);
      })
      .catch((cause: unknown) => {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "加载报审信息失败");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [formId, open]);

  useEffect(() => {
    if (notifyType || view.notifyTypes.length === 0) return;
    const everyStep = view.notifyTypes.find((item) => /每一步/.test(item.label));
    setNotifyType(everyStep?.value ?? view.notifyTypes[0]?.value ?? "");
  }, [notifyType, view.notifyTypes]);

  const searchNotifiers = useCallback(
    async (keyword: string) => {
      const ticket = getTicket();
      if (!ticket) return [];
      const selected = new Set(notifiers.map((item) => item.id));
      const options = await searchTravelLaunchStaffOptions(ticket, keyword);
      return options.filter((option) => !selected.has(option.id));
    },
    [notifiers],
  );

  useEffect(() => {
    if (!pickerOpen) return;
    let cancelled = false;
    void searchNotifiers("").then((options) => {
      if (!cancelled) setStaffOptions(options);
    });
    return () => {
      cancelled = true;
    };
  }, [pickerOpen, searchNotifiers]);

  if (!open || !formId) return null;
  const currentFormId = formId;

  async function handleConfirm() {
    if (submitting) return;
    const ticket = getTicket();
    if (!ticket) {
      setError("登录已过期，请重新登录");
      return;
    }
    if (notifiers.length > 0 && view.notifyTypes.length > 0 && !notifyType) {
      setError("请选择抄送类别");
      return;
    }
    setSubmitting(true);
    try {
      const result = await sendTravelApplyForApprovalByTicket(ticket, currentFormId, {
        notifyType,
        notifiers,
      });
      if (!result.Status) {
        setError(result.Message ?? "报审失败");
        return;
      }
      onClose();
    } catch {
      setError("报审失败，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-5"
        role="presentation"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="信息"
          className="flex max-h-[min(36rem,80vh)] w-full max-w-[22rem] flex-col overflow-hidden rounded-lg bg-white shadow-[0_12px_40px_rgba(0,0,0,0.18)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="relative border-b border-[#F0F2F5] px-4 py-3">
            <h2 className="text-center text-[17px] font-medium text-[#333333]">信息</h2>
            <button
              type="button"
              className="absolute right-3 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center text-[#999999]"
              aria-label="关闭"
              onClick={onClose}
            >
              <svg
                viewBox="0 0 20 20"
                className="size-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M6 6l8 8M14 6l-8 8" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="flex border-b border-[#F0F2F5] px-4">
            {(
              [
                ["diagram", "审批图"],
                ["records", "审批记录"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={`mr-5 h-10 text-[14px] ${
                  tab === id
                    ? "border-b-2 border-brand-primary font-medium text-brand-primary"
                    : "text-[#666666]"
                }`}
                onClick={() => setTab(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {loading ? <p className="py-6 text-center text-sm text-[#808080]">正在加载…</p> : null}
            {error ? <p className="pb-3 text-sm text-[#DC2626]">{error}</p> : null}

            {!loading && tab === "records" ? (
              view.records.length > 0 ? (
                <table className="w-full border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="text-[#808080]">
                      <th className="border-b border-[#F0F2F5] py-2 font-normal">审批人</th>
                      <th className="border-b border-[#F0F2F5] py-2 font-normal">状态</th>
                      <th className="border-b border-[#F0F2F5] py-2 font-normal">备注</th>
                    </tr>
                  </thead>
                  <tbody>
                    {view.records.map((row, index) => (
                      <tr
                        key={`${row.approver}-${index}`}
                        className={index % 2 === 0 ? "bg-[#F7F8FA]" : ""}
                      >
                        <td className="py-2.5 text-[#333333]">{row.approver}</td>
                        <td className="py-2.5 text-[#333333]">{row.status}</td>
                        <td className="py-2.5 text-[#333333]">{row.remark}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="py-6 text-center text-sm text-[#808080]">暂无审批记录</p>
              )
            ) : null}

            {!loading && tab === "diagram" ? <LaunchDiagram view={view} /> : null}

            <div className="mt-4">
              <div className="mb-2 text-[13px] text-[#333333]">抄送人</div>
              <div className="flex flex-wrap items-center gap-2">
                {notifiers.map((person) => (
                  <span
                    key={person.id}
                    className="inline-flex items-center gap-1 rounded-full bg-[#F0F4FF] px-2.5 py-1 text-[13px] text-[#333333]"
                  >
                    {person.name}
                    <button
                      type="button"
                      className="text-[#999999]"
                      aria-label={`移除${person.name}`}
                      onClick={() =>
                        setNotifiers((prev) => prev.filter((item) => item.id !== person.id))
                      }
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  type="button"
                  className="flex size-8 items-center justify-center rounded-full border border-brand-primary text-[18px] leading-none text-brand-primary"
                  aria-label="添加抄送人"
                  onClick={() => setPickerOpen(true)}
                >
                  +
                </button>
              </div>
              {view.notifyTypes.length > 0 && notifiers.length > 0 ? (
                <label className="mt-3 block">
                  <span className="mb-1 block text-[13px] text-[#333333]">抄送类别</span>
                  <select
                    value={notifyType}
                    className="h-9 w-full rounded-md border border-[#E8EBF0] px-2 text-[13px] text-[#333333]"
                    onChange={(event) => setNotifyType(event.target.value)}
                  >
                    <option value="">请选择</option>
                    {view.notifyTypes.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
            </div>
          </div>

          <div className="flex gap-3 border-t border-[#F0F2F5] px-4 py-3">
            <button
              type="button"
              className="flex h-9 flex-1 items-center justify-center rounded-full border border-brand-primary text-[14px] text-brand-primary"
              onClick={onClose}
            >
              关闭
            </button>
            <button
              type="button"
              disabled={submitting}
              className="flex h-9 flex-1 items-center justify-center rounded-full bg-brand-primary text-[14px] text-white disabled:opacity-50"
              onClick={() => void handleConfirm()}
            >
              {submitting ? "报审中…" : "确定"}
            </button>
          </div>
        </div>
      </div>
      <ResourcePicker
        className="z-[90]"
        open={pickerOpen}
        options={staffOptions}
        title="选择抄送人"
        placeholder="搜索姓名或工号"
        showAllOptions
        variant="staff"
        onSearch={searchNotifiers}
        onClose={() => setPickerOpen(false)}
        onSelect={(option) => {
          setNotifiers((prev) =>
            prev.some((item) => item.id === option.id)
              ? prev
              : [...prev, { id: option.id, name: notifierDisplayName(option.label) }],
          );
          setPickerOpen(false);
        }}
      />
    </>
  );
}
