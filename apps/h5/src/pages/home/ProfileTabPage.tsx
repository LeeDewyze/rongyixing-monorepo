import { Link } from "react-router-dom";

import { clearSession, getTicket } from "@/lib/session";

export function ProfileTabPage() {
  const ticket = getTicket();

  function handleLogout() {
    clearSession();
    window.location.href = "/login/password";
  }

  return (
    <div className="flex min-h-full flex-col px-4 pt-4">
      <h1 className="text-lg font-semibold text-[#1F2937]">我的</h1>
      <p className="mt-2 text-sm text-[#9CA3AF]">个人中心即将上线</p>

      {ticket ? <p className="mt-4 break-all text-xs text-[#9CA3AF]">Ticket: {ticket}</p> : null}

      <div className="mt-6 flex flex-col gap-2">
        <Link
          to="/hotel"
          className="rounded-lg bg-white px-4 py-3 text-sm text-[#1F2937] no-underline shadow-sm"
        >
          酒店预订（开发入口）
        </Link>
        <button
          type="button"
          className="rounded-lg bg-white px-4 py-3 text-left text-sm text-[#EF4444] shadow-sm"
          onClick={handleLogout}
        >
          退出登录
        </button>
      </div>
    </div>
  );
}
