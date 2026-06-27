import { useNavigate } from "react-router-dom";

import { HOME_ASSETS } from "@/config/home-assets";

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

/** Figma 10:326 — outer gradient shell @ 20% opacity, 351×107, radius 8px. */
const BUSINESS_PANEL_GRADIENT =
  "linear-gradient(98.64deg, rgba(39, 104, 250, 0.2) 12.63%, rgba(51, 161, 249, 0.2) 82.81%)";

export function HomeBusinessPanel() {
  const navigate = useNavigate();

  return (
    <section className="mx-3 mt-4">
      <div
        className="overflow-hidden rounded-lg px-3 pb-3 pt-3"
        style={{ background: BUSINESS_PANEL_GRADIENT }}
      >
        <h2 className="mb-3 text-[16px] font-medium leading-[22px]" style={{ color: "var(--brand-title)" }}>
          出差申请
        </h2>
        <div className="grid grid-cols-4 rounded-lg bg-white px-2 py-4">
          {SHORTCUTS.map((item) => (
            <button
              key={item.id}
              type="button"
              className="flex flex-col items-center gap-1.5 border-none bg-transparent p-0"
              aria-label={item.label}
              onClick={() => navigate(item.to)}
            >
              <img src={item.icon} alt="" className="size-6 object-contain" aria-hidden />
              <span className="text-center text-[14px] font-normal leading-none tracking-normal text-[#666666] [font-family:'HarmonyOS_Sans_SC','HarmonyOS_Sans','PingFang_SC',sans-serif]">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
