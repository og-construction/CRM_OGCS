import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../../api/axiosClient";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  FiCalendar,
  FiDownload,
  FiRefreshCw,
  FiMapPin,
  FiUsers,
  FiAlertTriangle,
  FiFileText,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");
const fmtToday = () => new Date().toISOString().slice(0, 10);

const isAdminUser = (u) => {
  const role = String(u?.role || u?.userRole || u?.type || "").toLowerCase();
  return role === "admin" || role === "super admin" || role === "superadmin";
};

export default function DistanceByDaySection() {
  const user = useSelector((s) => s.auth.user);

  // ✅ Access control
  if (!isAdminUser(user)) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
        <div className="text-lg font-semibold text-slate-800">Access Denied</div>
        <div className="text-sm text-slate-500 mt-1">Only Admin can view this.</div>
      </div>
    );
  }

  const [date, setDate] = useState(fmtToday());
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");

  const perUser = useMemo(() => summary?.perUser || [], [summary]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/admin/locations/distance/day", {
        params: { date },
      });
      setSummary(res.data?.data || null);
    } catch (e) {
      console.error(e);
      setSummary(null);
      setError(e?.response?.data?.message || "Failed to load distance summary.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const exportExcel = useCallback(() => {
    const rows = perUser.map((r, i) => ({
      "Sr No": i + 1,
      Name: r.name || "",
      Email: r.email || "",
      "Distance (KM)": r.distanceKm ?? 0,
      Pings: r.points ?? 0,
      "First Ping": r.firstPing ? new Date(r.firstPing).toLocaleString() : "",
      "Last Ping": r.lastPing ? new Date(r.lastPing).toLocaleString() : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "DistanceByDay");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });

    saveAs(
      new Blob([buf], { type: "application/octet-stream" }),
      `DistanceByDay_${date}.xlsx`
    );
  }, [perUser, date]);

  const exportPDF = useCallback(() => {
    const doc = new jsPDF({ orientation: "portrait" });

    doc.setFontSize(12);
    doc.text(`Distance Traveled - ${date}`, 14, 12);

    doc.setFontSize(10);
    doc.text(
      `Total Users: ${summary?.totalUsers || 0} | Total KM: ${summary?.totalKm || 0}`,
      14,
      18
    );

    autoTable(doc, {
      startY: 24,
      head: [["Name", "Email", "Distance (KM)", "Pings"]],
      body: perUser.map((r) => [
        r.name || "",
        r.email || "",
        String(r.distanceKm ?? 0),
        String(r.points ?? 0),
      ]),
      styles: { fontSize: 9 },
    });

    doc.save(`DistanceByDay_${date}.pdf`);
  }, [perUser, summary, date]);

  return (
    <div className="space-y-4">
      {/* ✅ Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center">
              <FiMapPin className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-semibold text-slate-800 truncate">
                Distance Traveled (Per Day)
              </div>
              <div className="text-xs text-slate-500">
                Calculated from employee location pings (GPS).
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <button
            onClick={exportExcel}
            disabled={loading || !perUser.length}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border transition",
              loading || !perUser.length
                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                : "border-slate-200 bg-white hover:bg-slate-50"
            )}
          >
            <FiDownload /> Excel
          </button>

          <button
            onClick={exportPDF}
            disabled={loading || !perUser.length}
            className={cn(
              "inline-flex items-center justify-center gap-2",
              "text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border transition",
              loading || !perUser.length
                ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                : "border-slate-200 bg-white hover:bg-slate-50"
            )}
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

      {/* ✅ Controls + KPI */}
      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-end">
          {/* Date */}
          <div className="lg:col-span-4">
            <label className="text-xs text-slate-500 inline-flex items-center gap-2">
              <FiCalendar /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full sm:w-[240px] text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white"
            />
          </div>

          {/* KPIs */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <KpiCard
              Icon={FiUsers}
              label="Total Users"
              value={loading ? "..." : String(summary?.totalUsers ?? 0)}
            />
            <KpiCard
              Icon={FiFileText}
              label="Total KM"
              value={loading ? "..." : String(summary?.totalKm ?? 0)}
            />
          </div>
        </div>

        {error ? (
          <div className="mt-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2 inline-flex items-center gap-2">
            <FiAlertTriangle />
            {error}
          </div>
        ) : null}
      </div>

      {/* ✅ Desktop table (md+) + Mobile cards (<md) */}
      <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
        {/* Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-slate-600">
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Distance (KM)</th>
                <th className="px-4 py-3 text-left font-semibold">Pings</th>
                <th className="px-4 py-3 text-left font-semibold">First Ping</th>
                <th className="px-4 py-3 text-left font-semibold">Last Ping</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    Calculating...
                  </td>
                </tr>
              ) : perUser.length ? (
                perUser.map((r) => (
                  <tr
                    key={r.userId}
                    className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3 font-semibold text-slate-800">
                      {r.name || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.email || "-"}</td>
                    <td className="px-4 py-3">{r.distanceKm ?? 0}</td>
                    <td className="px-4 py-3">{r.points ?? 0}</td>
                    <td className="px-4 py-3">
                      {r.firstPing ? new Date(r.firstPing).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {r.lastPing ? new Date(r.lastPing).toLocaleString() : "-"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="px-4 py-4 text-slate-500" colSpan={6}>
                    No data for selected date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-4 text-sm text-slate-500">Calculating...</div>
          ) : perUser.length ? (
            perUser.map((r) => (
              <div key={r.userId} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-800 truncate">
                      {r.name || "-"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">{r.email || "-"}</div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className="text-[11px] text-slate-500">Distance</div>
                    <div className="text-sm font-bold text-slate-800">
                      {r.distanceKm ?? 0} km
                    </div>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-slate-500">Pings</div>
                    <div className="text-slate-800 font-semibold">{r.points ?? 0}</div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="text-slate-500">First Ping</div>
                    <div className="text-slate-800 font-semibold">
                      {r.firstPing ? new Date(r.firstPing).toLocaleString() : "-"}
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 col-span-2">
                    <div className="text-slate-500">Last Ping</div>
                    <div className="text-slate-800 font-semibold">
                      {r.lastPing ? new Date(r.lastPing).toLocaleString() : "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-sm text-slate-500">No data for selected date.</div>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
          <Icon className="text-slate-700" />
        </div>
        <div className="min-w-0">
          <div className="text-xs text-slate-500">{label}</div>
          <div className="text-xl font-bold text-slate-800">{value}</div>
        </div>
      </div>
    </div>
  );
}
