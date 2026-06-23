import { useState, type ReactNode } from "react";
import type { FlightAuthorizedContact } from "@ryx/shared-types";

import {
  FlightBookExpandableSummaryCard,
  FlightBookSectionAddButton,
} from "@/components/flight/FlightBookExpandableSummaryCard";
import {
  formatFlightNotifyLanguage,
  isValidFlightNotifyLanguage,
  type FlightNotifyLanguage,
} from "@/lib/flight-book-notify";

interface FlightBookAuthorizedContactsProps {
  contacts: FlightAuthorizedContact[];
  onAdd: () => void;
  onRemove: (accountId: string) => void;
  onUpdate: (
    accountId: string,
    patch: Partial<Pick<FlightAuthorizedContact, "name" | "mobile" | "email" | "notifyLanguage">>,
  ) => void;
  onOpenNotifyLanguage: (accountId: string) => void;
}

function ContactFieldRow({
  label,
  children,
  action,
}: {
  label: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-[2.5rem] items-center gap-2 border-b border-[#f0f0f0] py-2 last:border-b-0">
      <span className="w-[5.5rem] shrink-0 whitespace-nowrap text-[14px] leading-none text-[#666666]">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const contactFieldValueClass =
  "w-full min-w-0 bg-transparent text-right text-[14px] leading-tight text-[#333333] outline-none placeholder:text-[#cccccc]";

function buildContactSubtitle(contact: FlightAuthorizedContact): string {
  if (contact.mobile?.trim()) {
    return `手机号：${contact.mobile.trim()}`;
  }
  if (contact.email?.trim()) {
    return `邮箱：${contact.email.trim()}`;
  }
  return "请完善联系信息";
}

export function FlightBookAuthorizedContacts({
  contacts,
  onAdd,
  onRemove,
  onUpdate,
  onOpenNotifyLanguage,
}: FlightBookAuthorizedContactsProps) {
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

  function toggleExpanded(accountId: string) {
    setExpandedMap((current) => ({ ...current, [accountId]: !current[accountId] }));
  }

  function handleRemove(accountId: string) {
    if (!window.confirm("确定删除该授权账号？")) return;
    onRemove(accountId);
    setExpandedMap((current) => {
      const next = { ...current };
      delete next[accountId];
      return next;
    });
  }

  return (
    <section className="rounded-xl bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      <h2 className="text-[16px] font-semibold text-[#222222]">授权账号查看订单</h2>

      {contacts.length > 0 ? (
        <div className="mt-3 space-y-3">
          {contacts.map((contact) => (
            <FlightBookExpandableSummaryCard
              key={contact.accountId}
              name={contact.name}
              subtitle={buildContactSubtitle(contact)}
              expanded={Boolean(expandedMap[contact.accountId])}
              onToggleExpanded={() => toggleExpanded(contact.accountId)}
            >
              <ContactFieldRow
                label="旅客名称"
                action={
                  <button
                    type="button"
                    className="flex size-8 items-center justify-center text-[#ff4d4f] active:opacity-70"
                    aria-label="删除授权账号"
                    onClick={() => handleRemove(contact.accountId)}
                  >
                    <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M5 6h10M8 6V4h4v2M7 6v9h6V6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                }
              >
                <input
                  type="text"
                  value={contact.name}
                  placeholder="请输入"
                  onChange={(event) => onUpdate(contact.accountId, { name: event.target.value })}
                  className={contactFieldValueClass}
                />
              </ContactFieldRow>

              <ContactFieldRow label="手机号">
                <input
                  type="tel"
                  value={contact.mobile ?? ""}
                  placeholder="请输入"
                  onChange={(event) => onUpdate(contact.accountId, { mobile: event.target.value })}
                  className={contactFieldValueClass}
                />
              </ContactFieldRow>

              <ContactFieldRow label="邮箱">
                <input
                  type="email"
                  value={contact.email ?? ""}
                  placeholder="请输入"
                  onChange={(event) => onUpdate(contact.accountId, { email: event.target.value })}
                  className={contactFieldValueClass}
                />
              </ContactFieldRow>

              <ContactFieldRow label="通知语言">
                <button
                  type="button"
                  className="flex w-full min-w-0 items-center justify-end gap-1 text-[14px] leading-tight text-[#333333]"
                  onClick={() => onOpenNotifyLanguage(contact.accountId)}
                >
                  {formatFlightNotifyLanguage(
                    (isValidFlightNotifyLanguage(contact.notifyLanguage ?? "cn")
                      ? contact.notifyLanguage
                      : "cn") as FlightNotifyLanguage,
                  )}
                  <span className="shrink-0 text-[16px] text-[#bbbbbb]" aria-hidden>
                    ›
                  </span>
                </button>
              </ContactFieldRow>
            </FlightBookExpandableSummaryCard>
          ))}
        </div>
      ) : null}

      <FlightBookSectionAddButton label="授权账号查看订单" onClick={onAdd} />
    </section>
  );
}
