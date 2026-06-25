import type { WorkbenchGroup } from "@ryx/shared-types";
import { useMemo } from "react";

import { TravelIframeView } from "@/components/travel/TravelIframeView";
import { usePageHeader } from "@/components/layout";
import { useWorkbenches } from "@/hooks/useWorkbench";
import { useHomeBack } from "@/lib/app-back";
import { getTicket } from "@/lib/session";

interface TravelExternalPageProps {
  title: string;
  resolveUrl: (ticket: string, groups: WorkbenchGroup[] | undefined) => string | undefined;
  loadingHint?: string;
}

/** Legacy `CoreHelper.jump` — embed workflow.rtesp.com with session ticket. */
export function TravelExternalPage({
  title,
  resolveUrl,
  loadingHint = "正在打开…",
}: TravelExternalPageProps) {
  const { data: workbenches, isLoading, error } = useWorkbenches();
  const goHome = useHomeBack();
  usePageHeader({ title, showBack: true, onBack: goHome });

  const ticket = getTicket() ?? "";
  const url = useMemo(
    () => (ticket ? resolveUrl(ticket, workbenches) : undefined),
    [ticket, workbenches, resolveUrl],
  );

  if (!ticket) {
    return <p className="p-4 text-sm text-[#FF4D4F]">请先登录后再使用此功能</p>;
  }

  if (isLoading && !url) {
    return <p className="p-4 text-sm text-[#808080]">{loadingHint}</p>;
  }

  if (error && !url) {
    return (
      <p className="p-4 text-sm text-[#FF4D4F]">
        加载失败：{error instanceof Error ? error.message : "未知错误"}
      </p>
    );
  }

  if (!url) {
    return <p className="p-4 text-sm text-[#808080]">未配置跳转地址</p>;
  }

  return <TravelIframeView title={title} url={url} />;
}
