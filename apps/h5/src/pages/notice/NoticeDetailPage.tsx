import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { BulletinNoticeDetailBody } from "@ryx/ui/components/notice/bulletin-notice-detail-body";

import { usePageHeader } from "@/components/layout";
import { getApi } from "@/lib/api";
import { coreJump } from "@/lib/core-jump";
import { formatApiError } from "@/lib/formatApiError";
import { normalizeBannerImageUrl } from "@/lib/home-banners";

export function NoticeDetailPage() {
  const navigate = useNavigate();
  const { noticeId = "" } = useParams();

  usePageHeader({ visible: false });

  const query = useQuery({
    queryKey: ["notice", "detail", noticeId],
    queryFn: () => getApi().notice.getDetail({ NoticeId: noticeId }),
    enabled: noticeId !== "",
  });

  const notice = query.data ?? null;
  const headerTitle = notice?.Title?.trim() || "通知详情";
  const imageUrl = notice?.FullFileName?.trim()
    ? normalizeBannerImageUrl(notice.FullFileName.trim())
    : undefined;

  return (
    <div
      className="flex min-h-full flex-col"
      style={{ background: "var(--brand-form-header-gradient)" }}
    >
      <div className="shrink-0 pt-[env(safe-area-inset-top)]">
        <div className="flex items-center px-1 pb-2 pt-1">
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70"
            aria-label="返回"
            onClick={() => navigate(-1)}
          >
            <svg
              viewBox="0 0 20 20"
              className="size-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 5l-5 5 5 5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="min-w-0 flex-1 truncate px-2 text-center text-[17px] font-medium text-brand-title">
            {headerTitle}
          </h1>
          <span className="flex size-10 shrink-0 items-center justify-center" aria-hidden />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
        {query.isLoading ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center text-sm text-[#999999] shadow-sm">
            加载中…
          </div>
        ) : null}

        {query.error ? (
          <div className="rounded-2xl bg-white px-4 py-10 text-center shadow-sm">
            <p className="text-sm text-destructive">{formatApiError(query.error)}</p>
          </div>
        ) : null}

        {notice ? (
          <article className="rounded-2xl bg-white px-4 py-4 shadow-sm">
            <BulletinNoticeDetailBody
              fullFileName={imageUrl}
              description={notice.Description}
              detailHtml={notice.Detail}
              url={notice.Url}
              onOpenLink={() => {
                if (notice.Url?.trim()) {
                  void coreJump(navigate, notice.Url.trim(), {});
                }
              }}
            />
          </article>
        ) : null}
      </div>
    </div>
  );
}
