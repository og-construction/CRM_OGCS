import React, { useEffect, useMemo } from "react";
import { FiX, FiExternalLink, FiFileText, FiCalendar, FiUser } from "react-icons/fi";

const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:3181";

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
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[94vw] sm:w-[92vw] max-w-4xl",
          "bg-white border border-slate-100 shadow-2xl",
          "rounded-2xl overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center">
                <FiFileText className="text-slate-700" />
              </span>
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                  Daily Report Details
                </div>
                {report?._id ? (
                  <div className="text-xs text-slate-500 truncate">
                    ID: {report._id}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">—</div>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              "shrink-0 inline-flex items-center gap-2",
              "text-xs sm:text-sm px-3 py-2 rounded-xl",
              "border border-slate-200 bg-white hover:bg-slate-50 transition"
            )}
          >
            <FiX />
            Close
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6">
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
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">Attachment</div>
                    <div className="text-sm text-slate-800 font-medium">
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
                        "shrink-0 inline-flex items-center gap-2",
                        "text-xs sm:text-sm px-3 py-2 rounded-xl",
                        "border border-slate-200 bg-white hover:bg-slate-50 transition",
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
                <div className="px-4 py-3 border-b border-slate-100">
                  <div className="text-xs text-slate-500">Report Content</div>
                </div>

                <div className="p-4">
                  <div
                    className={cn(
                      "text-sm text-slate-700 whitespace-pre-wrap",
                      "bg-slate-50 border border-slate-100 rounded-xl",
                      "p-4",
                      "max-h-[60vh] sm:max-h-[420px] overflow-auto"
                    )}
                  >
                    {report.reportText || "-"}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer (mobile friendly) */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "text-xs sm:text-sm px-4 py-2 rounded-xl",
              "border border-slate-200 bg-white hover:bg-slate-50 transition"
            )}
          >
            <FiX />
            Close
          </button>
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
