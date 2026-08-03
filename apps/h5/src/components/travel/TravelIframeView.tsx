import { useEffect, useState } from "react";

import { fetchWorkflowEmbedSrcdoc, isWorkflowEmbedUrl } from "@/lib/workflow-embed";

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
      const data = event.data as { type?: string } | null;
      if (data?.type === "back") {
        onWorkflowBack?.();
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onWorkflowBack]);

  const useDirectSrc = !isWorkflowEmbedUrl(url) || loadError;
  const iframeSrc = useDirectSrc ? url : undefined;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <div className="flex items-center justify-end gap-3 border-b border-[#ECECEC] px-3 py-2">
        <a href={url} target="_blank" rel="noreferrer" className="text-sm text-brand-primary">
          浏览器打开
        </a>
      </div>
      {!useDirectSrc && !srcdoc ? (
        <p className="p-4 text-sm text-[#808080]">正在加载详情…</p>
      ) : null}
      {useDirectSrc || srcdoc ? (
        <iframe
          title={title}
          src={iframeSrc}
          srcDoc={srcdoc ?? undefined}
          className="min-h-[calc(100dvh-6rem)] w-full flex-1 border-0"
        />
      ) : null}
    </div>
  );
}
