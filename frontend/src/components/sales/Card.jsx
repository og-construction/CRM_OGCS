// src/components/.../Card.jsx
import React from "react";

const Card = ({ title, children, right }) => (
  <div
    className="
      bg-white/90 backdrop-blur
      border border-slate-200/70
      rounded-2xl
      shadow-sm
      hover:shadow-md hover:-translate-y-[1px]
      transition
      p-3 sm:p-4 md:p-5
      mb-3 sm:mb-4
    "
  >
    {/* Header */}
    {title ? (
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug truncate">
            {title}
          </h2>
          <div className="h-[2px] w-10 mt-2 rounded-full bg-gradient-to-r from-sky-500 to-indigo-500" />
        </div>

        {/* Optional right slot (icons/buttons) */}
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    ) : null}

    {/* Content */}
    <div className="text-sm text-slate-700">{children}</div>
  </div>
);

export default Card;
