import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const DETAILS = [
  {
    title: "Grace windows",
    body: "Late by 90 seconds? The bell decides, not the bureaucracy. Configurable per class, per campus.",
  },
  {
    title: "Leave, folded in",
    body: "Approved leave silently blanks a seat on the roster, no more chasing notes on WhatsApp.",
  },
  {
    title: "A record you can defend",
    body: "Every check-in carries gate, timestamp and confidence score, written to an append-only audit trail.",
  },
  {
    title: "Roster self-heals",
    body: "New enrollments appear on the right roster automatically once the timetable maps them.",
  },
  {
    title: "Nexa, on call",
    body: "Students ask attendance questions in plain language; Nexa answers from their own records only.",
  },
  {
    title: "Streaks that stick",
    body: "Bronze to Diamond Inferno: attendance becomes the habit students protect, not the chore they dodge.",
  },
];

export function Craft() {
  return (
    <section id="craft" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-28">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          title="Everything between the bell and the break."
          description="The invisible details that make a system feel effortless: the grace windows, the self-healing rosters, the answers a student already trusts."
        />

          <div className="mt-14 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {DETAILS.map((detail, index) => (
              <Reveal key={detail.title} delay={(index % 3) * 0.06}>
                <div className="border-t border-[var(--hairline)] pt-5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent">
                    Detail 0{index + 1}
                  </span>
                  <h3 className="mt-2 font-display text-[17px] font-medium tracking-tight text-hi">
                    {detail.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-mid">{detail.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
    </section>
  );
}
