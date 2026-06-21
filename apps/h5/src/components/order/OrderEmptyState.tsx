import { ORDER_ASSETS, ORDER_FONT } from "@/config/order-assets";

export function OrderEmptyState() {
  return (
    <div className="flex flex-col items-center px-6 pt-24">
      <img src={ORDER_ASSETS.empty} alt="" className="h-40 w-40 object-contain" aria-hidden />
      <p className={`mt-4 text-[14px] text-[#9CA3AF] ${ORDER_FONT}`}>暂无内容</p>
    </div>
  );
}
