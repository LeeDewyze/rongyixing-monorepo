import { useEffect, useMemo, useRef, useState } from "react";

interface PendingAvatarSource {
  file: File;
  previewUrl: string;
}

interface ProfileAvatarCropSheetProps {
  open: boolean;
  source: PendingAvatarSource | null;
  uploading?: boolean;
  className?: string;
  onClose: () => void;
  onConfirm: (file: File) => Promise<void> | void;
}

interface CropMetrics {
  frameSize: number;
  cropSize: number;
  imageWidth: number;
  imageHeight: number;
  offsetX: number;
  offsetY: number;
  zoom: number;
  flipX: boolean;
  flipY: boolean;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const DEFAULT_ZOOM = 1.08;
const CROP_RATIO = 0.75;
const OUTPUT_SIZE = 800;

function CropIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M7 3v4m0 10v4M3 7h4m10 0h4M7 17h10" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 7h8a2 2 0 0 1 2 2v8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlipHorizontalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 4v16" strokeLinecap="round" />
      <path d="M8 8 4 12l4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FlipVerticalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 12h16" strokeLinecap="round" />
      <path d="M8 8l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 16l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M20 12a8 8 0 1 1-2.2-5.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 5v6h-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      <div className="aspect-square animate-pulse rounded-2xl bg-[#EEF0F4]" />
      <div className="h-4 w-24 animate-pulse rounded bg-[#EEF0F4]" />
      <div className="h-10 animate-pulse rounded-full bg-[#EEF0F4]" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-[#EEF5FF] text-brand-primary">
        <CropIcon />
      </div>
      <h3 className="text-[15px] font-medium text-brand-title">未选择图片</h3>
      <p className="text-[13px] leading-relaxed text-[#7A8494]">请先重新选择一张图片再进行裁剪</p>
    </div>
  );
}

async function canvasToFile(canvas: HTMLCanvasElement, filename: string): Promise<File> {
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value);
        return;
      }
      reject(new Error("头像裁剪失败"));
    }, "image/jpeg", 0.92);
  });

  const finalName = filename.replace(/\.[^.]+$/, "") || "avatar";
  return new File([blob], `${finalName}.jpg`, { type: "image/jpeg" });
}

async function cropImage(source: PendingAvatarSource, metrics: CropMetrics): Promise<File> {
  const image = new Image();
  image.src = source.previewUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("头像裁剪失败");
  }

  const coverScale = Math.max(metrics.cropSize / image.naturalWidth, metrics.cropSize / image.naturalHeight);
  const scale = coverScale * metrics.zoom;
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const centerX = OUTPUT_SIZE / 2 + (metrics.offsetX / metrics.cropSize) * OUTPUT_SIZE;
  const centerY = OUTPUT_SIZE / 2 + (metrics.offsetY / metrics.cropSize) * OUTPUT_SIZE;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.scale(metrics.flipX ? -1 : 1, metrics.flipY ? -1 : 1);
  ctx.drawImage(
    image,
    0,
    0,
    image.naturalWidth,
    image.naturalHeight,
    -drawWidth / 2,
    -drawHeight / 2,
    drawWidth,
    drawHeight,
  );
  ctx.restore();

  return canvasToFile(canvas, source.file.name);
}

