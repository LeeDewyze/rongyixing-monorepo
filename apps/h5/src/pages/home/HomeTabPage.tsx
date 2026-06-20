import { HomeServiceEntries } from "@/components/home/HomeServiceEntries";

export function HomeTabPage() {
  return (
    <div className="flex min-h-full flex-col px-4 pt-4">
      <h1 className="text-lg font-semibold text-[#1F2937]">首页</h1>
      <HomeServiceEntries />
    </div>
  );
}
