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

const cn = (...a) => a.filter(Boolean).join(" ");

const Card = ({ title, subtitle, children, right, tone = "blue" }) => {
  const toneMap = {
    blue: "bg-blue-600",
    green: "bg-green-600",
    red: "bg-red-500",
    orange: "bg-orange-500",
  };

  return (
    <section
      className={cn(
        "w-full",
        "rounded-2xl border border-slate-200 bg-white",
        "shadow-sm",
        "p-4 sm:p-5",
        "mb-3 sm:mb-4",
        "transition",
        "hover:bg-slate-50"
      )}
      aria-label={title ? String(title) : "Card"}
    >
      {(title || subtitle || right) ? (
        <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <div className="flex items-start gap-3">
                {/* Accent bar */}
                <span
                  className={cn(
                    "mt-1 h-5 w-1.5 shrink-0 rounded-full",
                    toneMap[tone] || toneMap.blue
                  )}
                  aria-hidden="true"
                />

                <div className="min-w-0">
                  <h2 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug truncate">
                    {title}
                  </h2>

                  {subtitle ? (
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {subtitle}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : subtitle ? (
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2">
                {subtitle}
              </p>
            ) : null}
          </div>

          {right ? (
            <div className="shrink-0">
              {/* keep slot untouched */}
              {right}
            </div>
          ) : null}
        </header>
      ) : null}

      <div className={cn(title || subtitle || right ? "mt-4" : "", "text-sm text-slate-600")}>
        {children}
      </div>
    </section>
  );
};

export default Card;