import { Reveal } from "./ui/reveal";

const LINES = [
  { text: "Attendance lives in a spreadsheet.", tone: "text-mid" },
  { text: "Camera feeds live in another tab.", tone: "text-mid" },
  { text: "Security alerts live in someone's inbox.", tone: "text-mid" },
  { text: "On SmartFace, the whole campus lives in one place.", tone: "text-hi font-medium" },
];

export function Statement() {
  return (
      <section id="statement" className="relative py-28 sm:py-36 lg:py-[168px] border-t border-[var(--hairline)]">
        <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
            <div className="max-w-[820px]">
              {LINES.map((line, index) => (
                <Reveal key={line.text} delay={index * 0.06}>
                  <p
                    className={`text-balance font-display text-[26px] sm:text-[38px] lg:text-[46px] leading-[1.12] tracking-[-0.025em] ${line.tone}`}
                  >
                    {line.text}
                  </p>
                </Reveal>
              ))}
              <Reveal delay={0.28}>
                  <p className="mt-8 max-w-[580px] text-[16px] sm:text-[19px] leading-[30.4px] tracking-[-0.015em] text-low">
                    One identity graph, one session token, one audit trail: from the gate to the group
                    chat.
                  </p>
              </Reveal>
            </div>
          </div>
      </section>
      );
}
