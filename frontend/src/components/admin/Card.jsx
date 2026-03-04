// src/components/admin/Card.jsx
import React from "react";

const cn = (...a) => a.filter(Boolean).join(" ");

export default function Card({
  title,
  subtitle,
  right,
  children,
  className = "",
  bodyClassName = "",
}) {
  return (
    <section
      className={cn(
        "w-full",
        // ✅ Pro CRM card look (clean + subtle depth)
        "rounded-2xl bg-white border border-slate-200/70 shadow-sm",
        "ring-1 ring-black/5",
        // ✅ Responsive padding
        "p-4 sm:p-5 lg:p-6",
        // ✅ Subtle hover for dashboard feel (safe even if not clickable)
        "transition-shadow hover:shadow-md",
        className
      )}
    >
      {(title || subtitle || right) ? (
        <header
          className={cn(
            "flex flex-col gap-3",
            "sm:flex-row sm:items-start sm:justify-between"
          )}
        >
          {/* Left: Title + Subtitle */}
          <div className="min-w-0">
            {title ? (
              <h2
                className={cn(
                  "text-base sm:text-lg",
                  "font-semibold text-slate-900",
                  "leading-tight",
                  "truncate"
                )}
              >
                {title}
              </h2>
            ) : null}

            {subtitle ? (
              <p
                className={cn(
                  "mt-1",
                  "text-xs sm:text-sm text-slate-600",
                  "leading-relaxed",
                  // better truncation on dashboards
                  "line-clamp-2"
                )}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          {/* Right: Actions (buttons, filters, etc.) */}
          {right ? (
            <div className="shrink-0">
              {/* ✅ On mobile: full width; on sm+: natural width */}
              <div className="w-full sm:w-auto">{right}</div>
            </div>
          ) : null}
        </header>
      ) : null}

      {/* Body */}
      <div className={cn("mt-4 sm:mt-5", bodyClassName)}>{children}</div>
    </section>
  );
}