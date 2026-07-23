export interface PageToastProps {
  message: string | null;
  tone?: "success" | "error";
  placement?: "bottom" | "center";
  className?: string;
}

export function PageToast({
  message,
  tone = "error",
  placement = "bottom",
  className = "",
}: PageToastProps) {
  if (!message) return null;

  const placementClassName =
    placement === "center"
      ? "pointer-events-none fixed inset-0 z-50 flex items-center justify-center px-6"
      : "pointer-events-none fixed inset-x-0 bottom-24 z-50 flex justify-center px-6";

  return (
    <div className={`${placementClassName} ${className}`}>
      <p
        className={`rounded-xl px-4 py-2.5 text-[13px] text-white shadow-lg ${
          tone === "success" ? "bg-[#1F9D55]/90" : "bg-[#333333]/90"
        }`}
      >
        {message}
      </p>
    </div>
  );
}