/** Avatar crop sheet used before uploading the confirmed head image. */
export function ProfileAvatarCropSheet({
  open,
  source,
  uploading = false,
  className,
  onClose,
  onConfirm,
}: ProfileAvatarCropSheetProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [flipY, setFlipY] = useState(false);
  const [error, setError] = useState("");
  const [frameSize, setFrameSize] = useState(0);

  useEffect(() => {
    if (!open || !source) return;
    setLoaded(false);
    setZoom(DEFAULT_ZOOM);
    setOffsetX(0);
    setOffsetY(0);
    setFlipX(false);
    setFlipY(false);
    setError("");
  }, [open, source]);

  useEffect(() => {
    if (!open) return;
    const frame = frameRef.current;
    if (!frame || typeof ResizeObserver === "undefined") {
      if (frame) {
        setFrameSize(frame.getBoundingClientRect().width);
      }
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setFrameSize(entry.contentRect.width);
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, [open]);

  const metrics = useMemo<CropMetrics | null>(() => {
    if (!frameSize || !imageRef.current) return null;
    const image = imageRef.current;
    const cropSize = frameSize * CROP_RATIO;
    const coverScale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight);
    const drawWidth = image.naturalWidth * coverScale * zoom;
    const drawHeight = image.naturalHeight * coverScale * zoom;
    const limitX = Math.max(0, (drawWidth - cropSize) / 2);
    const limitY = Math.max(0, (drawHeight - cropSize) / 2);

    return {
      frameSize,
      cropSize,
      imageWidth: drawWidth,
      imageHeight: drawHeight,
      offsetX: Math.max(-limitX, Math.min(limitX, offsetX)),
      offsetY: Math.max(-limitY, Math.min(limitY, offsetY)),
      zoom,
      flipX,
      flipY,
    };
  }, [frameSize, offsetX, offsetY, zoom, flipX, flipY]);

  useEffect(() => {
    function handlePointerMove(event: PointerEvent) {
      const drag = dragStateRef.current;
      const frame = frameRef.current;
      if (!drag || !frame) return;
      if (event.pointerId !== drag.pointerId) return;

      const nextX = drag.originX + (event.clientX - drag.startX);
      const nextY = drag.originY + (event.clientY - drag.startY);
      const rect = frame.getBoundingClientRect();
      const image = imageRef.current;
      if (!image) return;

      const cropSize = rect.width * CROP_RATIO;
      const coverScale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight);
      const drawWidth = image.naturalWidth * coverScale * zoom;
      const drawHeight = image.naturalHeight * coverScale * zoom;
      const limitX = Math.max(0, (drawWidth - cropSize) / 2);
      const limitY = Math.max(0, (drawHeight - cropSize) / 2);

      setOffsetX(Math.max(-limitX, Math.min(limitX, nextX)));
      setOffsetY(Math.max(-limitY, Math.min(limitY, nextY)));
    }

    function handlePointerUp(event: PointerEvent) {
      const drag = dragStateRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragStateRef.current = null;
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [zoom]);

  if (!open) return null;

  async function handleConfirm() {
    if (!source || !metrics || uploading) return;
    try {
      setError("");
      const file = await cropImage(source, metrics);
      await onConfirm(file);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "头像裁剪失败");
    }
  }

  const imageStyle = metrics
    ? {
        width: `${metrics.imageWidth}px`,
        height: `${metrics.imageHeight}px`,
        transform: `translate(-50%, -50%) translate(${metrics.offsetX}px, ${metrics.offsetY}px) scale(${metrics.flipX ? -1 : 1}, ${metrics.flipY ? -1 : 1})`,
      }
    : { width: "100%", height: "100%", transform: "translate(-50%, -50%)" };

  return (
    <div className={`fixed inset-0 z-[75] flex flex-col justify-end bg-black/50 ${className ?? ""}`}>
      <button type="button" className="flex-1" aria-label="关闭" disabled={uploading} onClick={onClose} />
      <div className="rounded-t-3xl bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_32px_rgba(15,23,42,0.18)]">
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#E8ECF2]" />
        <div className="flex items-center justify-between pb-3">
          <button
            type="button"
            className="flex h-9 items-center justify-center rounded-full px-3 text-[14px] font-medium text-[#5E6A7D] active:bg-[#F5F7FA] disabled:opacity-50"
            disabled={uploading}
            onClick={onClose}
          >
            取消
          </button>
          <h2 className="text-[16px] font-semibold tracking-tight text-brand-title">裁剪头像</h2>
          <button
            type="button"
            className="flex h-9 items-center justify-center rounded-full bg-brand-primary px-4 text-[14px] font-medium text-white shadow-[0_4px_12px_rgba(39,104,250,0.26)] active:opacity-90 disabled:opacity-50"
            disabled={uploading || !source || !loaded}
            onClick={() => void handleConfirm()}
          >
            {uploading ? "上传中…" : "确认"}
          </button>
        </div>

        <div className="space-y-3">
          <div
            ref={frameRef}
            className="relative mx-auto aspect-square w-full max-w-sm touch-none overflow-hidden rounded-2xl bg-[#F5F6F9] ring-1 ring-black/5"
          >
            {!source ? (
              <EmptyState />
            ) : (
              <>
                <img
                  ref={imageRef}
                  src={source.previewUrl}
                  alt="待裁剪头像"
                  className={`absolute left-1/2 top-1/2 select-none touch-none transition-opacity duration-150 ${
                    loaded ? "opacity-100" : "opacity-0"
                  }`}
                  style={imageStyle}
                  draggable={false}
                  onLoad={() => setLoaded(true)}
                  onError={() => setError("图片加载失败")}
                  onPointerDown={(event) => {
                    if (!frameRef.current) return;
                    event.preventDefault();
                    dragStateRef.current = {
                      pointerId: event.pointerId,
                      startX: event.clientX,
                      startY: event.clientY,
                      originX: offsetX,
                      originY: offsetY,
                    };
                    (event.currentTarget as HTMLImageElement).setPointerCapture(event.pointerId);
                  }}
                />
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.02),rgba(0,0,0,0.06))]" />
                  <div className="absolute inset-[12.5%] rounded-full border border-white/90 shadow-[0_0_0_999px_rgba(0,0,0,0.1)]" />
                </div>
                {!loaded ? (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                    <LoadingSkeleton />
                  </div>
                ) : null}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#EEF5FF] px-3 text-[13px] font-medium text-brand-primary active:bg-[#E5F0FF] disabled:opacity-50"
              disabled={uploading || !source}
              onClick={() => setFlipX((value) => !value)}
            >
              <FlipHorizontalIcon />
              <span>水平翻转</span>
            </button>
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#EEF5FF] px-3 text-[13px] font-medium text-brand-primary active:bg-[#E5F0FF] disabled:opacity-50"
              disabled={uploading || !source}
              onClick={() => setFlipY((value) => !value)}
            >
              <FlipVerticalIcon />
              <span>垂直翻转</span>
            </button>
            <button
              type="button"
              className="flex h-8 items-center gap-1.5 rounded-full bg-[#F5F6F9] px-3 text-[13px] font-medium text-[#5E6A7D] active:bg-[#EBEDF3] disabled:opacity-50"
              disabled={uploading || !source}
              onClick={() => {
                setZoom(DEFAULT_ZOOM);
                setOffsetX(0);
                setOffsetY(0);
                setFlipX(false);
                setFlipY(false);
              }}
            >
              <ResetIcon />
              <span>重置</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[#7A8494]">缩放</span>
            <input
              type="range"
              min={ZOOM_MIN}
              max={ZOOM_MAX}
              step={0.01}
              value={zoom}
              className="h-2 flex-1 appearance-none rounded-full bg-[#EEF0F4] accent-brand-primary"
              disabled={uploading || !source}
              onChange={(event) => setZoom(Number(event.target.value))}
            />
            <span className="w-10 text-right text-[13px] text-[#7A8494]">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {error ? <p className="text-center text-[13px] text-[#FF4D4F]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
