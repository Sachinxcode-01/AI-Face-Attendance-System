import type { ReactNode } from "react";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: ReactNode;
  description?: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <Reveal className="max-w-[744px]">
      <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
        <span className="h-px w-6 bg-accent/60" aria-hidden />
        {eyebrow}
      </p>
      <h2 className="mt-4 text-balance font-display text-[2.2rem] font-medium leading-[1.08] tracking-[-0.03em] text-hi sm:text-[3.25rem] lg:text-[4rem]">
        {title}
      </h2>
      {description ? (
        <p className="mt-5 max-w-[563.2px] text-pretty text-[15.5px] leading-relaxed text-mid">
          {description}
        </p>
      ) : null}
    </Reveal>
  );
}
