import { useSearchParams } from "react-router-dom";

import { usePageHeader } from "@/components/layout";
import { TravelIframeView } from "@/components/travel/TravelIframeView";
import { useSmartBack } from "@/lib/app-back";

export function OpenUrlPage() {
  const goBack = useSmartBack("/home");
  const [params] = useSearchParams();
  const url = params.get("url") ?? "";
  const title = params.get("title") ?? params.get("name") ?? params.get("Name") ?? "详情";
  const hideTitle = params.get("isHideTitle")?.toLowerCase() === "true";

  usePageHeader({
    title,
    showBack: true,
    onBack: goBack,
    visible: !hideTitle,
  });

  if (!url) {
    return <p className="p-4 text-sm text-[#808080]">未提供链接地址</p>;
  }

  return <TravelIframeView title={title} url={url} onWorkflowBack={goBack} />;
}
