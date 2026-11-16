"use client";

import React, { useRef } from "react";
import { COMPANY_CONTACT } from "@/lib/constants";

interface GitHubButtonProps {
  href?: string;
  className?: string;
}

export function GitHubButton({
  href = COMPANY_CONTACT.github,
  className = "",
}: GitHubButtonProps) {
  const btnRef = useRef<HTMLAnchorElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    btnRef.current.style.setProperty("--mx", `${x}px`);
    btnRef.current.style.setProperty("--my", `${y}px`);
  };

  return (
    <>
      <style>{`
        .Nav_gh__vzMpe.pill - glow.sp - e1 {
          display: inline-flex;
        position: relative;
        box-sizing: border-box;
        overflow: hidden;
        color: rgb(182, 182, 194);
        background-color: rgba(255, 255, 255, 0.04);
        font-family: Inter, "Inter Fallback", system-ui, -apple-system, "Segoe UI", sans-serif;
        font-size: 14px;
        font-weight: 500;
        line-height: 22.4px;
        height: 40px;
        padding-right: 16px;
        padding-left: 16px;
        border: 0.8px solid rgba(255, 255, 255, 0.08);
        border-radius: 999px;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        text-decoration: none;
        transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
        -webkit-font-smoothing: antialiased;
        }

        .Nav_gh__vzMpe.pill-glow::before {
          content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        background: radial-gradient(
        var(--glow-d, 471px) circle at var(--mx, 50%) var(--my, 50%),
        rgba(143, 139, 255, 0.2),
        transparent 70%
        );
        }

        .Nav_gh__vzMpe.pill-glow:hover::before {
          opacity: 1;
        }

        .sp-e2 {
          display: block;
        overflow: hidden;
        flex-shrink: 0;
        }

        .sp-e3 {
          display: block;
        overflow: hidden;
        opacity: 0.9;
        margin-left: -1px;
        flex-shrink: 0;
        }

        .Nav_gh__vzMpe.pill-glow.sp-e1:hover {
          color: var(--text-hi);
        border-color: var(--hairline-strong);
        background: var(--glass-strong);
        }

        @media (max-width: 880px) {
          .Nav_gh__vzMpe {
          display: none !important;
          }
        }
      `}</style>

      <a
        ref={btnRef}
        href={href}
        target="_blank"
        rel="noreferrer"
        onMouseMove={handleMouseMove}
        className={`Nav_gh__vzMpe pill-glow sp-e1 ${className}`}
        title="Star on GitHub"
        style={
          {
            "--glow-d": "471px",
            "--mx": "-40.400001525878906px",
            "--my": "16.600006103515625px",
          } as React.CSSProperties
        }
      >
        <svg
          width="16"
          height="16"
          style={{ width: "1rem", height: "1rem" }}
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden="true"
          data-image="1"
          className="sp-e2"
        >
          <path d="M8 0a8 8 0 0 0-2.53 15.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67.21 2.2.82a7.42 7.42 0 0 1 4 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 8 0Z" />
        </svg>
        GitHub
        <svg
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          style={{ width: "0.8125rem", height: "0.8125rem" }}
          className="Nav_ghStar__Of1VG sp-e3"
          data-image="2"
        >
          <path d="M12 3.2l2.6 5.36 5.9.83-4.27 4.1 1.03 5.86L12 16.55l-5.26 2.8 1.03-5.86L3.5 9.39l5.9-.83L12 3.2z" />
        </svg>
      </a>
    </>
  );
}
