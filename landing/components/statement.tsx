import { Reveal } from "./ui/reveal";

const LINES = [
  { text: "Attendance lives in a spreadsheet.", tone: "text-mid" },
  { text: "Camera feeds live in another tab.", tone: "text-mid" },
  { text: "Security alerts live in someone's inbox.", tone: "text-mid" },
  { text: "On SmartFace, the whole campus lives in one place.", tone: "text-hi" },
];

export function Statement() {
  return (
    <section id="statement" className="relative py-24 sm:py-28">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <div className="max-w-[789.6px]">
          {LINES.map((line, index) => (
            <Reveal key={line.text} delay={index * 0.06}>
              <p
                className={`text-balance font-display text-[1.7rem] font-medium leading-[1.15] tracking-[-0.02em] sm:text-[2.4rem] lg:text-[2.9rem] ${line.tone}`}
              >
                {line.text}
              </p>
            </Reveal>
          ))}
          <Reveal delay={0.28}>
            <p className="mt-8 max-w-[563.2px] text-[15px] leading-relaxed text-low">
              One identity graph, one session token, one audit trail: from the gate to the group
              chat.
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
