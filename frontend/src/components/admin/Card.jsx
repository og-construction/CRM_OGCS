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
        "rounded-2xl bg-white border border-slate-100 shadow-sm",
        "p-4 sm:p-5",
        className
      )}
    >
      {(title || subtitle || right) && (
        <header className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            {title ? (
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                {title}
              </h2>
            ) : null}

            {subtitle ? (
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 line-clamp-2">
                {subtitle}
              </p>
            ) : null}
          </div>

          {right ? <div className="shrink-0">{right}</div> : null}
        </header>
      )}

      <div className={cn("mt-3", bodyClassName)}>{children}</div>
    </section>
  );
}
