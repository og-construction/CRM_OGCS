import React from "react";
import { FiFileText, FiPaperclip, FiEye } from "react-icons/fi";

const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:3181";

const makeFileUrl = (u) => {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${API_ORIGIN}${u}`;
};

export default function DailyReportTable({
  reports = [],
  loading = false,
  onView,
}) {
  if (loading) {
    return (
      <div className="bg-white border rounded-2xl p-4 text-sm text-slate-500">
        Loading reports...
      </div>
    );
  }

  if (!reports.length) {
    return (
      <div className="bg-white border rounded-2xl p-4 text-sm text-slate-500">
        No reports found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr className="text-slate-600">
            <th className="px-4 py-3 text-left">Date</th>
            <th className="px-4 py-3 text-left">Member</th>
            <th className="px-4 py-3 text-left">Words</th>
            <th className="px-4 py-3 text-left">Attachment</th>
            <th className="px-4 py-3 text-left">Preview</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {reports.map((r) => {
            const fileUrl = makeFileUrl(r?.attachment?.url);
            const preview = (r?.reportText || "").slice(0, 80);

            return (
              <tr key={r._id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                <td className="px-4 py-3 whitespace-nowrap">{r.reportDate || "-"}</td>
                <td className="px-4 py-3">{r.memberName || "-"}</td>
                <td className="px-4 py-3">{r.wordCount ?? "-"}</td>

                <td className="px-4 py-3">
                  {fileUrl ? (
                    <a
                      className="inline-flex items-center gap-2 text-blue-600 hover:underline"
                      href={fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      title={r?.attachment?.originalName || "Attachment"}
                    >
                      <FiPaperclip />
                      View
                    </a>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                <td className="px-4 py-3 text-slate-600">
                  <span className="inline-flex items-center gap-2">
                    <FiFileText className="text-slate-400" />
                    {preview || "—"}
                    {(r?.reportText || "").length > 80 ? "…" : ""}
                  </span>
                </td>

                <td className="px-4 py-3">
                  <button
                    onClick={() => onView?.(r)}
                    className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                  >
                    <FiEye />
                    View
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
