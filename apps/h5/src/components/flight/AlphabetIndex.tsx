interface AlphabetIndexProps {
  letters: string[];
  onJump: (letter: string) => void;
}

export function AlphabetIndex({ letters, onJump }: AlphabetIndexProps) {
  if (letters.length === 0) {
    return null;
  }

  return (
    <aside
      className="pointer-events-none absolute inset-y-0 right-0 z-30 w-8 py-3"
      aria-label="Alphabet index"
    >
      <nav className="pointer-events-auto flex h-full flex-col items-center justify-evenly">
        {letters.map((letter) => (
          <button
            key={letter}
            type="button"
            onClick={() => onJump(letter)}
            aria-label={`Jump to ${letter}`}
            className="flex min-h-5 min-w-5 touch-manipulation items-center justify-center border-none bg-transparent p-0 text-[11px] leading-none font-medium text-[#2276DD]"
          >
            {letter}
          </button>
        ))}
      </nav>
    </aside>
  );
}
