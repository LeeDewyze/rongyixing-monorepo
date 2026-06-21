import { Link } from "react-router-dom";

import { HomeServiceEntries } from "@/components/home/HomeServiceEntries";

export function HomeTabPage() {
  return (
    <div className="flex min-h-full flex-col px-4 pt-4">
      <h1 className="text-lg font-semibold text-[#1F2937]">首页</h1>
      <HomeServiceEntries />

      <Link
        to="/flight/select-city"
        className="mt-4 flex min-h-11 items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm text-[#1F2937] no-underline shadow-sm"
      >
        <span>机票-选择城市</span>
        <span className="text-[#9CA3AF]" aria-hidden>
          ›
        </span>
      </Link>
    </div>
  );
}
