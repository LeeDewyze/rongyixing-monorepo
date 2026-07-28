import type { HomeProductId } from "@/config/home-assets";

const DEFAULT_PRODUCT_ORDER: HomeProductId[] = ["flight", "train", "hotel"];

/** White upward triangle on the search panel, aligned under the active product tab (Figma 10:252). */
export function HomeProductTabPointer({
  product,
  visibleProducts = DEFAULT_PRODUCT_ORDER,
}: {
  product: HomeProductId;
  visibleProducts?: HomeProductId[];
}) {
  const index = visibleProducts.indexOf(product);
  if (index < 0) return null;
  const left = ((index + 0.5) / visibleProducts.length) * 100;

  return (
    <div
      className="pointer-events-none absolute -top-[9px] z-20 -translate-x-1/2"
      style={{ left: `${left}%` }}
      aria-hidden
    >
      <svg width="24" height="10" viewBox="0 0 24 10" className="block">
        <path d="M12 0 24 10H0L12 0Z" fill="#FFFFFF" />
      </svg>
    </div>
  );
}
