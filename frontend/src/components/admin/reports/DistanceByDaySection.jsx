import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../../api/axiosClient";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { FiCalendar, FiDownload, FiRefreshCw } from "react-icons/fi";

const fmtToday = () => new Date().toISOString().slice(0, 10);

const isAdminUser = (u) => {
  const role = String(u?.role || u?.userRole || u?.type || "").toLowerCase();
  return role === "admin" || role === "super admin" || role === "superadmin";
};

export default function DistanceByDaySection() {
  const user = useSelector((s) => s.auth.user);
  if (!isAdminUser(user)) {
    return (
      <div className="bg-white border rounded-2xl p-5">
        <div className="text-lg font-semibold text-slate-800">Access Denied</div>
        <div className="text-sm text-slate-500 mt-1">Only Admin can view this.</div>
      </div>
    );
  }

  const [date, setDate] = useState(fmtToday());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/locations/distance/day", {
        params: { date },
      });
      setSummary(res.data?.data || null);
    } catch (e) {
      console.error(e);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [date]);

  const exportExcel = () => {
    const rows = (summary?.perUser || []).map((r, i) => ({
      "Sr No": i + 1,
      Name: r.name,
      Email: r.email,
      "Distance (KM)": r.distanceKm,
      Pings: r.points,
      "First Ping": r.firstPing ? new Date(r.firstPing).toLocaleString() : "",
      "Last Ping": r.lastPing ? new Date(r.lastPing).toLocaleString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DistanceByDay");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/octet-stream" }), `DistanceByDay_${date}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "portrait" });
    doc.setFontSize(12);
    doc.text(`Distance Traveled - ${date}`, 14, 12);
    doc.setFontSize(10);
    doc.text(`Total Users: ${summary?.totalUsers || 0} | Total KM: ${summary?.totalKm || 0}`, 14, 18);

    autoTable(doc, {
      startY: 24,
      head: [["Name", "Email", "Distance (KM)", "Pings"]],
      body: (summary?.perUser || []).map((r) => [
        r.name || "",
        r.email || "",
        String(r.distanceKm ?? 0),
        String(r.points ?? 0),
      ]),
      styles: { fontSize: 9 },
    });

    doc.save(`DistanceByDay_${date}.pdf`);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-800">Distance Traveled (Per Day)</div>
          <div className="text-xs text-slate-500">Calculated from location pings (GPS).</div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportExcel}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            <FiDownload /> Excel
          </button>
          <button
            onClick={exportPDF}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            <FiDownload /> PDF
          </button>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4 flex items-end justify-between gap-3 flex-wrap">
        <div>
          <label className="text-xs text-slate-500 inline-flex items-center gap-2">
            <FiCalendar /> Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 text-sm border rounded-xl px-3 py-2 w-[200px]"
          />
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-500">Total KM</div>
          <div className="text-2xl font-bold text-slate-800">
            {loading ? "..." : (summary?.totalKm ?? 0)}
          </div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr className="text-slate-600">
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Distance (KM)</th>
              <th className="px-4 py-3 text-left">Pings</th>
              <th className="px-4 py-3 text-left">First Ping</th>
              <th className="px-4 py-3 text-left">Last Ping</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={6}>Calculating...</td></tr>
            ) : (summary?.perUser || []).length ? (
              summary.perUser.map((r) => (
                <tr key={r.userId} className="border-b last:border-b-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium">{r.name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.email}</td>
                  <td className="px-4 py-3">{r.distanceKm}</td>
                  <td className="px-4 py-3">{r.points}</td>
                  <td className="px-4 py-3">{r.firstPing ? new Date(r.firstPing).toLocaleString() : "-"}</td>
                  <td className="px-4 py-3">{r.lastPing ? new Date(r.lastPing).toLocaleString() : "-"}</td>
                </tr>
              ))
            ) : (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={6}>No data for selected date.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
