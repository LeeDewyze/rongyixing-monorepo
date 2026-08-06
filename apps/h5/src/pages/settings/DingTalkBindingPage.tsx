import { useEffect, useState } from "react";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { PageToast } from "@/components/layout/PageToast";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import {
  dingTalkErrorMessage,
  useBindDingTalk,
  useDingTalkAvailability,
  useDingTalkBindings,
  useRemoveDingTalk,
} from "@/hooks/useDingTalk";
import { consumeDingTalkCode, isDingTalkContainer, requestDingTalkCode } from "@/lib/dingtalk";

function DingTalkMark() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#EAF5FF] text-[#1677FF]">
      <svg viewBox="0 0 20 20" className="size-5" fill="none" aria-hidden>
        <path
          d="M5 7.2c0-1.8 1.6-3.2 3.5-3.2h3c1.9 0 3.5 1.4 3.5 3.2v4.1c0 1.8-1.6 3.2-3.5 3.2h-3C6.6 14.5 5 13.1 5 11.3V7.2Z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path
          d="M7.5 8.4h5M7.5 11.2h3.2"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

export function DingTalkBindingPage() {
  usePageHeader({ visible: false });
  const availability = useDingTalkAvailability("bind");
  const dingTalkSupported = isDingTalkContainer();
  const bindings = useDingTalkBindings(dingTalkSupported);
  const bind = useBindDingTalk();
  const remove = useRemoveDingTalk();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: "success" | "error" } | null>(null);

  function showToast(message: string, tone: "success" | "error" = "error") {
    setToast({ message, tone });
    window.setTimeout(() => setToast(null), 2500);
  }

  useEffect(() => {
    if (!dingTalkSupported) return;
    const code = consumeDingTalkCode();
    if (!code) return;
    void bind
      .mutateAsync(code)
      .then(() => showToast("钉钉账号绑定成功", "success"))
      .catch((error) => showToast(dingTalkErrorMessage(error)));
  }, [dingTalkSupported]);

  async function handleBind() {
    if (bind.isPending) return;
    try {
      const code = await requestDingTalkCode("bind", "/settings/dingtalk");
      if (code) {
        await bind.mutateAsync(code);
        showToast("钉钉账号绑定成功", "success");
      }
    } catch (error) {
      showToast(dingTalkErrorMessage(error));
    }
  }

  async function handleRemove() {
    if (!confirmId) return;
    try {
      await remove.mutateAsync(confirmId);
      setConfirmId(null);
      showToast("钉钉账号已解绑", "success");
    } catch (error) {
      showToast(dingTalkErrorMessage(error));
    }
  }

  const list = bindings.data ?? [];

  return (
    <SettingsPageChrome title="钉钉绑定" backTo="/settings/security">
      <div className={`flex min-h-full flex-col ${HOTEL_DETAIL_FONT}`}>
        <div className="flex min-h-full flex-1 flex-col rounded-t-2xl bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-4 mt-5 flex items-center gap-3 rounded-2xl border border-[#D6E8FF] bg-[#F5F9FF] px-4 py-4">
            <DingTalkMark />
            <p className="m-0 text-[13px] leading-relaxed text-[#5C6678]">
              绑定后可使用钉钉账号快速登录融易行。
            </p>
          </div>

          <div className="mt-4 px-3">
            {bindings.isLoading ? (
              <div className="space-y-3 px-1">
                {[0, 1].map((key) => (
                  <div key={key} className="h-[68px] animate-pulse rounded-xl bg-[#F3F5F8]" />
                ))}
              </div>
            ) : bindings.isError ? (
              <p className="px-4 py-8 text-center text-[14px] text-[#8A94A6]">
                {dingTalkErrorMessage(bindings.error)}
              </p>
            ) : list.length === 0 ? (
              <p className="px-4 py-12 text-center text-[14px] text-[#8A94A6]">暂未绑定钉钉账号</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#EEF0F4] bg-white">
                {list.map((item, index) => (
                  <div
                    key={item.Id}
                    className={`flex items-center gap-3 px-4 py-3.5 ${
                      index < list.length - 1 ? "border-b border-[#EEF0F4]" : ""
                    }`}
                  >
                    <DingTalkMark />
                    <span className="min-w-0 flex-1 truncate text-[15px] text-[#333333]">
                      {item.Name || "钉钉账号"}
                    </span>
                    <button
                      type="button"
                      className="shrink-0 text-[13px] font-medium text-[#FF4D4F] disabled:opacity-45"
                      disabled={remove.isPending}
                      onClick={() => setConfirmId(item.Id)}
                    >
                      解绑
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="mx-4 mt-5 flex h-12 items-center justify-center rounded-full bg-brand-primary text-[16px] font-medium text-white shadow-[0_8px_20px_rgba(39,104,250,0.24)] disabled:opacity-50"
            disabled={!availability.enabled || bind.isPending}
            onClick={() => void handleBind()}
          >
            {bind.isPending ? "绑定中…" : "绑定钉钉"}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmId !== null}
        title="解绑钉钉账号"
        message="解绑后将无法使用该钉钉账号登录，是否继续？"
        confirmLabel="解绑"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => void handleRemove()}
        onCancel={() => setConfirmId(null)}
      />
      <PageToast message={toast?.message ?? null} tone={toast?.tone} />
    </SettingsPageChrome>
  );
}
