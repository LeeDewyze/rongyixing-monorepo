function HotelTripIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-[#2768FA]" aria-hidden>
      <path
        d="M6 5h12v14H6V5Zm2 2v3h3V7H8Zm0 5v3h3v-3H8Zm5-5v3h3V7h-3Zm0 5v3h3v-3h-3Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function HomeRecentTripPanel() {
  return (
    <section className="mx-3 mt-4 mb-4">
      <h2 className="mb-2 text-[16px] font-medium text-[#010101]">近期出行</h2>
      <div
        className="overflow-hidden rounded-lg p-[1px]"
        style={{
          background:
            "linear-gradient(-61deg, rgba(51, 161, 249, 0) 0%, rgba(39, 104, 250, 0.2) 87%)",
        }}
      >
        <div className="flex gap-3 rounded-[7px] bg-white p-4">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E8F1FF]">
            <HotelTripIcon />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-[#010101]">
              北京中关村生命科学亚朵酒店
            </p>
            <p className="mt-1.5 text-[14px] text-[#666666]">2022-04-08 · 1晚 · 2022-04-09</p>
            <p className="mt-1 text-[14px] text-[#666666]">
              大床房 <span className="mx-1">·</span> 有早餐
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
