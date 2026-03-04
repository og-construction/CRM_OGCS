// ✅ src/components/sales/SidebarButton.jsx
import React from "react";

/**
 * SidebarButton (UI-only update)
 * ✅ Uses ONLY allowed colors
 * ✅ Fully responsive (mobile/tablet/desktop)
 * ✅ Touch-friendly (44px+ targets) for all phones
 * ❌ No logic changes
 */

const cn = (...a) => a.filter(Boolean).join(" ");

const SidebarButton = ({ label, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative w-full text-left select-none",
        // ✅ Touch target (mobile first)
        "min-h-[48px] px-3 py-3 sm:px-4 sm:py-3.5",
        // ✅ Container + safe layout
        "rounded-2xl border border-slate-200 overflow-hidden",
        // ✅ Professional transitions
        "transition-all duration-200",
        // ✅ Focus ring (accessibility)
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20",
        // ✅ Press feedback (touch)
        "active:scale-[0.99]",
        // ✅ State colors
        active ? "bg-blue-600 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
      )}
    >
      {/* Subtle background layer (allowed palette only) */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          "opacity-0 transition-opacity duration-200",
          active ? "opacity-100" : "group-hover:opacity-100"
        )}
      >
        {/* very light hover tint */}
        <span className={cn("absolute inset-0", active ? "bg-slate-100/10" : "bg-slate-50")} />
      </span>

      {/* Left accent bar (CRM feel) */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute left-0 top-0 h-full w-1.5",
          "transition-all duration-200",
          active ? "bg-green-600" : "bg-slate-100 group-hover:bg-orange-500"
        )}
      />

      <span className="relative flex items-center gap-3">
        {/* Status dot */}
        <span
          aria-hidden="true"
          className={cn(
            "relative shrink-0 rounded-full",
            // responsive dot size
            "h-3 w-3 sm:h-3.5 sm:w-3.5",
            // ring + transitions
            "ring-4 ring-transparent transition-all duration-200",
            active
              ? "bg-green-600 ring-green-600/20"
              : "bg-slate-400 group-hover:bg-orange-500 group-hover:ring-orange-500/20"
          )}
        >
          {active ? (
            <span className="absolute inset-0 rounded-full animate-ping bg-green-600/50" />
          ) : null}
        </span>

        {/* Text */}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block font-extrabold tracking-tight leading-tight",
              // ✅ responsive sizing
              "text-[13px] sm:text-[14px] md:text-[15px]",
              // ✅ safe wrapping on tiny phones
              "break-words",
              // ✅ nicer truncation only on larger screens
              "sm:line-clamp-2",
              active ? "text-white" : "text-slate-900"
            )}
            title={typeof label === "string" ? label : undefined}
          >
            {label}
          </span>

          {/* Helper text: hide on very small, show from sm */}
          <span
            className={cn(
              "mt-0.5 hidden sm:block text-[12px] leading-snug",
              active ? "text-white/80" : "text-slate-600 group-hover:text-slate-900"
            )}
          >
            Tap to open
          </span>
        </span>

        {/* Right chevron (44px touch safe, never overflow) */}
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 inline-flex items-center justify-center",
            // ✅ touch target
            "h-11 w-11 sm:h-10 sm:w-10",
            "rounded-2xl border border-slate-200",
            "transition-all duration-200",
            active
              ? "bg-white text-blue-600"
              : "bg-slate-100 text-slate-400 group-hover:bg-slate-50 group-hover:text-slate-900"
          )}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-90">
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