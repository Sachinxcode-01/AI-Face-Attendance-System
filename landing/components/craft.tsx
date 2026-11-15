import { BadgeCheck, CalendarClock, History, MessageSquareText, Timer, UsersRound } from "lucide-react";
import { Reveal } from "./ui/reveal";
import { SectionHeading } from "./ui/section-heading";

const DETAILS = [
  {
    icon: Timer,
    title: "Grace windows",
    body: "Late by 90 seconds? The bell decides, not the bureaucracy. Configurable per class, per campus.",
  },
  {
    icon: CalendarClock,
    title: "Leave, folded in",
    body: "Approved leave silently blanks a seat on the roster — no more chasing notes on WhatsApp.",
  },
  {
    icon: History,
    title: "A record you can defend",
    body: "Every check-in carries gate, timestamp and confidence score, written to an append-only audit trail.",
  },
  {
    icon: UsersRound,
    title: "Roster self-heals",
    body: "New enrollments appear on the right roster automatically once the timetable maps them.",
  },
  {
    icon: MessageSquareText,
    title: "Nexa, on call",
    body: "Students ask attendance questions in plain language; Nexa answers from their own records only.",
  },
  {
    icon: BadgeCheck,
    title: "Streaks that stick",
    body: "Bronze to Diamond Inferno — attendance becomes the habit students protect, not the chore they dodge.",
  },
];

export function Craft() {
  return (
    <section id="craft" className="relative scroll-mt-24 border-t border-[var(--hairline)] py-24 sm:py-28">
      <div className="mx-auto w-full max-w-[var(--container)] px-6 lg:px-8">
        <SectionHeading
          eyebrow="Craft"
          title="Everything between the bell and the break."
          description="The invisible details that make a system feel effortless — the grace windows, the self-healing rosters, the answers a student already trusts."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DETAILS.map((detail, index) => {
            const Icon = detail.icon;
            return (
              <Reveal key={detail.title} delay={(index % 3) * 0.07}>
                <div className="group h-full rounded-[22px] border border-[var(--hairline)] bg-[var(--surface)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--hairline-strong)] hover:bg-[var(--panel)]">
                  <span className="grid h-10 w-10 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-accent transition-colors duration-300 group-hover:text-accent2">
                    <Icon className="h-4.5 w-4.5" strokeWidth={1.7} />
                  </span>
                  <h3 className="mt-4 font-display text-[16px] font-medium tracking-tight text-hi">
                    {detail.title}
                  </h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-low">{detail.body}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
