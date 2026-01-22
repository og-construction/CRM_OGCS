// src/components/sales/SidebarButton.jsx
import React from "react";

/**
 * SidebarButton (UI-only update)
 * ✅ Uses ONLY allowed colors
 * ✅ Mobile + desktop responsive
 * ❌ No logic changes
 */
const SidebarButton = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={[
        "group relative w-full text-left",
        "px-3 py-2.5 sm:px-4 sm:py-3",
        "rounded-2xl border border-slate-200",
        "transition-all duration-200",
        "active:scale-[0.99]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20",

        // base states
        active
          ? "bg-blue-600 text-white"
          : "bg-white text-slate-900 hover:bg-slate-50",

        // mobile safety
        "whitespace-normal break-words leading-snug",
      ].join(" ")}
    >
      {/* Soft glow (allowed colors only) */}
      <span
        aria-hidden="true"
        className={[
          "pointer-events-none absolute inset-0 rounded-2xl opacity-0 blur-lg transition-opacity duration-300",
          active ? "opacity-100" : "group-hover:opacity-50",
        ].join(" ")}
        style={{
          background: "rgba(37, 99, 235, 0.15)", // blue-600 soft glow
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
              ? "bg-green-600 ring-green-600/20"
              : "bg-slate-400 group-hover:bg-orange-500 group-hover:ring-orange-500/20",
          ].join(" ")}
        >
          {active ? (
            <span className="absolute inset-0 rounded-full animate-ping bg-green-600/50" />
          ) : null}
        </span>

        {/* Label */}
        <span className="min-w-0 flex-1">
          <span
            className={[
              "block font-semibold tracking-tight",
              "text-sm sm:text-[15px]",
              active ? "text-white" : "text-slate-900",
            ].join(" ")}
          >
            {label}
          </span>
          <span
            className={[
              "mt-0.5 block text-[11px] sm:text-[12px]",
              active ? "text-white/80" : "text-slate-600 group-hover:text-slate-900",
            ].join(" ")}
          >
            Tap to open
          </span>
        </span>

        {/* Right arrow pill */}
        <span
          aria-hidden="true"
          className={[
            "shrink-0 inline-flex items-center justify-center",
            "h-8 w-8 rounded-xl border border-slate-200",
            "transition-all duration-200",
            active
              ? "bg-white text-blue-600"
              : "bg-slate-100 text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-900",
          ].join(" ")}
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
