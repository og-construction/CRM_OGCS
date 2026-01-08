import React from "react";

const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:3181";

const DailyReportModal = ({ open, onClose, report }) => {
  if (!open) return null;

  const fileUrl =
    report?.attachment?.url
      ? report.attachment.url.startsWith("http")
        ? report.attachment.url
        : `${API_ORIGIN}${report.attachment.url}`
      : "";

  return (
    <div className="fixed inset-0 z-50">
      {/* backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* modal */}
      <div className="absolute left-1/2 top-1/2 w-[95%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white shadow-2xl border border-slate-100">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div>
            <div className="font-semibold text-slate-800">Daily Report Details</div>
            <div className="text-xs text-slate-500">{report?._id ? `ID: ${report._id}` : ""}</div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition"
          >
            Close
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!report ? (
            <p className="text-sm text-slate-500">No report data.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 text-sm">
                <Info label="Report Date" value={report.reportDate} />
                <Info label="Member Name" value={report.memberName} />
                <Info label="Word Count" value={report.wordCount} />
                <Info
                  label="Created At"
                  value={report.createdAt ? new Date(report.createdAt).toLocaleString() : "-"}
                />
              </div>

              {fileUrl ? (
                <div className="text-sm">
                  <div className="text-xs text-slate-500 mb-1">Attachment</div>
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline hover:text-blue-700"
                  >
                    View Attachment
                  </a>
                  <div className="text-[11px] text-slate-500 mt-1">
                    {report?.attachment?.originalName || report?.attachment?.filename || ""}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="text-xs text-slate-500 mb-1">Report Content</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap border rounded-xl p-4 bg-slate-50 max-h-[320px] overflow-auto">
                  {report.reportText}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const Info = ({ label, value }) => (
  <div>
    <div className="text-xs text-slate-500">{label}</div>
    <div className="font-medium text-slate-800">{value || "-"}</div>
  </div>
);

export default DailyReportModal;
