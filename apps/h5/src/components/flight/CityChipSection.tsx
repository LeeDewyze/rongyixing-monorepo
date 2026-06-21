import type { FlightCityOption } from "@/lib/city-list";

interface CityChipSectionProps {
  title: string;
  cities: FlightCityOption[];
  selectedCode?: string;
  onSelect: (city: FlightCityOption) => void;
}

export function CityChipSection({
  title,
  cities,
  selectedCode,
  onSelect,
}: CityChipSectionProps) {
  if (cities.length === 0) {
    return null;
  }

  return (
    <section className="px-4 pt-4">
      <h2 className="mb-3 text-sm text-[#6B7280]">{title}</h2>
      <div className="grid grid-cols-3 gap-2" role="list">
        {cities.map((city) => {
          const isSelected = city.Code === selectedCode;
          return (
            <button
              key={`${title}-${city.Code}`}
              type="button"
              role="listitem"
              onClick={() => onSelect(city)}
              className={`min-h-11 rounded-lg border text-sm ${
                isSelected
                  ? "border-[#2276DD] bg-[#2276DD] text-white"
                  : "border-[#E5E7EB] bg-white text-[#1F2937]"
              }`}
            >
              {city.Name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
