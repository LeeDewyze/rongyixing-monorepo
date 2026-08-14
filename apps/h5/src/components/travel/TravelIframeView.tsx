import { useEffect, useRef, useState } from "react";

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

function measureEmbedHeight(doc: Document): number {
  return Math.max(doc.documentElement?.scrollHeight ?? 0, doc.body?.scrollHeight ?? 0);
}

/** Legacy `OpenUrlComponent` / workflow embed — iframe with external fallback link. */
export function TravelIframeView({ title, url, onWorkflowBack }: TravelIframeViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [srcdoc, setSrcdoc] = useState<string | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!isWorkflowEmbedUrl(url)) {
      setSrcdoc(null);
      setLoadError(false);
      setFrameHeight(null);
      return;
    }

    setSrcdoc(null);
    setLoadError(false);
    setFrameHeight(null);

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
      document.querySelector("[data-ryx-taskinfo-modal]")?.remove();
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

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !srcdoc) return;

    let cancelled = false;
    let mutationObserver: MutationObserver | undefined;
    let resizeObserver: ResizeObserver | undefined;

    function measure() {
      const doc = iframe.contentDocument;
      if (!doc || cancelled) return;
      const height = measureEmbedHeight(doc);
      if (height > 0) {
        setFrameHeight(height);
      }
    }

    function attach() {
      const doc = iframe.contentDocument;
      if (!doc?.documentElement) return;
      measure();
      mutationObserver = new MutationObserver(measure);
      mutationObserver.observe(doc.documentElement, {
        childList: true,
        subtree: true,
      });
      if (typeof ResizeObserver !== "undefined" && doc.body) {
        resizeObserver = new ResizeObserver(measure);
        resizeObserver.observe(doc.body);
      }
    }

    iframe.addEventListener("load", attach);
    if (iframe.contentDocument?.readyState === "complete") {
      attach();
    }

    return () => {
      cancelled = true;
      iframe.removeEventListener("load", attach);
      mutationObserver?.disconnect();
      resizeObserver?.disconnect();
    };
  }, [srcdoc]);

  const isWorkflowEmbed = isWorkflowEmbedUrl(url);
  const useDirectSrc = !isWorkflowEmbed;
  const iframeSrc = useDirectSrc ? url : undefined;
  const canRenderIframe = useDirectSrc ? Boolean(url) : Boolean(srcdoc);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white">
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
        <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain touch-pan-y [-webkit-overflow-scrolling:touch]">
          <iframe
            ref={iframeRef}
            title={title}
            src={iframeSrc}
            srcDoc={srcdoc ?? undefined}
            className={useDirectSrc ? "min-h-0 h-full w-full border-0" : "block w-full border-0"}
            style={useDirectSrc ? undefined : { height: frameHeight ? `${frameHeight}px` : "100%" }}
          />
        </div>
      ) : null}
    </div>
  );
}
