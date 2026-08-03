import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { HOTEL_DETAIL_FONT } from "@/components/hotel/hotel-detail-chrome";
import { usePageHeader } from "@/components/layout";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { useLoginDevices, useRemoveLoginDevice } from "@/hooks/useLoginDevices";
import { formatApiError } from "@/lib/formatApiError";
import { getDeviceId } from "@/lib/request-context";

function DeviceIcon() {
  return (
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#F0F6FF] text-brand-primary">
      <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
        <rect x="7" y="2.5" width="10" height="19" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 5.5h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function PageToast({ message }: { message: string }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6">
      <p className="rounded-xl bg-[#333333]/90 px-4 py-2.5 text-[13px] text-white shadow-lg">
        {message}
      </p>
    </div>
  );
}

export function LoginDevicesPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });

  const devicesQuery = useLoginDevices();
  const removeDevice = useRemoveLoginDevice();

  const [manageMode, setManageMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const currentDeviceId = getDeviceId();
  const devices = devicesQuery.data ?? [];

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  }

  function exitManageMode() {
    setManageMode(false);
    setSelectedId(null);
  }

  async function handleDelete() {
    if (!selectedId) {
      showToast("请选择要删除的设备");
      return;
    }
    try {
      await removeDevice.mutateAsync(selectedId);
      showToast("已删除");
      exitManageMode();
    } catch (err) {
      showToast(formatApiError(err));
    }
  }

  async function handleHeaderAction() {
    if (!manageMode) {
      setManageMode(true);
      return;
    }
    await handleDelete();
  }

  const headerAction = (
    <button
      type="button"
      className="cursor-pointer whitespace-nowrap text-[14px] font-medium text-brand-title transition-opacity duration-200 active:opacity-70 disabled:opacity-40"
      disabled={manageMode && removeDevice.isPending}
      onClick={() => void handleHeaderAction()}
    >
      {manageMode ? (removeDevice.isPending ? "删除中…" : "删除") : "管理"}
    </button>
  );

  return (
    <SettingsPageChrome title="登录设备" backTo="/settings/security" rightAction={headerAction}>
      <div className={`flex min-h-full flex-col ${HOTEL_DETAIL_FONT}`}>
        <div className="flex min-h-full flex-1 flex-col rounded-t-2xl bg-white pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 shadow-[0_-4px_24px_rgba(0,0,0,0.06)]">
          <div className="mx-4 rounded-xl border border-[#D6E8FF] bg-[#F5F9FF] px-4 py-3.5 text-[13px] leading-relaxed text-[#5C6678]">
            系统提示：您的账号近期在以下设备登录过，如非本人操作，请尽快
            <button
              type="button"
              className="cursor-pointer font-medium text-brand-primary transition-opacity duration-200 active:opacity-70"
              onClick={() => navigate("/settings/password")}
            >
              修改密码
            </button>
          </div>

          <div className="mt-4 px-3">
            {devicesQuery.isLoading ? (
              <div className="space-y-3 px-1">
                {[0, 1, 2].map((key) => (
                  <div
                    key={key}
                    className="h-[68px] animate-pulse rounded-xl bg-[#F3F5F8]"
                    aria-hidden
                  />
                ))}
              </div>
            ) : devicesQuery.isError ? (
              <p className="px-4 py-8 text-center text-[14px] text-[#8A94A6]">
                {formatApiError(devicesQuery.error)}
              </p>
            ) : devices.length === 0 ? (
              <p className="px-4 py-12 text-center text-[14px] text-[#8A94A6]">暂无登录设备记录</p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#EEF0F4] bg-white shadow-[0_2px_12px_rgba(15,23,42,0.04)]">
                <ul role="list">
                  {devices.map((device, index) => {
                    const isCurrent = device.Id === currentDeviceId;
                    const selected = selectedId === device.Id;
                    return (
                      <li
                        key={device.Id}
                        className={index < devices.length - 1 ? "border-b border-[#EEF0F4]" : ""}
                      >
                        <button
                          type="button"
                          className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3.5 text-left transition-colors duration-200 active:bg-[#FAFBFC] ${
                            manageMode && selected ? "bg-[#F8FAFD]" : ""
                          }`}
                          onClick={() => {
                            if (!manageMode) return;
                            setSelectedId(device.Id);
                          }}
                        >
                          <DeviceIcon />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[16px] text-[#1A1A1A]">{device.Name}</p>
                            {isCurrent ? (
                              <p className="mt-0.5 text-[12px] text-brand-primary">本机</p>
                            ) : null}
                          </div>
                          {manageMode ? (
                            <span
                              className={`flex size-5 shrink-0 items-center justify-center rounded-full border transition-colors duration-200 ${
                                selected
                                  ? "border-brand-primary bg-brand-primary"
                                  : "border-[#D0D5DD] bg-white"
                              }`}
                              aria-hidden
                            >
                              {selected ? <span className="size-2 rounded-full bg-white" /> : null}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>

      {toast ? <PageToast message={toast} /> : null}
    </SettingsPageChrome>
  );
}
