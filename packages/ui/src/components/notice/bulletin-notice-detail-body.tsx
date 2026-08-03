import { Button } from "#components/ui/button";
import { cn } from "#lib/utils";

export interface BulletinNoticeDetailBodyProps {
  fullFileName?: string;
  description?: string;
  detailHtml?: string;
  url?: string;
  onOpenLink?: () => void;
  className?: string;
}

export function BulletinNoticeDetailBody({
  fullFileName,
  description,
  detailHtml,
  url,
  onOpenLink,
  className,
}: BulletinNoticeDetailBodyProps) {
  const hasBody = Boolean(fullFileName || description || detailHtml);
  const hasLink = Boolean(url?.trim());

  if (!hasBody && !hasLink) {
    return null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {fullFileName ? (
        <img
          src={fullFileName}
          alt=""
          className="aspect-square w-full max-w-full object-cover"
          loading="eager"
        />
      ) : null}
      {description ? (
        <h3 className="text-[16px] font-medium leading-6 text-brand-title">{description}</h3>
      ) : null}
      {detailHtml ? (
        <div
          className="notice-detail text-[14px] leading-[22px] text-brand-title [&_a]:text-brand-primary [&_img]:max-w-full [&_p]:mb-2"
          // Legacy bulletin detail renders trusted CMS HTML via innerHtml.
          dangerouslySetInnerHTML={{ __html: detailHtml }}
        />
      ) : null}
      {hasLink ? (
        <div className="flex justify-center pt-2">
          <Button type="button" variant="secondary" className="min-w-[140px]" onClick={onOpenLink}>
            打开链接
          </Button>
        </div>
      ) : null}
    </div>
  );
}
