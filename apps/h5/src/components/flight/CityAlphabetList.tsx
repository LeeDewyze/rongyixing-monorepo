import type { FlightCityOption } from "@/lib/city-list";

interface CityAlphabetListProps {
  groups: Record<string, FlightCityOption[]>;
  onSelect: (city: FlightCityOption) => void;
}

export function CityAlphabetList({ groups, onSelect }: CityAlphabetListProps) {
  const letters = Object.keys(groups).sort((a, b) => a.localeCompare(b, "en"));

  if (letters.length === 0) {
    return null;
  }

  return (
    <div className="pt-2">
      {letters.map((letter) => (
        <section key={letter} id={`letter-${letter}`} className="scroll-mt-2">
          <div className="bg-[#E8EDF3] px-4 py-1.5 text-sm font-medium text-[#6B7280]">
            {letter}
          </div>
          <ul role="list" className="bg-white">
            {groups[letter].map((city, index) => (
              <li key={city.Code} role="listitem">
                <button
                  type="button"
                  onClick={() => onSelect(city)}
                  className={`flex min-h-12 w-full items-center border-none bg-white px-4 text-left text-base text-[#1F2937] ${
                    index < groups[letter].length - 1 ? "border-b border-[#F0F1F3]" : ""
                  }`}
                >
                  <span>{city.Name}</span>
                  {city.Code ? <span className="ml-1 text-[#9CA3AF]">({city.Code})</span> : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
