const STEPS = [
  { letter: "D", word: "Development", meaning: "Building awareness" },
  { letter: "H", word: "Habit", meaning: "Forming eco-friendly habits" },
  { letter: "I", word: "Innovation", meaning: "Bringing zero-waste innovation" },
  { letter: "L", word: "Loop", meaning: "Closing the travel loop" },
];

/** What the letters of DHIL stand for: the idea behind every DhilTrip. */
export function DhilWay() {
  return (
    <section aria-labelledby="dhil-heading" className="rounded-3xl bg-white p-5 shadow-sm">
      <h2 id="dhil-heading" className="title-card text-xl">
        The<span translate="no" className="notranslate mx-[0.25em]">DHIL</span>way
      </h2>
      <p className="mt-0.5 text-pretty text-xs text-[#436850]">What our name stands for, and how every trip works.</p>
      <ol className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {STEPS.map((step) => (
          <li key={step.letter} className="flex items-start gap-2.5 rounded-2xl bg-[#F3F4DC] p-3">
            <span
              translate="no"
              aria-hidden="true"
              className="notranslate flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0D2A1F] font-fredoka text-lg font-semibold text-[#B6DC7A]"
            >
              {step.letter}
            </span>
            <span className="min-w-0">
              <span translate="no" className="notranslate block font-fredoka text-base font-semibold leading-tight text-[#12372A]">
                {step.word}
              </span>
              <span className="mt-0.5 block text-pretty text-xs leading-snug text-[#436850]">{step.meaning}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
