export function HomeProductTabsSkeleton() {
  return (
    <div className="mt-4 mb-3 bg-[#F5F6F9] px-3">
      <div className="grid grid-cols-3 gap-1.5">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="flex animate-pulse flex-col items-center gap-1.5 rounded-[16px] py-2.5"
          >
            <div className="size-[50px] rounded-full bg-[#E8EAEF]" />
            <div className="h-3.5 w-14 rounded bg-[#E8EAEF]" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomeSearchPanelLoading() {
  return (
    <div className="relative mx-3 mt-2">
      <div className="rounded-xl bg-white px-4 py-10 shadow-[0_1px_4px_rgba(0,0,0,0.03)] ring-1 ring-[#ECEEF2]">
        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className="size-6 animate-spin rounded-full border-2 border-[#E8EAEF] border-t-brand-primary"
            aria-hidden
          />
          <p className="text-sm text-[#999999]">加载中…</p>
        </div>
      </div>
    </div>
  );
}
