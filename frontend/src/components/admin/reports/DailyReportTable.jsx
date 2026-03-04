import React, { useMemo } from "react";
import {
  FiFileText,
  FiPaperclip,
  FiEye,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

const API_ORIGIN =
  import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:3181";

const cn = (...a) => a.filter(Boolean).join(" ");

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
  const rows = useMemo(() => reports || [], [reports]);

  if (loading) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <FiFileText className="text-slate-700" />
          </span>
          <div>
            <div className="font-semibold text-slate-800">Loading reports</div>
            <div className="text-xs text-slate-500">Please wait...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 text-sm text-slate-600">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
            <FiFileText className="text-slate-700" />
          </span>
          <div>
            <div className="font-semibold text-slate-800">No reports found</div>
            <div className="text-xs text-slate-500">
              Try changing date, search, or filters.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
      {/* ✅ Desktop Table (md+) */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50/80 backdrop-blur border-b border-slate-100 sticky top-0 z-10">
              <tr className="text-slate-600">
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Member
                </th>
                <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                  Attachment
                </th>
                <th className="px-4 py-3 text-left font-semibold">
                  Preview
                </th>
                <th className="px-4 py-3 text-right font-semibold w-[130px] whitespace-nowrap">
                  Action
                </th>
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
                      <span className="inline-flex items-center gap-2">
                        <FiCalendar className="text-slate-400" />
                        {r.reportDate || "-"}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-slate-800">
                      <div className="font-semibold truncate max-w-[260px]">
                        {r.memberName || "-"}
                      </div>
                      {r.createdAt ? (
                        <div className="text-xs text-slate-500 mt-0.5">
                          Created: {new Date(r.createdAt).toLocaleString()}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3">
                      {fileUrl ? (
                        <a
                          className={cn(
                            "inline-flex items-center gap-2",
                            "text-sky-700 hover:underline",
                            "whitespace-nowrap"
                          )}
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          title={r?.attachment?.originalName || "Attachment"}
                        >
                          <FiPaperclip />
                          Open
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      <div className="flex items-start gap-2">
                        <FiFileText className="text-slate-400 mt-0.5 shrink-0" />
                        <span className="leading-relaxed line-clamp-2 max-w-[520px]">
                          {preview || "—"}
                          {text.length > 90 ? "…" : ""}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => onView?.(r)}
                        className={cn(
                          "inline-flex items-center justify-center gap-2",
                          "text-xs px-3 py-2 rounded-xl",
                          "border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
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
      </div>

      {/* ✅ Mobile Cards (<md) */}
      <div className="md:hidden divide-y divide-slate-100">
        {rows.map((r) => {
          const fileUrl = makeFileUrl(r?.attachment?.url);
          const text = String(r?.reportText || "");
          const preview = text.slice(0, 160);

          return (
            <div key={r._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-slate-800 truncate">
                    {r.memberName || "—"}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">
                      <FiCalendar className="text-slate-400" />
                      {r.reportDate || "-"}
                    </span>

                    {r.createdAt ? (
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded-full">
                        <FiUser className="text-slate-400" />
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
                    "border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
                  )}
                >
                  <FiEye />
                  View
                </button>
              </div>

              <div className="mt-3 text-sm text-slate-700">
                <div className="flex items-start gap-2">
                  <FiFileText className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="leading-relaxed">
                    {preview || "—"}
                    {text.length > 160 ? "…" : ""}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-500">Attachment</div>

                {fileUrl ? (
                  <a
                    className={cn(
                      "inline-flex items-center justify-center gap-2",
                      "text-xs text-sky-700",
                      "border border-slate-200 rounded-xl px-3 py-2",
                      "hover:bg-slate-50 active:scale-[0.99] transition",
                      "whitespace-nowrap"
                    )}
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