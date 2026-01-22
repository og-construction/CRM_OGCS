// src/components/.../Card.jsx
import React from "react";

/**
 * ✅ Professional Card UI (restricted palette)
 * Allowed colors only:
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 */

const Card = ({ title, subtitle, children, right, tone = "blue" }) => {
  const toneMap = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-500",
    orange: "bg-orange-500",
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 md:p-5 mb-3 sm:mb-4">
      {/* Header */}
      {(title || right) && (
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {title ? (
              <div className="flex items-center gap-2">
                {/* Accent bar */}
                <span className={`h-4 w-1 rounded-full ${toneMap[tone] || toneMap.blue}`} />
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug truncate">
                  {title}
                </h2>
              </div>
            ) : null}

            {subtitle ? (
              <p className="mt-1 text-xs sm:text-sm text-slate-600 truncate">
                {subtitle}
              </p>
            ) : null}
          </div>

          {/* Right slot */}
          {right ? <div className="shrink-0">{right}</div> : null}
        </div>
      )}

      {/* Content */}
      <div className="text-sm text-slate-600">{children}</div>
    </div>
  );
};

export default Card;
