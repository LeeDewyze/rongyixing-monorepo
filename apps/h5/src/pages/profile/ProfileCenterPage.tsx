import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { resolveUrl } from "@ryx/api";
import { computeSign, serializeData } from "@ryx/api";

import { usePageHeader } from "@/components/layout";
import { SettingsMenuCard, SettingsMenuRow } from "@/components/settings/SettingsMenuCard";
import { SettingsPageChrome } from "@/components/settings/SettingsPageChrome";
import { PROFILE_ASSETS } from "@/config/profile-assets";
import { ProfileAvatarCropSheet } from "@/components/profile/ProfileAvatarCropSheet";
import { bumpAvatarCacheBuster, withAvatarCacheBuster } from "@/lib/avatar";
import { getApi } from "@/lib/api";
import { getApiBaseUrl, getApiMode } from "@/lib/env";
import { getTicket } from "@/lib/session";
import { useProfileCenter } from "@/hooks/useProfileCenter";
import { formatApiError } from "@/lib/formatApiError";

function display(value?: string | number | null): string {
  if (value === 0) return "0";
  return value ? String(value) : "-";
}

function ProfileSkeleton() {
  return (
    <div className="space-y-3 px-3 pt-3">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="size-16 animate-pulse rounded-full bg-[#EEF0F4]" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-28 animate-pulse rounded bg-[#EEF0F4]" />
            <div className="mt-3 h-3 w-40 animate-pulse rounded bg-[#EEF0F4]" />
          </div>
        </div>
      </div>
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="h-4 w-full animate-pulse rounded bg-[#EEF0F4]" />
        <div className="mt-4 h-4 w-2/3 animate-pulse rounded bg-[#EEF0F4]" />
        <div className="mt-4 h-4 w-4/5 animate-pulse rounded bg-[#EEF0F4]" />
      </div>
    </div>
  );
}

const AVATAR_UPLOAD_METHOD = "ApiMemberUrl-Home-UploadHeadImage";

function getTimestamp(): number {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60_000;
  const cnMs = utcMs + 8 * 3_600_000;
  return Math.floor(cnMs / 1000);
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

function isUploadSuccess(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "boolean") return value;
  if (typeof value === "object") {
    const status = (value as { Status?: unknown }).Status;
    if (typeof status === "boolean") return status;
  }
  return true;
}

function getUploadErrorMessage(value: unknown): string {
  if (typeof value === "object" && value !== null) {
    const message = (value as { Message?: unknown }).Message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return "头像上传失败";
}

function getUploadHeadUrl(value: unknown): string | null {
  if (typeof value === "object" && value !== null) {
    const data = (value as { Data?: unknown }).Data;
    if (typeof data === "object" && data !== null) {
      const headUrl = (data as { HeadUrl?: unknown }).HeadUrl;
      if (typeof headUrl === "string" && headUrl.trim()) {
        return headUrl;
      }
    }
  }
  return null;
}

function AvatarActionSheet({
  open,
  onClose,
  onPick,
  uploading,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (source: "camera" | "album") => void;
  uploading: boolean;
}) {
  if (!open) return null;

  const itemClass =
    "flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-medium text-brand-title active:bg-[#F5F7FA] disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-[70] flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭" onClick={onClose} />
      <div className="rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(15,23,42,0.16)]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E8ECF2]" />
        <div className="space-y-2">
          <button
            type="button"
            className={itemClass}
            disabled={uploading}
            onClick={() => onPick("camera")}
          >
            拍照
          </button>
          <button
            type="button"
            className={itemClass}
            disabled={uploading}
            onClick={() => onPick("album")}
          >
            从相册选择
          </button>
        </div>
        <button
          type="button"
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-[#F5F6F9] text-[15px] font-medium text-[#5E6A7D] active:bg-[#EBEDF3] disabled:opacity-50"
          disabled={uploading}
          onClick={onClose}
        >
          取消
        </button>
      </div>
    </div>
  );
}

interface PendingAvatarSource {
  file: File;
  previewUrl: string;
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="size-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      aria-hidden
    >
      <path d="M10 12V4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 7.5L10 4l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4 13.5v1A1.5 1.5 0 0 0 5.5 16.5h9A1.5 1.5 0 0 0 16 15v-1" strokeLinecap="round" />
    </svg>
  );
}

export function ProfileCenterPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  usePageHeader({ visible: false });

  const profileQuery = useProfileCenter();
  const profile = profileQuery.data;
  const avatar = withAvatarCacheBuster(profile?.HeadUrl || PROFILE_ASSETS.defaultAvatar);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarSheetOpen, setAvatarSheetOpen] = useState(false);
  const [avatarCropOpen, setAvatarCropOpen] = useState(false);
  const [avatarSource, setAvatarSource] = useState<PendingAvatarSource | null>(null);
  const [avatarError, setAvatarError] = useState("");
  const [avatarUrlOverride, setAvatarUrlOverride] = useState<string | null>(null);

  const displayAvatar = withAvatarCacheBuster(avatarUrlOverride || profile?.HeadUrl || PROFILE_ASSETS.defaultAvatar);

  useEffect(() => {
    return () => {
      if (avatarSource?.previewUrl) {
        URL.revokeObjectURL(avatarSource.previewUrl);
      }
    };
  }, [avatarSource?.previewUrl]);

  const openAvatarPicker = (source: "camera" | "album") => {
    const input = fileInputRef.current;
    if (!input) return;
    input.value = "";
    input.accept = "image/*";
    if (source === "camera") {
      input.setAttribute("capture", "camera");
    } else {
      input.removeAttribute("capture");
    }
    setAvatarSheetOpen(false);
    input.click();
  };

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const api = getApi();
      if (getApiMode() !== "mock" && !api.proxy.getApiConfig()?.Token) {
        await api.proxy.loadApiConfig();
      }
      const apiConfig = api.proxy.getApiConfig();
      if (!apiConfig?.Token) {
        throw new Error("未获取到上传配置");
      }
      const uploadUrl = resolveUrl({
        baseUrl: getApiBaseUrl(),
        method: AVATAR_UPLOAD_METHOD,
        apiConfig,
      });
      console.info("[avatar-upload] start", {
        url: uploadUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });
      const fileValue = await blobToBase64(file);
      const timestamp = getTimestamp();
      const data = serializeData({ FileName: file.name });
      const sign = computeSign(data, timestamp, apiConfig.Token);
      const body = new URLSearchParams({
        Timestamp: String(timestamp),
        Language: "cn",
        Ticket: getTicket() ?? "",
        TicketName: "",
        Domain: apiConfig.Domain ?? "rtesp.com",
        Method: AVATAR_UPLOAD_METHOD,
        Data: data,
        FileValue: fileValue,
        Token: apiConfig.Token,
        Sign: sign,
        "x-requested-with": "XMLHttpRequest",
      });
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      console.info("[avatar-upload] response", {
        ok: response.ok,
        status: response.status,
      });
      if (!response.ok) {
        throw new Error(`Upload failed: HTTP ${response.status}`);
      }
      const responseText = await response.text();
      console.info("[avatar-upload] response-body", responseText);
      let result: unknown = null;
      try {
        result = responseText ? JSON.parse(responseText) : null;
      } catch {
        result = responseText;
      }
      console.info(
        "[avatar-upload] result",
        typeof result === "string" ? result : JSON.stringify(result),
      );
      if (!isUploadSuccess(result)) {
        throw new Error(getUploadErrorMessage(result));
      }
      return result;
    },
    onError: (error) => {
      console.error("[avatar-upload] error", error);
    },
    onSuccess: async (result) => {
      const nextHeadUrl = getUploadHeadUrl(result);
      if (nextHeadUrl) {
        setAvatarUrlOverride(nextHeadUrl);
      }
      bumpAvatarCacheBuster();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["member", "profile"] }),
        queryClient.invalidateQueries({ queryKey: ["member", "profile-center"] }),
      ]);
      await profileQuery.refetch();
      setAvatarError("");
      if (avatarSource?.previewUrl) {
        URL.revokeObjectURL(avatarSource.previewUrl);
      }
      setAvatarSource(null);
      setAvatarCropOpen(false);
      setAvatarSheetOpen(false);
    },
  });

  function handleAvatarClick() {
    if (uploadAvatar.isPending) return;
    setAvatarError("");
    setAvatarSheetOpen(true);
  }

  function handleAvatarPick(source: "camera" | "album") {
    setAvatarSheetOpen(false);
    setAvatarError("");
    openAvatarPicker(source);
  }

  function clearPendingAvatarSource() {
    setAvatarCropOpen(false);
    setAvatarSheetOpen(false);
    setAvatarError("");
    if (avatarSource?.previewUrl) {
      URL.revokeObjectURL(avatarSource.previewUrl);
    }
    setAvatarSource(null);
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      setAvatarSheetOpen(false);
      return;
    }
    try {
      if (avatarSource?.previewUrl) {
        URL.revokeObjectURL(avatarSource.previewUrl);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarSource({ file, previewUrl });
      setAvatarCropOpen(true);
      setAvatarError("");
    } catch (error) {
      setAvatarError(formatApiError(error));
      setAvatarSheetOpen(false);
    }
  }

  return (
    <SettingsPageChrome title="个人中心">
      <div className="min-h-full overflow-y-auto pb-6 pt-2">
        {profileQuery.isLoading ? <ProfileSkeleton /> : null}

        {profileQuery.error ? (
          <div className="mx-3 rounded-2xl bg-white px-4 py-5 text-sm text-[#FF4D4F] shadow-sm">
            {formatApiError(profileQuery.error)}
          </div>
        ) : null}

        {profile ? (
          <>
            <section className="mx-3 mb-3 rounded-2xl bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,0.06)] ring-1 ring-black/[0.03]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="relative size-16 shrink-0 overflow-hidden rounded-full border border-white bg-[#EEF0F4] shadow-sm transition active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/30"
                  aria-label="更换头像"
                  onClick={handleAvatarClick}
                >
                  <img src={displayAvatar} alt="头像" className="size-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 flex h-6 items-center justify-center bg-black/28 text-white">
                    <UploadIcon />
                  </span>
                </button>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[18px] font-semibold text-brand-title">
                    {display(profile.RealName || profile.Name)}
                  </h2>
                  <p className="mt-1 truncate text-sm text-[#7A8494]">
                    账号：{display(profile.Name)}
                  </p>
                  {profile.OrganizationName || profile.OrganizationCode ? (
                    <p className="mt-2 inline-flex max-w-full items-center gap-1 rounded-full bg-[#EEF5FF] px-2.5 py-1 text-xs font-medium text-brand-primary">
                      <span className="truncate">
                        {profile.OrganizationName || profile.OrganizationCode}
                      </span>
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-[#EEF5FF] px-3 text-xs font-medium text-brand-primary transition active:bg-[#E3EEFF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/25 disabled:opacity-50"
                    disabled={uploadAvatar.isPending}
                    onClick={handleAvatarClick}
                  >
                    {uploadAvatar.isPending ? "上传中…" : "更换头像"}
                  </button>
                </div>
              </div>
            </section>

            {avatarError ? (
              <div className="mx-3 mb-3 rounded-2xl bg-white px-4 py-3 text-sm text-[#FF4D4F] shadow-sm">
                {avatarError}
              </div>
            ) : null}

            <SettingsMenuCard>
              <SettingsMenuRow label="姓名" value={display(profile.RealName)} showChevron={false} />
              <SettingsMenuRow label="账号" value={display(profile.Name)} showChevron={false} />
              <SettingsMenuRow label="联系方式" value={display(profile.Mobile)} showChevron={false} />
            </SettingsMenuCard>

            <div className="h-3" />

            <SettingsMenuCard>
              <SettingsMenuRow
                label="部门"
                value={display(profile.OrganizationName)}
                showChevron={false}
              />
              <SettingsMenuRow
                label="组织编码"
                value={display(profile.OrganizationCode)}
                showChevron={false}
              />
              <SettingsMenuRow
                label="成本中心"
                value={display(profile.CostCenterName)}
                showChevron={false}
              />
              <SettingsMenuRow
                label="编码"
                value={display(profile.CostCenterCode)}
                showChevron={false}
              />
            </SettingsMenuCard>

            <div className="h-3" />

            <SettingsMenuCard>
              <SettingsMenuRow
                label="证件信息"
                description="查看和维护本人的常用证件"
                value="去管理"
                valueTone="primary"
                onClick={() => navigate("/credentials?returnTo=/profile/center")}
              />
            </SettingsMenuCard>
          </>
        ) : null}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => void handleAvatarChange(event)}
        />
        <AvatarActionSheet
          open={avatarSheetOpen}
          uploading={uploadAvatar.isPending}
          onClose={() => {
            if (uploadAvatar.isPending) return;
            setAvatarSheetOpen(false);
          }}
          onPick={handleAvatarPick}
        />
        <ProfileAvatarCropSheet
          open={avatarCropOpen}
          source={avatarSource}
          uploading={uploadAvatar.isPending}
          onClose={clearPendingAvatarSource}
          onConfirm={async (file) => {
            await uploadAvatar.mutateAsync(file);
          }}
        />
      </div>
    </SettingsPageChrome>
  );
}
