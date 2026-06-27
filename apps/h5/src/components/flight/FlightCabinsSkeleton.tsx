/** Loading placeholder for cabins list — mirrors hotel detail skeleton rhythm. */
export function FlightCabinsSkeleton() {
  return (
    <div className="mx-3 mt-2 space-y-2 pb-3">
      <div className="h-10 animate-pulse rounded-lg bg-white/80" />
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="flex gap-3 rounded-xl bg-white p-3 ring-1 ring-[#ECEEF2] shadow-[0_1px_4px_rgba(0,0,0,0.03)]"
        >
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-6 w-24 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-4 w-full animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[#E5E7EB]" />
            <div className="h-3 w-2/5 animate-pulse rounded bg-[#E5E7EB]" />
          </div>
          <div className="h-9 w-[4.5rem] shrink-0 animate-pulse rounded-full bg-[#E5E7EB]" />
        </div>
      ))}
    </div>
  );
}
