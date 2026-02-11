import React, { useMemo } from "react";
import { FiFileText, FiPaperclip, FiEye, FiCalendar, FiUser } from "react-icons/fi";

const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") || "http://localhost:3181";

const cn = (...a) => a.filter(Boolean).join(" ");

const makeFileUrl = (u) => {
  if (!u) return "";
  if (u.startsWith("http")) return u;
  return `${API_ORIGIN}${u}`;
};

export default function DailyReportTable({ reports = [], loading = false, onView }) {
  const rows = useMemo(() => reports || [], [reports]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 text-sm text-slate-500">
        Loading reports...
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 text-sm text-slate-500">
        No reports found.
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* ✅ Desktop Table (md+) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr className="text-slate-600">
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Member</th>
              <th className="px-4 py-3 text-left font-semibold">Attachment</th>
              <th className="px-4 py-3 text-left font-semibold">Preview</th>
              <th className="px-4 py-3 text-left font-semibold w-[110px]">Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => {
              const fileUrl = makeFileUrl(r?.attachment?.url);
              const text = String(r?.reportText || "");
              const preview = text.slice(0, 90);

              return (
                <tr
                  key={r._id}
                  className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3 whitespace-nowrap text-slate-800">
                    {r.reportDate || "-"}
                  </td>

                  <td className="px-4 py-3 text-slate-800">
                    <div className="font-medium">{r.memberName || "-"}</div>
                    {r.createdAt ? (
                      <div className="text-xs text-slate-500">
                        Created: {new Date(r.createdAt).toLocaleString()}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-3">
                    {fileUrl ? (
                      <a
                        className="inline-flex items-center gap-2 text-sky-700 hover:underline"
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
                    <div className="inline-flex items-start gap-2">
                      <FiFileText className="text-slate-400 mt-0.5" />
                      <span className="leading-relaxed">
                        {preview || "—"}
                        {text.length > 90 ? "…" : ""}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => onView?.(r)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2",
                        "text-xs px-3 py-2 rounded-xl",
                        "border border-slate-200 bg-white hover:bg-slate-50 transition"
                      )}
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

      {/* ✅ Mobile Cards (<md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {rows.map((r) => {
          const fileUrl = makeFileUrl(r?.attachment?.url);
          const text = String(r?.reportText || "");
          const preview = text.slice(0, 140);

          return (
            <div key={r._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {r.memberName || "—"}
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <FiCalendar />
                      {r.reportDate || "-"}
                    </span>

                    {r.createdAt ? (
                      <span className="inline-flex items-center gap-1">
                        <FiUser />
                        {new Date(r.createdAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  onClick={() => onView?.(r)}
                  className={cn(
                    "shrink-0 inline-flex items-center gap-2",
                    "text-xs px-3 py-2 rounded-xl",
                    "border border-slate-200 bg-white hover:bg-slate-50 transition"
                  )}
                >
                  <FiEye />
                  View
                </button>
              </div>

              <div className="mt-3 text-sm text-slate-600">
                <div className="inline-flex items-start gap-2">
                  <FiFileText className="text-slate-400 mt-0.5" />
                  <span className="leading-relaxed">
                    {preview || "—"}
                    {text.length > 140 ? "…" : ""}
                  </span>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500">Attachment</div>

                {fileUrl ? (
                  <a
                    className="inline-flex items-center gap-2 text-xs text-sky-700 border border-slate-200 rounded-xl px-3 py-2 hover:bg-slate-50 transition"
                    href={fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    title={r?.attachment?.originalName || "Attachment"}
                  >
                    <FiPaperclip />
                    Open
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
