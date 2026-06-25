import { useState, type ReactNode } from "react";
import type { FlightAuthorizedContact } from "@ryx/shared-types";

import credentialSwitchPlusIcon from "@/assets/hotel/credential-switch-plus.png";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FlightBookSectionAddButton } from "@/components/flight/FlightBookExpandableSummaryCard";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
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
  /** Render inside a room section card without its own shadow. */
  embedded?: boolean;
  /** Render under a labeled room subsection (no extra top divider). */
  sectioned?: boolean;
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
    <div className="flex min-h-[2.75rem] items-center gap-2 border-b border-[#f0f0f0] py-2.5 last:border-b-0">
      <span className="w-[5.75rem] shrink-0 whitespace-nowrap text-[14px] leading-none text-[#666666]">
        {label}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

const contactFieldValueClass =
  "w-full min-w-0 bg-transparent text-right text-[14px] leading-tight text-[#333333] outline-none placeholder:text-[#cccccc]";

function DeleteContactButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="flex size-7 items-center justify-center rounded-full bg-[#FFF1F0] text-[#FF4D4F] active:opacity-70"
      aria-label="删除授权账号"
      onClick={onClick}
    >
      <svg
        viewBox="0 0 24 24"
        className="size-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M3 6h18" />
        <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
        <path d="M6 6l.8 13.2A1.5 1.5 0 0 0 8.3 20.7h7.4a1.5 1.5 0 0 0 1.5-1.5L18 6" />
        <path d="M10 10v6" />
        <path d="M14 10v6" />
      </svg>
    </button>
  );
}

function AuthorizedContactCard({
  contact,
  onRemove,
  onUpdate,
  onOpenNotifyLanguage,
  embedded,
  sectioned = false,
}: {
  contact: FlightAuthorizedContact;
  onRemove: () => void;
  onUpdate: (
    patch: Partial<Pick<FlightAuthorizedContact, "name" | "mobile" | "email" | "notifyLanguage">>,
  ) => void;
  onOpenNotifyLanguage: () => void;
  embedded: boolean;
  sectioned?: boolean;
}) {
  const notifyLanguage = (
    isValidFlightNotifyLanguage(contact.notifyLanguage ?? "cn") ? contact.notifyLanguage : "cn"
  ) as FlightNotifyLanguage;

  return (
    <div
      className={
        sectioned
          ? "overflow-hidden rounded-xl bg-white px-3 ring-1 ring-[#EEF1F6]"
          : embedded
            ? "overflow-hidden rounded-lg border border-[#F0F2F5] bg-white px-3"
            : "overflow-hidden rounded-lg bg-[#f6f8fc] px-3"
      }
    >
      <ContactFieldRow label="旅客名称：" action={<DeleteContactButton onClick={onRemove} />}>
        <input
          type="text"
          value={contact.name}
          placeholder="请输入"
          onChange={(event) => onUpdate({ name: event.target.value })}
          className={contactFieldValueClass}
        />
      </ContactFieldRow>

      <ContactFieldRow label="手机号：">
        <input
          type="tel"
          value={contact.mobile ?? ""}
          placeholder="请输入"
          onChange={(event) => onUpdate({ mobile: event.target.value })}
          className={contactFieldValueClass}
        />
      </ContactFieldRow>

      <ContactFieldRow label="邮箱：">
        <input
          type="email"
          value={contact.email ?? ""}
          placeholder="请输入"
          onChange={(event) => onUpdate({ email: event.target.value })}
          className={contactFieldValueClass}
        />
      </ContactFieldRow>

      <ContactFieldRow label="通知语言：">
        <button
          type="button"
          className="flex w-full min-w-0 items-center justify-end gap-1 text-[14px] leading-tight text-[#333333] active:opacity-70"
          onClick={onOpenNotifyLanguage}
        >
          {formatFlightNotifyLanguage(notifyLanguage)}
          <span className="shrink-0 text-[16px] text-[#bbbbbb]" aria-hidden>
            ›
          </span>
        </button>
      </ContactFieldRow>
    </div>
  );
}

export function FlightBookAuthorizedContacts({
  contacts,
  onAdd,
  onRemove,
  onUpdate,
  onOpenNotifyLanguage,
  embedded = false,
  sectioned = false,
}: FlightBookAuthorizedContactsProps) {
  const [deleteTarget, setDeleteTarget] = useState<FlightAuthorizedContact | null>(null);

  function confirmRemove() {
    if (!deleteTarget) return;
    onRemove(deleteTarget.accountId);
    setDeleteTarget(null);
  }

  const deleteDialog = (
    <ConfirmDialog
      open={deleteTarget !== null}
      title="删除授权账号"
      message={
        deleteTarget?.name?.trim()
          ? `确定删除授权账号「${deleteTarget.name.trim()}」？删除后需重新添加。`
          : "确定删除该授权账号？删除后需重新添加。"
      }
      confirmLabel="删除"
      onConfirm={confirmRemove}
      onCancel={() => setDeleteTarget(null)}
    />
  );

  if (contacts.length === 0) {
    return (
      <section
        className={
          sectioned
            ? HOTEL_DETAIL_FONT
            : embedded
              ? `border-t border-[#F0F2F5] ${HOTEL_DETAIL_FONT}`
              : `h-[42px] rounded-lg bg-white ${HOTEL_DETAIL_FONT}`
        }
      >
        <button
          type="button"
          className={
            sectioned
              ? "flex h-[42px] w-full items-center justify-center gap-1.5 rounded-xl bg-white text-[12px] font-normal leading-none text-[#2768FA] ring-1 ring-[#EEF1F6] active:opacity-70"
              : "flex h-[42px] w-full items-center justify-center gap-1.5 text-[12px] font-normal leading-none text-[#2768FA] active:opacity-70"
          }
          onClick={onAdd}
        >
          <img src={credentialSwitchPlusIcon} alt="" className="size-4" aria-hidden />
          授权账号查看订单
        </button>
      </section>
    );
  }

  return (
    <>
      <section
        className={
          sectioned
            ? HOTEL_DETAIL_FONT
            : embedded
              ? `border-t border-[#F0F2F5] pt-3 ${HOTEL_DETAIL_FONT}`
              : `rounded-lg bg-white px-3 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]`
        }
      >
        {contacts.length > 0 ? (
          <div className="space-y-3">
            {contacts.map((contact) => (
              <AuthorizedContactCard
                key={contact.accountId}
                contact={contact}
                embedded={embedded}
                sectioned={sectioned}
                onRemove={() => setDeleteTarget(contact)}
                onUpdate={(patch) => onUpdate(contact.accountId, patch)}
                onOpenNotifyLanguage={() => onOpenNotifyLanguage(contact.accountId)}
              />
            ))}
          </div>
        ) : null}

        <FlightBookSectionAddButton label="授权账号查看订单" onClick={onAdd} />
      </section>
      {deleteDialog}
    </>
  );
}
