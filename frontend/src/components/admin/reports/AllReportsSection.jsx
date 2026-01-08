import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../../api/axiosClient";
import DailyReportTable from "./DailyReportTable";
import DailyReportModal from "./DailyReportModal";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { FiCalendar, FiDownload, FiSearch, FiRefreshCw, FiX } from "react-icons/fi";

const isAdminUser = (u) => {
  const role = String(u?.role || u?.userRole || u?.type || "").toLowerCase();
  return role === "admin" || role === "super admin" || role === "superadmin";
};

export default function AllReportsSection() {
  const user = useSelector((s) => s.auth.user);

  if (!isAdminUser(user)) {
    return (
      <div className="bg-white border rounded-2xl p-5">
        <div className="text-lg font-semibold text-slate-800">Access Denied</div>
        <div className="text-sm text-slate-500 mt-1">Only Admin can view Reports.</div>
      </div>
    );
  }

  const [date, setDate] = useState(""); // ✅ optional
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const params = useMemo(() => {
    const p = { page, limit, q };
    if (date) p.date = date; // ✅ only if chosen
    return p;
  }, [page, limit, q, date]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/daily-reports", { params });
      setReports(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e) {
      console.error(e);
      setReports([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [page, limit, date]);

  const applySearch = () => {
    setPage(1);
    fetchData();
  };

  const exportExcel = () => {
    const rows = (reports || []).map((r, i) => ({
      "Sr No": i + 1,
      "Report Date": r.reportDate || "",
      "Member Name": r.memberName || "",
      "Word Count": r.wordCount ?? "",
      "Created At": r.createdAt ? new Date(r.createdAt).toLocaleString() : "",
      "Attachment": r?.attachment?.url ? "Yes" : "No",
      "Report Text": r.reportText || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AllReports");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `AllReports_${date || "ALL"}_page${page}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(12);
    doc.text(`All Reports ${date ? `- ${date}` : ""} (Page ${page})`, 14, 12);

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

    doc.save(`AllReports_${date || "ALL"}_page${page}.pdf`);
  };

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-800">All Reports</div>
          <div className="text-xs text-slate-500">Search + Date-wise filter + Export</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            <FiDownload /> Export Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            <FiDownload /> Export PDF
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border rounded-2xl p-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          {/* Date picker */}
          <div>
            <label className="text-xs text-slate-500 flex items-center gap-2">
              <FiCalendar /> Date (optional)
            </label>
            <div className="mt-1 flex gap-2 items-center">
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setPage(1);
                }}
                className="text-sm border rounded-xl px-3 py-2 w-[200px]"
              />
              {date ? (
                <button
                  onClick={() => {
                    setDate("");
                    setPage(1);
                  }}
                  className="text-xs px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 inline-flex items-center gap-2"
                  title="Clear date"
                >
                  <FiX /> Clear
                </button>
              ) : null}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="text-xs text-slate-500 flex items-center gap-2">
              <FiSearch /> Search
            </label>
            <div className="mt-1 flex gap-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search member / text..."
                className="text-sm border rounded-xl px-3 py-2 w-[320px]"
              />
              <button
                onClick={applySearch}
                className="text-xs px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Rows */}
        <div className="flex gap-2 items-center">
          <div className="text-xs text-slate-500">Rows</div>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="text-sm border rounded-xl px-2 py-2"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
      </div>

      <DailyReportTable
        reports={reports}
        loading={loading}
        onView={(r) => {
          setSelected(r);
          setOpen(true);
        }}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-xs text-slate-500">
          Total: {pagination.total || 0} | Page {pagination.page || 1} of {totalPages}
        </div>

        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      <DailyReportModal open={open} onClose={() => setOpen(false)} report={selected} />
    </div>
  );
}
