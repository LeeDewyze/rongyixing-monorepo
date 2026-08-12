import { useEffect, useState } from "react";

import {
  fetchWorkflowEmbedSrcdoc,
  isWorkflowBackMessage,
  isWorkflowEmbedUrl,
} from "@/lib/workflow-embed";

interface TravelIframeViewProps {
  title: string;
  url: string;
  onWorkflowBack?: () => void;
}

/** Legacy `OpenUrlComponent` / workflow embed — iframe with external fallback link. */
export function TravelIframeView({ title, url, onWorkflowBack }: TravelIframeViewProps) {
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isWorkflowEmbedUrl(url)) {
      setSrcdoc(null);
      setLoadError(false);
      return;
    }

    setSrcdoc(null);
    setLoadError(false);

    void fetchWorkflowEmbedSrcdoc(url)
      .then((doc) => {
        if (cancelled) return;
        if (doc) {
          setSrcdoc(doc);
          return;
        }
        setLoadError(true);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (isWorkflowBackMessage(event.data)) {
        onWorkflowBack?.();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onWorkflowBack]);

  const isWorkflowEmbed = isWorkflowEmbedUrl(url);
  const useDirectSrc = !isWorkflowEmbed;
  const iframeSrc = useDirectSrc ? url : undefined;
  const canRenderIframe = useDirectSrc ? Boolean(url) : Boolean(srcdoc);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      {loadError && isWorkflowEmbed ? (
        <div className="flex flex-col gap-2 border-b border-[#ECECEC] px-3 py-2">
          <p className="text-sm text-[#808080]">工作流页面加载失败，请重试或浏览器打开。</p>
          <a href={url} target="_blank" rel="noreferrer" className="text-sm text-brand-primary">
            浏览器打开
          </a>
        </div>
      ) : null}
      {isWorkflowEmbed && !srcdoc && !loadError ? (
        <p className="p-4 text-sm text-[#808080]">正在加载详情…</p>
      ) : null}
      {canRenderIframe ? (
        <iframe
          title={title}
          src={iframeSrc}
          srcDoc={srcdoc ?? undefined}
          className="min-h-0 w-full flex-1 border-0"
        />
      ) : null}
    </div>
  );
}
