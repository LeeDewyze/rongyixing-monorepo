import type { FlightFilterCondition } from "@ryx/shared-types";
import { Button } from "@ryx/ui/components/ui/button";

interface FlightFilterSheetProps {
  open: boolean;
  filter: FlightFilterCondition;
  onChange: (filter: FlightFilterCondition) => void;
  onClose: () => void;
  onConfirm: () => void;
}

function toggleOption(
  filter: FlightFilterCondition,
  key: keyof Pick<
    FlightFilterCondition,
    "airCompanies" | "fromAirports" | "toAirports" | "airTypes"
  >,
  id: string,
): FlightFilterCondition {
  return {
    ...filter,
    [key]: filter[key].map((o) =>
      o.id === id ? { ...o, isChecked: !o.isChecked } : o,
    ),
  };
}

function OptionGroup({
  title,
  options,
  onToggle,
}: {
  title: string;
  options: FlightFilterCondition["airCompanies"];
  onToggle: (id: string) => void;
}) {
  if (!options.length) return null;
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onToggle(o.id)}
            className={`rounded-full border px-3 py-1 text-xs ${
              o.isChecked
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const TIME_SPANS = [
  { label: "不限", value: null },
  { label: "06-12时", value: { lower: 6, upper: 12 } },
  { label: "12-18时", value: { lower: 12, upper: 18 } },
  { label: "18-24时", value: { lower: 18, upper: 24 } },
] as const;

export function FlightFilterSheet({
  open,
  filter,
  onChange,
  onClose,
  onConfirm,
}: FlightFilterSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="关闭筛选" onClick={onClose} />
      <div className="max-h-[75vh] overflow-y-auto rounded-t-2xl bg-background p-4 pb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">筛选</h2>
          <button
            type="button"
            className="text-sm text-muted-foreground"
            onClick={() =>
              onChange({
                ...filter,
                onlyDirect: false,
                isAgreement: false,
                takeOffTimeSpan: null,
                airCompanies: filter.airCompanies.map((o) => ({ ...o, isChecked: false })),
                fromAirports: filter.fromAirports.map((o) => ({ ...o, isChecked: false })),
                toAirports: filter.toAirports.map((o) => ({ ...o, isChecked: false })),
                airTypes: filter.airTypes.map((o) => ({ ...o, isChecked: false })),
              })
            }
          >
            重置
          </button>
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onChange({ ...filter, onlyDirect: !filter.onlyDirect })}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter.onlyDirect
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              仅直达
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...filter, isAgreement: !filter.isAgreement })}
              className={`rounded-full border px-3 py-1 text-xs ${
                filter.isAgreement
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border"
              }`}
            >
              协议航司
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">起飞时段</p>
            <div className="flex flex-wrap gap-2">
              {TIME_SPANS.map((span) => {
                const active =
                  span.value === null
                    ? filter.takeOffTimeSpan === null
                    : filter.takeOffTimeSpan?.lower === span.value?.lower &&
                      filter.takeOffTimeSpan?.upper === span.value?.upper;
                return (
                  <button
                    key={span.label}
                    type="button"
                    onClick={() => onChange({ ...filter, takeOffTimeSpan: span.value })}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border"
                    }`}
                  >
                    {span.label}
                  </button>
                );
              })}
            </div>
          </div>

          <OptionGroup
            title="航空公司"
            options={filter.airCompanies}
            onToggle={(id) => onChange(toggleOption(filter, "airCompanies", id))}
          />
          <OptionGroup
            title="起飞机场"
            options={filter.fromAirports}
            onToggle={(id) => onChange(toggleOption(filter, "fromAirports", id))}
          />
          <OptionGroup
            title="到达机场"
            options={filter.toAirports}
            onToggle={(id) => onChange(toggleOption(filter, "toAirports", id))}
          />
          <OptionGroup
            title="机型"
            options={filter.airTypes}
            onToggle={(id) => onChange(toggleOption(filter, "airTypes", id))}
          />
        </div>

        <Button className="mt-6 h-11 w-full" onClick={onConfirm}>
          确定
        </Button>
      </div>
    </div>
  );
}
