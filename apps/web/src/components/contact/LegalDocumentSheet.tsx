import { useEffect, useRef, useState } from "react";
import { loadLegalDocumentIframeSrc } from "@ryx/api";

import "./legal-document-sheet.css";

interface LegalDocumentSheetProps {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}

const BLOB_IFRAME_SANDBOX =
  "allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox";

/** Full-screen legal document viewer — slides up with brand gradient header. */
export function LegalDocumentSheet({ open, title, url, onClose }: LegalDocumentSheetProps) {
  const [iframeSrc, setIframeSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const blobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!open || !url) {
      setIframeSrc("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    void loadLegalDocumentIframeSrc(url, {
      pageOrigin: window.location.origin,
      useDevProxy: import.meta.env.DEV,
    }).then((src) => {
      if (cancelled) {
        if (src.startsWith("blob:")) {
          URL.revokeObjectURL(src);
        }
        return;
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
      if (src.startsWith("blob:")) {
        blobUrlRef.current = src;
      }
      setIframeSrc(src);
      setLoading(false);
    });

    return () => {
      cancelled = true;
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, [open, url]);

  if (!open || !url) return null;

  const usesBlobSrc = iframeSrc.startsWith("blob:");

  return (
    <div className="absolute inset-0 z-[60] flex flex-col">
      <div className="legal-document-sheet-panel ryx-viewport-min flex flex-col bg-[#F5F6F9]">
        <div className="shrink-0 bg-gradient-to-b from-brand-header-start to-brand-header-end pt-[env(safe-area-inset-top)]">
          <div className="flex items-center px-1 pb-2 pt-1">
            <button
              type="button"
              className="flex h-11 w-10 shrink-0 items-center justify-center text-[26px] font-light leading-none text-white active:opacity-70"
              aria-label="返回"
              onClick={onClose}
            >
              ‹
            </button>
            <h1 className="min-w-0 flex-1 truncate text-center text-[17px] font-medium text-white">
              {title}
            </h1>
            <span className="w-10 shrink-0" />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-0 flex-1 items-center justify-center text-sm text-[#8A94A6]">
            加载中…
          </div>
        ) : (
          <iframe
            title={title}
            src={iframeSrc || undefined}
            className="min-h-0 w-full flex-1 border-0 bg-white"
            sandbox={usesBlobSrc ? BLOB_IFRAME_SANDBOX : undefined}
          />
        )}
      </div>
    </div>
  );
}
