import { WEB_MAIN_PADDING_CLASS } from "@/components/WebShell";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className={`${WEB_MAIN_PADDING_CLASS}`}>
      <div className="flex min-h-[50vh] flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-brand-title">{title}</h1>
        <p className="mt-2 max-w-md text-sm text-[#666666]">{description}</p>
      </div>
    </div>
  );
}
