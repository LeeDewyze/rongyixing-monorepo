import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getApi } from "@/lib/api";
import { usePageHeader } from "@/components/layout";

function RefreshIcon({ spinning = false }: { spinning?: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`size-5 ${spinning ? "animate-spin" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path
        d="M17 10a7 7 0 01-7 7 7 7 0 01-5.16-2.26M3 10a7 7 0 017-7 7 7 0 015.16 2.26"
        strokeLinecap="round"
      />
      <path d="M16 2v3h-3M4 18v-3h3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function NoticeListPage() {
  const navigate = useNavigate();
  usePageHeader({ visible: false });
  const {
    data: notices = [],
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["notice", "list"],
    queryFn: () => getApi().notice.getList({ PageIndex: 0, PageSize: 20 }),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

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
          <h1 className="min-w-0 flex-1 text-center text-[17px] font-medium text-brand-title">
            通知公告
          </h1>
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center text-brand-title active:opacity-70 disabled:opacity-50"
            aria-label={isFetching ? "正在刷新" : "刷新"}
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            <RefreshIcon spinning={isFetching} />
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 pt-3">
        <div className="space-y-3">
          {isLoading ? (
            <div className="rounded-2xl bg-white px-4 py-5 shadow-sm">
              <div className="flex gap-3.5">
                <div className="mt-0.5 size-8 shrink-0 animate-pulse rounded-full bg-[#EEF2F7]" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="h-4 w-11/12 rounded bg-[#EEF2F7]" />
                  <div className="h-3 w-2/5 rounded bg-[#EEF2F7]" />
                  <div className="h-4 w-4/5 rounded bg-[#EEF2F7]" />
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl bg-white px-4 py-8 text-center shadow-sm">
              <p className="text-sm text-destructive">{String(error)}</p>
            </div>
          ) : null}

          {notices.map((notice) => (
            <button
              key={String(notice.Id)}
              type="button"
              className="group w-full rounded-2xl border border-black/5 bg-white px-4 py-4 text-left shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-transform duration-150 active:scale-[0.99] active:opacity-95"
              onClick={() => navigate(`/notice/${encodeURIComponent(String(notice.Id))}`)}
            >
              <div className="flex items-start gap-3.5">
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-[#EEF5FF] text-[12px] font-medium text-brand-primary">
                  公
                </span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-[16px] font-semibold leading-6 tracking-tight text-brand-title">
                    {notice.Title}
                  </p>
                  <p className="mt-2 text-[12px] leading-none text-[#999999]">
                    {notice.InsertTime?.replace("T", " ")}
                  </p>
                </div>
                <svg
                  viewBox="0 0 16 16"
                  className="mt-1.5 size-4 shrink-0 text-[#C0C4CC]"
                  aria-hidden
                >
                  <path
                    d="M6 4.5L9.5 8L6 11.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </button>
          ))}

          {!isLoading && notices.length === 0 ? (
            <div className="rounded-2xl bg-white px-4 py-8 text-center shadow-sm">
              <div className="mx-auto flex w-fit flex-col items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-full bg-[#EEF5FF] text-brand-primary">
                  <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
                    <path
                      d="M12 5v7l4 2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-medium text-brand-title">暂无通知</p>
                  <p className="mt-1 text-[12px] leading-none text-[#999999]">稍后再来看看</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
