interface ProfileAvatarPreviewProps {
  open: boolean;
  src: string;
  onClose: () => void;
}

export function ProfileAvatarPreview({ open, src, onClose }: ProfileAvatarPreviewProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="查看头像"
      onClick={onClose}
    >
      <button
        type="button"
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] flex size-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 active:bg-white/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label="关闭头像预览"
        onClick={onClose}
      >
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
      <img
        src={src}
        alt="头像大图"
        className="max-h-[82dvh] max-w-full rounded-2xl object-contain shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      />
    </div>
  );
}
