import "./legal-document-sheet.css";

interface LegalDocumentSheetProps {
  open: boolean;
  title: string;
  url: string;
  onClose: () => void;
}

/** Full-screen legal document viewer — slides up with brand gradient header. */
export function LegalDocumentSheet({ open, title, url, onClose }: LegalDocumentSheetProps) {
  if (!open || !url) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col">
      <div className="legal-document-sheet-panel flex min-h-dvh flex-col bg-[#F5F6F9]">
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

        <iframe title={title} src={url} className="min-h-0 w-full flex-1 border-0 bg-white" />
      </div>
    </div>
  );
}
