import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../../api/axiosClient";
import DailyReportTable from "./DailyReportTable";
import DailyReportModal from "./DailyReportModal";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FiCalendar,
  FiDownload,
  FiSearch,
  FiRefreshCw,
  FiX,
  FiFileText,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

const isAdminUser = (u) => {
  const role = String(u?.role || u?.userRole || u?.type || "").toLowerCase();
  return role === "admin" || role === "super admin" || role === "superadmin";
};

export default function AllReportsSection() {
  const user = useSelector((s) => s.auth.user);

  // ✅ Access control
  if (!isAdminUser(user)) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="text-lg font-semibold text-slate-800">Access Denied</div>
        <div className="text-sm text-slate-500 mt-1">
          Only Admin can view Reports.
        </div>
      </div>
    );
  }

  // ✅ Filters & pagination
  const [date, setDate] = useState(""); // optional
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // ✅ Data
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ✅ Modal
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const totalPages = pagination?.totalPages || 1;

  const params = useMemo(() => {
    const p = { page, limit, q: q?.trim() || "" };
    if (date) p.date = date;
    return p;
  }, [page, limit, q, date]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/daily-reports", { params });
      setReports(res.data?.data || []);
      setPagination(
        res.data?.pagination || { page, limit, total: 0, totalPages: 1 }
      );
    } catch (e) {
      console.error(e);
      setReports([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      setError(e?.response?.data?.message || "Failed to load reports.");
    } finally {
      setLoading(false);
    }
  }, [params, page, limit]);

  // ✅ Auto fetch when page/limit/date changes
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Search should reset page and fetch
  const applySearch = useCallback(() => {
    setPage(1);
    // fetch after state updates (same tick) — we can call directly because params uses q, not page
    // but to ensure correct page=1, do small timeout
    setTimeout(fetchData, 0);
  }, [fetchData]);

  const clearAllFilters = useCallback(() => {
    setDate("");
    setQ("");
    setPage(1);
    // fetch with cleared filters
    setTimeout(fetchData, 0);
  }, [fetchData]);

  // ✅ Export helpers
  const exportExcel = useCallback(() => {
    const rows = (reports || []).map((r, i) => ({
      "Sr No": i + 1,
      "Report Date": r.reportDate || "",
      "Member Name": r.memberName || "",
      "Word Count": r.wordCount ?? "",
      "Created At": r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
      Attachment: r?.attachment?.url ? "Yes" : "No",
      "Report Text": r.reportText || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AllReports");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `AllReports_${date || "ALL"}_page${page}.xlsx`
    );
  }, [reports, date, page]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape" });

    doc.setFontSize(12);
    doc.text(
      `All Reports ${date ? `- ${date}` : ""} (Page ${page})`,
      14,
      12
    );

    autoTable(doc, {
      startY: 18,
      head: [["Date", "Member", "Words", "Created At", "Attachment", "Report"]],
      body: (reports || []).map((r) => [
        r.reportDate || "",
        r.memberName || "",
        String(r.wordCount ?? ""),
        r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
        r?.attachment?.url ? "Yes" : "No",
        (r.reportText || "").slice(0, 140),
      ]),
      styles: { fontSize: 8 },
    });

    doc.save(`AllReports_${date || "ALL"}_page${page}.pdf`);
  }, [reports, date, page]);

  return (
    <div className="space-y-4">
      {/* ✅ Top header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
              <FiFileText className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-semibold text-slate-800 truncate">
                All Reports
              </div>
              <div className="text-xs text-slate-500">
                Search • Date filter • Export • Pagination
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Action buttons (wrap on small screens) */}
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={exportExcel}
            className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
          >
            <FiDownload /> Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
          >
            <FiDownload /> PDF
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* ✅ Filters card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          {/* Left side: date + search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:items-end gap-3">
            {/* Date */}
            <div className="min-w-0">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <FiCalendar /> Date (optional)
              </label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setPage(1);
                  }}
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-[200px] bg-white"
                />
                {date ? (
                  <button
                    onClick={() => {
                      setDate("");
                      setPage(1);
                    }}
                    className="shrink-0 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
                    title="Clear date"
                  >
                    <FiX /> Clear
                  </button>
                ) : null}
              </div>
            </div>

            {/* Search */}
            <div className="min-w-0">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <FiSearch /> Search
              </label>
              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search member / report text..."
                  className="text-sm border border-slate-200 rounded-xl px-3 py-2 w-full sm:w-[340px] bg-white"
                />
                <button
                  onClick={applySearch}
                  className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition"
                >
                  <FiSearch /> Search
                </button>
              </div>
            </div>
          </div>

          {/* Right side: rows + clear */}
          <div className="flex flex-wrap items-center gap-2 justify-between sm:justify-end">
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-2 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
              title="Clear all filters"
            >
              <FiX /> Reset
            </button>

            <div className="flex items-center gap-2">
              <div className="text-xs text-slate-500">Rows</div>
              <select
                value={limit}
                onChange={(e) => {
                  setLimit(parseInt(e.target.value, 10));
                  setPage(1);
                }}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white"
              >
                {[10, 20, 50, 100].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ✅ Info / errors */}
        {error ? (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        ) : null}
      </div>

      {/* ✅ Table */}
      <DailyReportTable
        reports={reports}
        loading={loading}
        onView={(r) => {
          setSelected(r);
          setOpen(true);
        }}
      />

      {/* ✅ Pagination footer (mobile friendly) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-slate-500">
            Total: <span className="text-slate-800 font-semibold">{pagination.total || 0}</span>{" "}
            <span className="mx-1">•</span>
            Page{" "}
            <span className="text-slate-800 font-semibold">
              {pagination.page || page}
            </span>{" "}
            of <span className="text-slate-800 font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Prev
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <span className="text-xs text-slate-500">Go to</span>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => {
                  const v = Number(e.target.value || 1);
                  if (Number.isNaN(v)) return;
                  setPage(Math.min(totalPages, Math.max(1, v)));
                }}
                className="w-20 text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white"
              />
            </div>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ✅ Modal */}
      <DailyReportModal open={open} onClose={() => setOpen(false)} report={selected} />
    </div>
  );
}
