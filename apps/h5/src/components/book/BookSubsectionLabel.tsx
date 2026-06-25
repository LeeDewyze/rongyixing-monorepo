/** Blue-bar subsection title — shared by hotel book room and flight book passenger sections. */
export function BookSubsectionLabel({ title }: { title: string }) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span className="h-3 w-[3px] shrink-0 rounded-full bg-[#2768FA]" aria-hidden />
      <h4 className="text-[13px] font-medium leading-none text-[#333333]">{title}</h4>
    </div>
  );
}
