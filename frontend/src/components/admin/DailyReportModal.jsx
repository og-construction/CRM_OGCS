import React from "react";

const DailyReportModal = ({ open, onClose, report }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="absolute left-1/2 top-1/2 w-[95%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="font-semibold text-slate-800">Daily Report Details</div>
            <div className="text-xs text-slate-500">
              {report?._id ? `ID: ${report._id}` : ""}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-3">
          {!report ? (
            <p className="text-sm text-slate-500">No report data.</p>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Report Date</div>
                  <div className="font-medium">{report.reportDate}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Member</div>
                  <div className="font-medium">{report.memberName}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Word Count</div>
                  <div className="font-medium">{report.wordCount}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Created At</div>
                  <div className="font-medium">
                    {report.createdAt ? new Date(report.createdAt).toLocaleString() : "-"}
                  </div>
                </div>
              </div>

              {report.attachment?.url ? (
                <div className="text-sm">
                  <div className="text-xs text-slate-500 mb-1">Attachment</div>
                  <a
                    href={report.attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 underline"
                  >
                    View Attachment
                  </a>
                </div>
              ) : null}

              <div>
                <div className="text-xs text-slate-500 mb-1">Report Text</div>
                <div className="text-sm text-slate-700 whitespace-pre-wrap border rounded-lg p-3 bg-slate-50">
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

export default DailyReportModal;
