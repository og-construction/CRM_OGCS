// SidebarButton.jsx
import React from "react";

const SidebarButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={[
      // layout + tap target (mobile friendly)
      "group w-full text-left",
      "px-3 sm:px-3.5 py-2.5",
      "rounded-2xl",
      "transition active:scale-[0.99]",
      "focus:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 focus-visible:border-sky-300",

      // prevent cutting on mobile
      "whitespace-normal break-words",
      "leading-snug",

      // base visuals
      "border",
      active
        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",

      // small typography tuning across devices
      "text-sm sm:text-[15px] font-semibold",
    ].join(" ")}
  >
    <span className="flex items-center gap-2">
      {/* small indicator for professional look */}
      <span
        className={[
          "h-2 w-2 rounded-full shrink-0",
          active ? "bg-white/90" : "bg-slate-300 group-hover:bg-slate-400",
        ].join(" ")}
        aria-hidden="true"
      />
      <span className="min-w-0">{label}</span>
    </span>
  </button>
);

export default SidebarButton;
