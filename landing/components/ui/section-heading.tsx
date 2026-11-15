import type { ReactNode } from "react";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <Reveal className="max-w-2xl">
      <p className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-brand-300">
        <span className="h-px w-6 bg-brand-400/60" aria-hidden />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance font-display text-3xl font-bold leading-[1.12] tracking-[-0.025em] text-ink sm:text-[2.5rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 text-pretty text-[15px] leading-relaxed text-ink-muted">{description}</p>
      ) : null}
    </Reveal>
  );
}
