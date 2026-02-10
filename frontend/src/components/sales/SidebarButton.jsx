// src/components/sales/SidebarButton.jsx
import React from "react";

/**
 * SidebarButton (UI-only update)
 * ✅ Uses ONLY allowed colors
 * ✅ Fully responsive (mobile/tablet/desktop)
 * ✅ Touch-friendly for all phones (Samsung/iPhone etc.)
 * ❌ No logic changes
 */

const cn = (...a) => a.filter(Boolean).join(" ");

const SidebarButton = ({ label, active, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative w-full text-left",
        // spacing + tap target
        "px-3 py-2.5 sm:px-4 sm:py-3",
        // container
        "rounded-2xl border border-slate-200",
        // base transitions
        "transition-all duration-200",
        // accessibility
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-600/20",
        // active press on touch devices
        "active:scale-[0.99]",
        // responsive text safety (no overflow on small screens)
        "whitespace-normal break-words",
        // states
        active ? "bg-blue-600 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
      )}
      aria-current={active ? "page" : undefined}
    >
      {/* Subtle background layer (no new colors) */}
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
          active ? "opacity-100" : "group-hover:opacity-100"
        )}
      >
        {/* keep within allowed palette using slate/blue only via opacity */}
        <span className="absolute inset-0 rounded-2xl bg-slate-50 opacity-0 group-hover:opacity-100" />
        <span className={cn("absolute inset-0 rounded-2xl", active ? "bg-slate-100 opacity-10" : "opacity-0")} />
      </span>

      <span className="relative flex items-center gap-3">
        {/* Left indicator */}
        <span
          aria-hidden="true"
          className={cn(
            "relative h-3 w-3 shrink-0 rounded-full",
            "ring-4 ring-transparent transition-all duration-200",
            active
              ? "bg-green-600 ring-green-600/20"
              : "bg-slate-400 group-hover:bg-orange-500 group-hover:ring-orange-500/20"
          )}
        >
          {active ? <span className="absolute inset-0 rounded-full animate-ping bg-green-600/50" /> : null}
        </span>

        {/* Label area */}
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              "block font-extrabold tracking-tight",
              // responsive font sizing
              "text-[13px] sm:text-[14px] md:text-[15px]",
              // prevent overflow on tiny phones
              "truncate sm:whitespace-normal sm:break-words",
              active ? "text-white" : "text-slate-900"
            )}
            title={typeof label === "string" ? label : undefined}
          >
            {label}
          </span>

          {/* helper text (hidden on very tiny screens) */}
          <span
            className={cn(
              "mt-0.5 block",
              "text-[11px] sm:text-[12px]",
              "text-slate-600",
              "group-hover:text-slate-900",
              // compact on xs devices
              "hidden xs:block",
              active ? "text-white/80" : "text-slate-600"
            )}
          >
            Tap to open
          </span>
        </span>

        {/* Right action (touch-safe, never overflow) */}
        <span
          aria-hidden="true"
          className={cn(
            "shrink-0 inline-flex items-center justify-center",
            // responsive size: slightly bigger on desktop
            "h-9 w-9 sm:h-9 sm:w-9 md:h-10 md:w-10",
            "rounded-xl border border-slate-200",
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
