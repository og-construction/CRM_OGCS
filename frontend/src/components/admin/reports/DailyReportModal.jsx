import React, { useEffect, useMemo } from "react";
import {
  FiX,
  FiExternalLink,
  FiFileText,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  window.location.origin.replace(/:\d+$/, "");

const cn = (...a) => a.filter(Boolean).join(" ");

export default function DailyReportModal({ open, onClose, report }) {
  // ✅ Escape key close
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  // ✅ Prevent body scroll when modal is open (UI only)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const fileUrl = useMemo(() => {
    const u = report?.attachment?.url;
    if (!u) return null;
    return u.startsWith("http") ? u : `${API_ORIGIN}${u}`;
  }, [report]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
      />

      {/* Center wrapper: bottom-sheet on mobile, centered dialog on desktop */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full sm:w-[92vw] max-w-4xl",
            // height rules
            "h-[92vh] sm:h-auto sm:max-h-[88vh]",
            // mobile bottom sheet
            "rounded-t-3xl sm:rounded-2xl",
            "bg-white border border-slate-100 shadow-2xl overflow-hidden",
            // subtle professional feel
            "ring-1 ring-black/5"
          )}
        >
          {/* Header (sticky) */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100">
            <div className="px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                    <FiFileText className="text-slate-700" />
                  </span>

                  <div className="min-w-0">
                    <div className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                      Daily Report Details
                    </div>

                    {report?._id ? (
                      <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                        ID: {report._id}
                      </div>
                    ) : (
                      <div className="text-[11px] sm:text-xs text-slate-500">
                        —
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "shrink-0 inline-flex items-center justify-center gap-2",
                  "h-10 sm:h-auto",
                  "text-xs sm:text-sm px-3 py-2 rounded-xl",
                  "border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
                )}
              >
                <FiX />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Body (scroll area) */}
          <div className="p-4 sm:p-6 overflow-auto h-[calc(92vh-136px)] sm:h-auto sm:max-h-[calc(88vh-140px)]">
            {!report ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm text-slate-600">No report data found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Meta cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <MetaCard
                    Icon={FiCalendar}
                    label="Report Date"
                    value={report.reportDate || "-"}
                  />
                  <MetaCard
                    Icon={FiUser}
                    label="Member Name"
                    value={report.memberName || "-"}
                  />
                  <MetaCard
                    Icon={FiFileText}
                    label="Created At"
                    value={
                      report.createdAt
                        ? new Date(report.createdAt).toLocaleString()
                        : "-"
                    }
                  />
                </div>

                {/* Attachment */}
                <div className="rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs text-slate-500">Attachment</div>
                      <div className="text-sm text-slate-800 font-semibold">
                        {fileUrl ? "Available" : "Not attached"}
                      </div>

                      {(report?.attachment?.originalName ||
                        report?.attachment?.filename) && (
                        <div className="text-xs text-slate-500 truncate mt-1">
                          {report.attachment.originalName ||
                            report.attachment.filename}
                        </div>
                      )}
                    </div>

                    {fileUrl ? (
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(
                          "inline-flex items-center justify-center gap-2",
                          "w-full sm:w-auto",
                          "text-xs sm:text-sm px-3 py-2.5 rounded-xl",
                          "border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition",
                          "text-sky-700"
                        )}
                      >
                        <FiExternalLink />
                        View
                      </a>
                    ) : null}
                  </div>
                </div>

                {/* Report Content */}
                <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="text-xs text-slate-500">
                        Report Content
                      </div>
                    </div>
                    {!!report?.wordCount && (
                      <div className="text-xs text-slate-500">
                        Words:{" "}
                        <span className="text-slate-800 font-semibold">
                          {report.wordCount}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div
                      className={cn(
                        "text-sm text-slate-700 whitespace-pre-wrap leading-relaxed",
                        "bg-slate-50 border border-slate-100 rounded-xl",
                        "p-4",
                        // more flexible height by device
                        "max-h-[52vh] sm:max-h-[420px] overflow-auto"
                      )}
                    >
                      {report.reportText || "-"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer (sticky + mobile full-width buttons) */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100">
            <div className="px-4 sm:px-6 py-4 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "w-full sm:w-auto",
                  "text-xs sm:text-sm px-4 py-2.5 rounded-xl",
                  "border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
                )}
              >
                <FiX />
                Close
              </button>
            </div>
          </div>

          {/* Mobile drag handle look (pure UI) */}
          <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

function MetaCard({ Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
          <Icon className="text-slate-700" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-sm font-semibold text-slate-800 truncate">
            {value || "-"}
          </div>
        </div>
      </div>
    </div>
  );
}