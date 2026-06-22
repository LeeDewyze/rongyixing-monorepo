import type { TrainFilterCondition, TrainFilterOption } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";

interface TrainFilterSheetProps {
  open: boolean;
  filter: TrainFilterCondition;
  onChange: (filter: TrainFilterCondition) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const TIME_SPANS = [
  { label: "不限", value: null },
  { label: "06-12时", value: { lower: 6, upper: 12 } },
  { label: "12-18时", value: { lower: 12, upper: 18 } },
  { label: "18-24时", value: { lower: 18, upper: 24 } },
] as const;

export function TrainFilterSheet({
  open,
  filter,
  onChange,
  onClose,
  onConfirm,
}: TrainFilterSheetProps) {
  if (!open) return null;

  function resetFilter() {
    onChange({
      ...filter,
      onlyHasTickets: false,
      departureTimeSpan: null,
      seatTypes: filter.seatTypes.map((option: TrainFilterOption) => ({
        ...option,
        isChecked: false,
      })),
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭筛选" onClick={onClose} />
      <div className="max-h-[75vh] overflow-y-auto rounded-t-2xl bg-background p-4 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">筛选</h2>
          <button type="button" className="text-sm text-muted-foreground" onClick={resetFilter}>
            重置
          </button>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2 text-sm font-medium">出发时段</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SPANS.map((span) => {
                const active =
                  span.value === null
                    ? filter.departureTimeSpan === null
                    : filter.departureTimeSpan?.lower === span.value.lower &&
                      filter.departureTimeSpan?.upper === span.value.upper;
                return (
                  <button
                    key={span.label}
                    type="button"
                    onClick={() => onChange({ ...filter, departureTimeSpan: span.value })}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      active ? "border-primary bg-primary text-primary-foreground" : "border-border"
                    }`}
                  >
                    {span.label}
                  </button>
                );
              })}
            </div>
          </div>

          {filter.seatTypes.length > 0 ? (
            <div>
              <p className="mb-2 text-sm font-medium">席别</p>
              <div className="flex flex-wrap gap-2">
                {filter.seatTypes.map((option: TrainFilterOption) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() =>
                      onChange({
                        ...filter,
                        seatTypes: filter.seatTypes.map((item: TrainFilterOption) =>
                          item.id === option.id ? { ...item, isChecked: !item.isChecked } : item,
                        ),
                      })
                    }
                    className={`rounded-full border px-3 py-1 text-xs ${
                      option.isChecked
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => onChange({ ...filter, onlyHasTickets: !filter.onlyHasTickets })}
            className={`rounded-full border px-3 py-1 text-xs ${
              filter.onlyHasTickets
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border"
            }`}
          >
            只看有票
          </button>
        </div>

        <Button className="mt-6 h-11 w-full" onClick={onConfirm}>
          确定
        </Button>
      </div>
    </div>
  );
}
