// src/components/sales/SidebarButton.jsx
import React from "react";

/**
 * SidebarButton (premium)
 * ✅ colorful accent glow when active
 * ✅ subtle hover animation
 * ✅ works great on mobile + desktop
 */
const SidebarButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative w-full text-left",
        "px-3.5 py-2.5 sm:px-4 sm:py-3",
        "rounded-2xl border",
        "transition-all duration-200",
        "active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100",

        // base
        active
          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
          : "bg-white/90 text-slate-800 border-slate-200 hover:bg-white hover:shadow-sm",

        // prevent cutting on mobile
        "whitespace-normal break-words leading-snug",
      ].join(" ")}
    >
      {/* Gradient glow (only when active) */}
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-xl transition-opacity duration-300",
          active ? "opacity-100" : "group-hover:opacity-50",
        ].join(" ")}
        style={{
          background:
            "linear-gradient(90deg, rgba(139,0,0,0.22), rgba(244,208,63,0.18), rgba(0,32,78,0.20))",
        }}
      />

      <span className="relative flex items-center gap-3">
        {/* Indicator dot */}
        <span
          aria-hidden="true"
          className={[
            "relative h-3 w-3 shrink-0 rounded-full",
            "ring-4 ring-transparent transition-all duration-200",
            active
              ? "bg-emerald-400 ring-emerald-400/20"
              : "bg-slate-300 group-hover:bg-slate-400 group-hover:ring-slate-400/20",
          ].join(" ")}
        >
          {/* tiny pulse for active */}
          {active ? (
            <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/60" />
          ) : null}
        </span>

        {/* Label */}
        <span className="min-w-0 flex-1">
          <span
            className={[
              "block font-extrabold tracking-tight",
              "text-sm sm:text-[15px]",
              active ? "text-white" : "text-slate-900",
            ].join(" ")}
          >
            {label}
          </span>
          <span
            className={[
              "mt-0.5 block text-[11px] sm:text-[12px]",
              active ? "text-white/75" : "text-slate-500 group-hover:text-slate-600",
            ].join(" ")}
          >
            Tap to open
          </span>
        </span>

        {/* Right chevron-ish pill */}
        <span
          className={[
            "shrink-0 inline-flex items-center justify-center",
            "h-8 w-8 rounded-xl border",
            "transition-all duration-200",
            active
              ? "border-white/15 bg-white/10 text-white"
              : "border-slate-200 bg-slate-50 text-slate-500 group-hover:bg-white group-hover:text-slate-700",
          ].join(" ")}
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 18l6-6-6-6"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </button>
  );
};

export default SidebarButton;
