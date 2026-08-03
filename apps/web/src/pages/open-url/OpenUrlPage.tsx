import { usePageHeader } from "@/components/layout";
import { TravelIframeView } from "@/components/travel/TravelIframeView";
import { useSmartBack } from "@/lib/app-back";
import { WEB_PAGE_ROOT } from "@/lib/web-page-layout";

export function OpenUrlPage() {
  const goBack = useSmartBack("/");
  const params = new URLSearchParams(globalThis.location?.search ?? "");
  const url = params.get("url") ?? "";
  const title = params.get("title") ?? params.get("name") ?? "详情";

  usePageHeader({
    title,
    showBack: true,
    onBack: goBack,
    tone: "form",
  });

  if (!url) {
    return <p className="p-4 text-sm text-[#808080]">未提供链接地址</p>;
  }

  return (
    <div className={WEB_PAGE_ROOT}>
      <TravelIframeView title={title} url={url} onWorkflowBack={goBack} />
    </div>
  );
}
