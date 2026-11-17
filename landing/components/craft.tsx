import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const DETAILS = [
  {
    title: "Grace windows",
    body: "Late by 90 seconds? The bell decides, not the bureaucracy. Configurable per class, per campus.",
  },
  {
    title: "Leave, integrated",
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
    title: "Nexa AI assistant",
    body: "Students ask attendance questions in plain language; Nexa answers from their own records only.",
  },
  {
    title: "Streaks that stick",
    body: "Bronze to Diamond Inferno: attendance becomes the habit students protect, not the chore they dodge.",
  },
];

export function Craft() {
  return (
      <section id="craft" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-28 sm:py-36 lg:py-[168px]">
        <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
          <SectionHeading
            title="Everything between the bell and the break."
            description="The invisible details that make a system feel effortless: the grace windows, the self-healing rosters, the answers a student already trusts."
          />

          <div className="mt-14 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {DETAILS.map((detail, index) => (
              <Reveal key={detail.title} delay={(index % 3) * 0.06}>
                <div className="group rounded-[22px] border border-[var(--hairline)] bg-surface p-6 sm:p-7 transition-all duration-300 hover:border-[var(--hairline-strong)] hover:bg-[#16161d]">
                  <span className="chip-bytune h-6 text-[10px] px-2.5 text-accent border-accent/20 bg-accent/5">
                    Detail 0{index + 1}
                  </span>
                  <h3 className="mt-4 font-display text-[18px] sm:text-[19px] font-medium tracking-tight text-hi">
                    {detail.title}
                  </h3>
                  <p className="mt-2 text-[14px] sm:text-[14.5px] leading-[23.9px] text-mid">
                    {detail.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
      );
}
