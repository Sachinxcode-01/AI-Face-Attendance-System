import type { ReactNode } from "react";
import { Reveal } from "./reveal";

type SectionHeadingProps = {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  className?: string;
};

  export function SectionHeading({ eyebrow, title, description, className = "" }: SectionHeadingProps) {
    return (
        <Reveal className={`max-w-[744px] ${className}`}>
          {eyebrow ? (
            <p className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
              <span className="h-px w-6 bg-accent/60" aria-hidden />
              {eyebrow}
            </p>
          ) : null}
            <h2 className="mt-3 text-balance font-display text-[32px] font-medium leading-[1.04] tracking-[-0.028em] text-hi sm:text-[46px] lg:text-[58px]">
              {title}
            </h2>
            {description ? (
                <p className="mt-5 max-w-[580px] text-pretty text-[16px] font-normal leading-[26px] text-mid sm:text-[19px] sm:leading-[30.4px] sm:tracking-[-0.015em]">
                  {description}
                </p>
      ) : null}
              </Reveal>
            );
}
