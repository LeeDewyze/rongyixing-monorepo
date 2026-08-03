import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { OrderRepushLinkman, ProductChannel } from "@ryx/shared-types";

import {
  useInspurRepushLinkmans,
  useInspurRepushPassengers,
  useSubmitInspurRepush,
} from "@/hooks/useOrderInspurRepush";
import { formatApiError } from "@/lib/formatApiError";

interface OrderInspurRepushSheetProps {
  open: boolean;
  orderId: string;
  channel?: ProductChannel;
  className?: string;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}

function contactLabel(contact?: OrderRepushLinkman) {
  if (!contact?.LinkmanName) return "请选择指定预订人";
  return contact.LinkmanMobile
    ? `${contact.LinkmanName} ${contact.LinkmanMobile}`
    : contact.LinkmanName;
}

export function OrderInspurRepushSheet({
  open,
  orderId,
  channel,
  className = "",
  onClose,
  onSubmitted,
}: OrderInspurRepushSheetProps) {
  const [selectedPassengerIds, setSelectedPassengerIds] = useState<Set<string>>(() => new Set());
  const [contactsByPassengerId, setContactsByPassengerId] = useState<
    Record<string, OrderRepushLinkman | undefined>
  >({});
  const [formError, setFormError] = useState<string | null>(null);

  const passengersQuery = useInspurRepushPassengers(
    orderId ? { OrderId: orderId, channel } : null,
    open,
  );
  const linkmansQuery = useInspurRepushLinkmans({ channel }, open);
  const submitMutation = useSubmitInspurRepush();
  const resetSubmitMutation = submitMutation.reset;

  useEffect(() => {
    if (!open) {
      setSelectedPassengerIds(new Set());
      setContactsByPassengerId({});
      setFormError(null);
      resetSubmitMutation();
    }
  }, [open, resetSubmitMutation]);

  const passengers = passengersQuery.data ?? [];
  const linkmans = linkmansQuery.data ?? [];
  const selectedPassengers = useMemo(
    () => passengers.filter((passenger) => selectedPassengerIds.has(passenger.Id)),
    [passengers, selectedPassengerIds],
  );

  if (!open) return null;

  function togglePassenger(passengerId: string) {
    setFormError(null);
    setSelectedPassengerIds((current) => {
      const next = new Set(current);
      if (next.has(passengerId)) {
        next.delete(passengerId);
      } else {
        next.add(passengerId);
      }
      return next;
    });
  }

  function updatePassengerContact(passengerId: string, linkmanId: string) {
    const contact = linkmans.find((item) => item.LinkmanId === linkmanId);
    setContactsByPassengerId((current) => ({
      ...current,
      [passengerId]: contact,
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedPassengers.length === 0) {
      setFormError("请先选择需要重推的旅客");
      return;
    }

    try {
      const result = await submitMutation.mutateAsync({
        channel,
        Items: selectedPassengers.map((passenger) => {
          const contact = contactsByPassengerId[passenger.Id];
          return {
            OrderId: orderId,
            PassengerId: passenger.Id,
            LinkmanId: contact?.LinkmanId ?? "",
            LinkmanName: contact?.LinkmanName ?? "",
            LinkmanMobile: contact?.LinkmanMobile ?? "",
          };
        }),
      });
      onSubmitted(result.Message?.trim() || "重推请求已提交");
      onClose();
    } catch (error) {
      setFormError(formatApiError(error));
    }
  }

  const pending = submitMutation.isPending;
  const loading = passengersQuery.isLoading;
  const passengerError = passengersQuery.error ? formatApiError(passengersQuery.error) : null;
  const linkmanError = linkmansQuery.error ? formatApiError(linkmansQuery.error) : null;

  return (
    <div className={`fixed inset-0 z-[70] flex flex-col justify-end bg-black/40 ${className}`}>
      <button
        type="button"
        className="flex-1 cursor-default focus-visible:outline-none"
        aria-label="关闭"
        onClick={pending ? undefined : onClose}
      />
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="flex max-h-[82dvh] flex-col overflow-hidden rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-12px_36px_rgba(15,23,42,0.16)]"
      >
        <div className="flex items-center justify-between border-b border-[#F0F2F5] px-4 py-3">
          <div>
            <h3 className="text-[16px] font-semibold text-brand-title">重推浪潮</h3>
            <p className="mt-0.5 text-[12px] text-[#FF4D4F]">
              先勾选旅客，可选择推送指定人，再点击重推
            </p>
          </div>
          <button
            type="button"
            className="flex size-8 items-center justify-center rounded-full text-[22px] leading-none text-[#999999] transition-colors hover:bg-[#F5F6F9] active:bg-[#EEF1F6] focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-primary disabled:opacity-40"
            aria-label="关闭"
            onClick={onClose}
            disabled={pending}
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          {linkmansQuery.isFetching ? (
            <p className="mb-3 text-[12px] text-[#999999]">正在加载预订人...</p>
          ) : linkmanError ? (
            <p className="mb-3 rounded-lg bg-[#FFF1F0] px-3 py-2 text-[12px] text-[#FF4D4F]">
              {linkmanError}
            </p>
          ) : null}

          {loading ? (
            <div className="space-y-3" aria-label="正在加载旅客">
              {[0, 1, 2].map((item) => (
                <div key={item} className="h-[92px] animate-pulse rounded-xl bg-[#F3F5F9]" />
              ))}
            </div>
          ) : passengerError ? (
            <div className="rounded-xl bg-[#FFF1F0] px-3 py-4 text-center text-[13px] text-[#FF4D4F]">
              {passengerError}
            </div>
          ) : passengers.length === 0 ? (
            <div className="rounded-xl bg-[#F6F8FC] px-3 py-8 text-center">
              <p className="text-[14px] font-medium text-brand-title">暂无可重推旅客</p>
              <p className="mt-1 text-[12px] text-[#888888]">请稍后重试或联系管理员确认订单状态</p>
            </div>
          ) : (
            <div className="space-y-3">
              {passengers.map((passenger) => {
                const selected = selectedPassengerIds.has(passenger.Id);
                const selectedContact = contactsByPassengerId[passenger.Id];
                return (
                  <section
                    key={passenger.Id}
                    className={`rounded-xl border px-3 py-3 transition-colors ${
                      selected ? "border-brand-primary bg-[#EEF4FF]" : "border-[#E8ECF2] bg-white"
                    }`}
                  >
                    <label className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => togglePassenger(passenger.Id)}
                        disabled={pending}
                        className="mt-0.5 size-5 accent-brand-primary disabled:opacity-40"
                      />
                      <span className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="min-w-0 truncate text-[15px] font-medium text-brand-title">
                          {passenger.Name}
                        </span>
                        <span className="shrink-0 truncate text-[12px] text-[#888888]">
                          {passenger.Mobile || "暂无手机号"}
                        </span>
                      </span>
                    </label>

                    <div className="mt-3">
                      <select
                        value={selectedContact?.LinkmanId ?? ""}
                        onChange={(event) =>
                          updatePassengerContact(passenger.Id, event.target.value)
                        }
                        disabled={!selected || pending || linkmans.length === 0}
                        className="h-10 w-full rounded-lg border border-[#E8ECF2] bg-white px-3 text-[13px] text-brand-title outline-none transition-colors active:bg-[#F6F8FC] focus-visible:border-brand-primary focus-visible:ring-2 focus-visible:ring-brand-primary/20 disabled:bg-[#F6F8FC] disabled:text-[#BBBBBB]"
                      >
                        <option value="">{contactLabel()}</option>
                        {linkmans.map((contact) => (
                          <option key={contact.LinkmanId} value={contact.LinkmanId}>
                            {contactLabel(contact)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </section>
                );
              })}
            </div>
          )}

          {formError ? (
            <p className="mt-3 rounded-lg bg-[#FFF1F0] px-3 py-2 text-[12px] leading-relaxed text-[#FF4D4F]">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="border-t border-[#F0F2F5] px-4 pt-3">
          <button
            type="submit"
            disabled={pending || loading || Boolean(passengerError)}
            className="flex h-11 w-full items-center justify-center rounded-full bg-gradient-to-r from-brand-btn-start to-brand-btn-end text-[15px] font-medium text-white transition-opacity hover:opacity-95 active:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary disabled:opacity-50"
          >
            {pending
              ? "提交中..."
              : `确认重推${selectedPassengers.length ? `(${selectedPassengers.length})` : ""}`}
          </button>
        </div>
      </form>
    </div>
  );
}
