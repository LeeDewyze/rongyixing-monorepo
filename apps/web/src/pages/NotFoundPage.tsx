import { Link } from "react-router-dom";

import { WEB_MAIN_PADDING_CLASS } from "@/components/WebShell";

export function NotFoundPage() {
  return (
    <div className={WEB_MAIN_PADDING_CLASS}>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-brand-title">页面不存在</h1>
        <p className="mt-2 text-sm text-[#666666]">请检查链接或返回首页。</p>
        <Link
          to="/"
          className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-brand-primary px-6 text-sm font-medium text-white"
        >
          返回首页
        </Link>
      </div>
    </div>
  );
}
