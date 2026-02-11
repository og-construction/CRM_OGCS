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
  FiDownload,
  FiSearch,
  FiRefreshCw,
  FiCalendar,
  FiFileText,
  FiX,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");
const fmtToday = () => new Date().toISOString().slice(0, 10);

const isAdminUser = (u) => {
  const role = String(u?.role || u?.userRole || u?.type || "").toLowerCase();
  return role === "admin" || role === "super admin" || role === "superadmin";
};

export default function DailyReportsSection() {
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

  // ✅ Filters
  const [date, setDate] = useState(fmtToday());
  const [allDates, setAllDates] = useState(false);
  const [q, setQ] = useState("");

  // ✅ Pagination
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

  // ✅ Params: send date only when not "All Dates"
  const params = useMemo(() => {
    const p = { page, limit };
    if (q?.trim()) p.q = q.trim();
    if (!allDates) p.date = date;
    return p;
  }, [page, limit, q, date, allDates]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/daily-reports", { params });
      setReports(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
      setReports([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
      setError(e?.response?.data?.message || "Failed to load daily reports.");
    } finally {
      setLoading(false);
    }
  }, [params, page, limit]);

  // ✅ Auto refetch whenever params change (q/date/allDates/page/limit)
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ✅ Search: reset to page 1 (fetch will happen via params change)
  const applySearch = useCallback(() => {
    setPage(1);
  }, []);

  const resetFilters = useCallback(() => {
    setQ("");
    setAllDates(false);
    setDate(fmtToday());
    setPage(1);
  }, []);

  // ✅ Exports
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
    XLSX.utils.book_append_sheet(wb, ws, "DailyReports");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `DailyReports_${allDates ? "ALL" : date}.xlsx`
    );
  }, [reports, allDates, date]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text(`Daily Reports - ${allDates ? "ALL DATES" : date}`, 14, 12);

    autoTable(doc, {
      startY: 18,
      head: [["Date", "Member", "Words", "Created At", "Attachment", "Report Text"]],
      body: (reports || []).map((r) => [
        r.reportDate || "",
        r.memberName || "",
        String(r.wordCount ?? ""),
        r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
        r?.attachment?.url ? "Yes" : "No",
        (r.reportText || "").slice(0, 120),
      ]),
      styles: { fontSize: 8 },
    });

    doc.save(`DailyReports_${allDates ? "ALL" : date}.pdf`);
  }, [reports, allDates, date]);

  return (
    <div className="space-y-4">
      {/* ✅ Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
              <FiFileText className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-semibold text-slate-800 truncate">
                Daily Reports
              </div>
              <div className="text-xs text-slate-500">
                {allDates ? "Showing: All Dates" : `Showing date: ${date}`}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
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

      {/* ✅ Filters Card */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Search */}
          <div className="lg:col-span-6">
            <label className="text-xs text-slate-500 flex items-center gap-2">
              <FiSearch /> Search
            </label>
            <div className="mt-1 flex flex-col sm:flex-row gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search member / report text..."
                className={cn(
                  "w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white"
                )}
              />
              <button
                onClick={applySearch}
                className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition"
              >
                <FiSearch /> Search
              </button>
            </div>
          </div>

          {/* Date + All Dates */}
          <div className="lg:col-span-4">
            <label className="text-xs text-slate-500 flex items-center gap-2">
              <FiCalendar /> Date Filter
            </label>

            <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="date"
                value={date}
                disabled={allDates}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className={cn(
                  "w-full sm:w-[190px] text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white",
                  allDates && "opacity-50 cursor-not-allowed"
                )}
              />

              <label className="inline-flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={allDates}
                  onChange={(e) => {
                    setAllDates(e.target.checked);
                    setPage(1);
                  }}
                  className="accent-sky-600"
                />
                All Dates
              </label>
            </div>
          </div>

          {/* Rows + Reset */}
          <div className="lg:col-span-2 flex flex-col sm:flex-row lg:flex-col lg:items-end gap-2 lg:justify-end">
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

            <button
              onClick={resetFilters}
              className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
              title="Reset filters"
            >
              <FiX /> Reset
            </button>
          </div>
        </div>

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

      {/* ✅ Pagination (mobile friendly) */}
      <div className="bg-white border border-slate-100 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs sm:text-sm text-slate-500">
            Total:{" "}
            <span className="text-slate-800 font-semibold">
              {pagination.total || 0}
            </span>{" "}
            <span className="mx-1">•</span>
            Page{" "}
            <span className="text-slate-800 font-semibold">
              {pagination.page || page}
            </span>{" "}
            of{" "}
            <span className="text-slate-800 font-semibold">{totalPages}</span>
          </div>

          <div className="flex items-center justify-end gap-2">
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
      <DailyReportModal
        open={open}
        onClose={() => setOpen(false)}
        report={selected}
      />
    </div>
  );
}
