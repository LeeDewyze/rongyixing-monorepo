import { useNavigate } from "react-router-dom";

import { HOME_ASSETS } from "@/config/home-assets";
import { WebSectionTitle } from "@/components/home/WebSectionTitle";
import { useWaitingTaskCount } from "@/hooks/useApprovalTasks";

const SHORTCUTS = [
  { id: "apply", label: "出差申请", icon: HOME_ASSETS.business.apply, to: "/travel/apply" },
  {
    id: "my-approval",
    label: "我的申请",
    icon: HOME_ASSETS.business.myApproval,
    to: "/travel/approval?tab=mine",
  },
  {
    id: "pending",
    label: "待我审批",
    icon: HOME_ASSETS.business.pending,
    to: "/travel/approval?tab=pending",
  },
  {
    id: "done",
    label: "已审任务",
    icon: HOME_ASSETS.business.done,
    to: "/travel/approval?tab=done",
  },
] as const;

const BUSINESS_PANEL_GRADIENT =
  "linear-gradient(98.64deg, rgba(39, 104, 250, 0.2) 12.63%, rgba(51, 161, 249, 0.2) 82.81%)";

function MenuChevronRightIcon() {
  return (
    <img
      src={HOME_ASSETS.business.chevronRight}
      alt=""
      className="size-4 shrink-0 object-contain opacity-70"
      aria-hidden
    />
  );
}

export function WebBusinessPanel() {
  const navigate = useNavigate();
  const waitingCount = useWaitingTaskCount();
  const pendingCount = waitingCount.data ?? 0;

  return (
    <section className="mt-5">
      <div
        className="overflow-hidden rounded-2xl px-4 pb-4 pt-4 pc:px-5 pc:pb-5"
        style={{ background: BUSINESS_PANEL_GRADIENT }}
      >
        <WebSectionTitle>出差申请</WebSectionTitle>
        <div className="grid grid-cols-2 gap-3 pad:grid-cols-4 pc:gap-4">
          {SHORTCUTS.map((item) => {
            const showBadge = item.id === "pending" && pendingCount > 0;
            return (
              <button
                key={item.id}
                type="button"
                className="flex min-h-14 items-center gap-3 rounded-xl bg-white px-4 py-3 text-left shadow-sm transition-colors hover:bg-[#FAFBFC] pointer-coarse:min-h-[60px]"
                aria-label={showBadge ? `${item.label} ${pendingCount}` : item.label}
                onClick={() => navigate(item.to)}
              >
                <span className="relative shrink-0">
                  <img src={item.icon} alt="" className="size-8 object-contain" aria-hidden />
                  {showBadge ? (
                    <span className="absolute -right-2 -top-1.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 text-white">
                      {pendingCount}
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1 text-[18px] font-medium leading-none text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
                  {item.label}
                </span>
                <MenuChevronRightIcon />
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
