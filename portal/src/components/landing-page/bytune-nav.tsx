"use client";

import React, { useRef } from "react";

export function ByTuneNav() {
  const ghRef = useRef<HTMLAnchorElement>(null);
  const dlRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (
    e: React.MouseEvent<HTMLElement>,
    ref: React.RefObject<HTMLElement | null>,
  ) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    ref.current.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    ref.current.style.setProperty("--my", `${e.clientY - rect.top}px`);
  };

  return (
    <div className="w-full flex justify-center py-4 px-3 font-sans">
      <style>{`
        :root {
          --text-hi: #f5f5f8;
          --text-mid: #b6b6c2;
          --text-low: #8a8a97;
          --text-faint: #60606c;
          --hairline-strong: rgba(255, 255, 255, 0.16);
          --glass-strong: rgba(255, 255, 255, 0.07);
        }

        /* div.Nav_inner__asKaF · exact dimensions: 1020 × 56 px */
        .Nav_inner__asKaF.sp-e1 {
          display: flex;
          position: relative;
          box-sizing: border-box;
          width: 1020px;
          max-width: 100%;
          height: 56px;
          padding: 8px 18px;
          margin: 0 auto;
          border-radius: 999px;
          align-items: center;
          justify-content: space-between;
          gap: 28px;
          row-gap: 28px;
          column-gap: 28px;
          color: rgb(245, 245, 248);
          font-family: Inter, "Inter Fallback", system-ui, -apple-system, "Segoe UI", sans-serif;
          font-size: 16px;
          line-height: 25.6px;
          background: rgba(14, 14, 18, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 1px 0 0 rgba(255, 255, 255, 0.06) inset, 0 16px 36px -12px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        @media (min-width: 1536px) {
          .Nav_inner__asKaF.sp-e1 {
            margin: 0 239px;
          }
        }

        .sp-e2 {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          transform: matrix(0.86, 0, 0, 0.86, 0, 0);
          transform-origin: 0px 13px;
          cursor: pointer;
          text-decoration: none;
        }

        .sp-e3 {
          display: flex;
          align-items: center;
          gap: 8px;
          row-gap: 8px;
          column-gap: 8px;
        }

        .sp-e4 {
          display: block;
          overflow: clip;
          flex-shrink: 0;
          aspect-ratio: auto 26 / 26;
        }

        .sp-e5 {
          display: block;
          overflow: clip;
          flex-shrink: 0;
          transform: matrix(1, 0, 0, 1, 0, 1.8);
          transform-origin: 36.4375px 9.5px;
        }

        .sp-e6 {
          display: flex;
          align-items: center;
          margin-right: 16.4625px;
          margin-left: 16.4625px;
          gap: 4px;
          row-gap: 4px;
          column-gap: 4px;
          transform: matrix(1, 0, 0, 1, 0, 0);
          transform-origin: 246px 19.2px;
        }

        .sp-e7 {
          display: block;
          color: rgb(182, 182, 194);
          font-size: 14px;
          font-weight: 500;
          line-height: 22.4px;
          padding-top: 8px;
          padding-right: 14px;
          padding-bottom: 8px;
          padding-left: 14px;
          border-radius: 999px;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s ease, background-color 0.15s ease;
          white-space: nowrap;
        }

        .sp-e8 {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          gap: 10px;
          row-gap: 10px;
          column-gap: 10px;
        }

        .sp-e9 {
          display: inline-flex;
          position: relative;
          overflow: hidden;
          color: rgb(182, 182, 194);
          background-color: rgba(255, 255, 255, 0.04);
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
          row-gap: 7px;
          column-gap: 7px;
          cursor: pointer;
          text-decoration: none;
          transition: color 0.15s ease, border-color 0.15s ease, background 0.15s ease;
          white-space: nowrap;
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
            rgba(143, 139, 255, 0.22),
            transparent 70%
          );
        }

        .Nav_gh__vzMpe.pill-glow:hover::before {
          opacity: 1;
        }

        .sp-e10 {
          display: block;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sp-e11 {
          display: block;
          overflow: hidden;
          opacity: 0.9;
          margin-left: -1px;
          flex-shrink: 0;
        }

        .sp-e12 {
          display: flex;
          position: relative;
        }

        .sp-e13 {
          display: inline-flex;
          position: relative;
          overflow: hidden;
          color: rgb(10, 10, 12);
          background-color: rgb(255, 255, 255);
          font-size: 15px;
          font-weight: 600;
          line-height: 24px;
          letter-spacing: -0.15px;
          white-space: nowrap;
          border-radius: 999px;
          align-items: center;
          justify-content: center;
          height: 40px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
        }

        .DownloadSplit_pillSplit__0QzLR::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.3s ease;
          background: radial-gradient(
            var(--glow-d, 613px) circle at var(--mx, 50%) var(--my, 50%),
            rgba(255, 255, 255, 0.5),
            transparent 70%
          );
        }

        .DownloadSplit_pillSplit__0QzLR:hover::before {
          opacity: 1;
        }

        .sp-e14 {
          display: flex;
          color: rgb(10, 10, 12);
          font-size: 14px;
          font-weight: 600;
          line-height: 22.4px;
          height: 100%;
          padding-right: 14px;
          padding-left: 18px;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          text-decoration: none;
          transition: opacity 0.15s ease;
        }

        .sp-e14:hover {
          opacity: 0.88;
        }

        .sp-e15 {
          display: block;
          overflow: hidden;
          flex-shrink: 0;
        }

        .sp-e16 {
          display: flex;
          position: relative;
          background: none;
          border: none;
          color: rgb(10, 10, 12);
          text-align: center;
          height: 100%;
          padding-left: 8px;
          padding-right: 14px;
          border-left: 1px solid rgba(10, 10, 12, 0.12);
          border-radius: 0px 999px 999px 0px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }

        .sp-e16:focus-visible {
          outline: 2px solid #8f8bff;
          outline-offset: -2px;
        }

        .sp-e16:hover {
          background-color: rgba(0, 0, 0, 0.06);
        }

        .Nav_link__zheGr:hover {
          color: var(--text-hi);
          background: rgba(255, 255, 255, 0.06);
        }

        .Nav_gh__vzMpe.pill-glow.sp-e9:hover {
          color: var(--text-hi);
          border-color: var(--hairline-strong);
          background: var(--glass-strong);
        }

        @media (max-width: 880px) {
          .Nav_gh__vzMpe, .Nav_links__TBJFU {
            display: none !important;
          }
          .Nav_inner__asKaF.sp-e1 {
            padding-left: 14px;
            padding-right: 14px;
            width: 100%;
            height: 52px;
          }
        }
      `}</style>

      <div className="Nav_inner__asKaF sp-e1">
        <a href="https://bytune.space/#top" className="Nav_brand__wEZMt sp-e2" aria-label="ByTune, back to top">
          <span className="BrandLockup_lockup__x0MoE sp-e3" style={{ gap: "0.5rem" }} aria-hidden="true">
            <img
              src="https://bytune.space/brand/bytune-logo.svg"
              alt=""
              width="22"
              height="22"
              style={{ width: "1.625rem", height: "1.625rem" }}
              data-image="1"
              className="sp-e4"
            />
            <img
              src="https://bytune.space/brand/bytune-Text.svg"
              alt=""
              style={{ height: "1.1875rem", width: "auto", transform: "translateY(0.1125rem)" }}
              data-image="2"
              width="63"
              height="16"
              className="sp-e5"
            />
          </span>
        </a>
        <nav className="Nav_links__TBJFU sp-e6" aria-label="Primary">
          <a href="https://bytune.space/#features" className="Nav_link__zheGr sp-e7">Features</a>
          <a href="https://bytune.space/#showcase" className="Nav_link__zheGr sp-e7">Inside</a>
          <a href="https://bytune.space/#lyrics" className="Nav_link__zheGr sp-e7">Lyrics</a>
          <a href="https://bytune.space/#playback" className="Nav_link__zheGr sp-e7">Playback</a>
          <a href="https://bytune.space/#download" className="Nav_link__zheGr sp-e7">Download</a>
          <a href="https://bytune.space/#faq" className="Nav_link__zheGr sp-e7">FAQ</a>
        </nav>
        <div className="Nav_actions__Llzp1 sp-e8">
          <a
            ref={ghRef}
            href="https://github.com/rishiteja21/ByTune"
            target="_blank"
            rel="noreferrer"
            onMouseMove={(e) => handleMouseMove(e, ghRef)}
            className="Nav_gh__vzMpe pill-glow sp-e9"
            title="Star ByTune on GitHub"
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
              data-image="3"
              className="sp-e10"
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
              className="Nav_ghStar__Of1VG sp-e11"
              data-image="4"
            >
              <path d="M12 3.2l2.6 5.36 5.9.83-4.27 4.1 1.03 5.86L12 16.55l-5.26 2.8 1.03-5.86L3.5 9.39l5.9-.83L12 3.2z" />
            </svg>
          </a>
          <div className="DownloadSplit_wrap__DMUZP DownloadSplit_small__RYWvF sp-e12">
            <div
              ref={dlRef}
              onMouseMove={(e) => handleMouseMove(e, dlRef)}
              className="pill pill--primary DownloadSplit_pillSplit__0QzLR sp-e13"
              style={
                {
                  "--glow-d": "613px",
                  "--mx": "-44.70000457763672px",
                  "--my": "-3.399993896484375px",
                } as React.CSSProperties
              }
            >
              <a
                className="DownloadSplit_main__RBB4M sp-e14"
                href="https://github.com/rishiteja21/ByTune/releases/latest/download/ByTune-Setup.exe"
                aria-label="Download for Windows"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ width: "0.9375rem", height: "0.9375rem" }}
                  data-image="5"
                  className="sp-e15"
                >
                  <path d="M12 4.5v10M7.5 10.5 12 15l4.5-4.5" />
                  <path d="M5 18.5h14" />
                </svg>
                Download
              </a>
              <a
                href="https://github.com/rishiteja21/ByTune/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="DownloadSplit_chev__sAQuz sp-e16"
                aria-label="Official ByTune releases and download options"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{ width: "0.875rem", height: "0.875rem" }}
                  data-image="6"
                  className="sp-e15"
                >
                  <path d="M6.5 9.5 12 15l5.5-5.5" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
