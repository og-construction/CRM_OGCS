import React, { useCallback, useMemo, useState } from "react";
import axiosClient from "../../../api/axiosClient";
import { MapContainer, TileLayer, Marker, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";

import {
  FiCalendar,
  FiMapPin,
  FiRefreshCw,
  FiUsers,
  FiAlertTriangle,
} from "react-icons/fi";

/**
 * ✅ UI Improvements (logic unchanged)
 * - Professional CRM container + cards
 * - Mobile-first actions (full width)
 * - Better summary chips
 * - Map height responsive without inline height conflict
 * - Cleaner empty/loading/error states
 */

const cn = (...a) => a.filter(Boolean).join(" ");

const haversineKm = (pts = []) => {
  let m = 0;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const R = 6371;

    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;

    const s =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    m += 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
  return Number(m).toFixed(2);
};

const safeTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleTimeString();
};

const safeDateLabel = (date) => {
  if (!date) return "Select a date";
  return date;
};

function SummaryPill({ icon: Icon, label, value }) {
  return (
    <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
      <Icon />
      {label}: <span className="font-semibold text-slate-800">{value}</span>
    </span>
  );
}

export default function DailyRoutesAllEmployees() {
  const [date, setDate] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const summary = useMemo(() => {
    const employees = data?.length || 0;
    const routes = (data || []).filter((e) => (e?.points || []).length >= 2)
      .length;
    return { employees, routes };
  }, [data]);

  const loadData = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setError("");
    try {
      const res = await axiosClient.get("/admin/locations/daily-routes", {
        params: { date },
      });
      setData(res.data?.data || []);
    } catch (e) {
      console.error(e);
      setData([]);
      setError(e?.response?.data?.message || "Failed to load daily routes.");
    } finally {
      setLoading(false);
    }
  }, [date]);

  const clear = useCallback(() => {
    setDate("");
    setData([]);
    setError("");
  }, []);

  return (
    <div className="space-y-4">
      {/* ✅ Professional container */}
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shrink-0">
              <FiMapPin className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-800 truncate">
                Daily Routes (All Employees)
              </div>
              <div className="text-xs sm:text-sm text-slate-500">
                View start → end time and route distance for the selected date.
              </div>
            </div>
          </div>

          {/* Summary pills */}
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <SummaryPill
              icon={FiUsers}
              label="Employees"
              value={summary.employees}
            />
            <SummaryPill icon={FiMapPin} label="Routes" value={summary.routes} />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-3 sm:p-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:items-end">
            {/* Date */}
            <div className="md:col-span-4">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <FiCalendar /> Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={cn(
                  "mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white",
                  "focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                )}
              />
            </div>

            {/* Actions */}
            <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-2 md:flex md:justify-end">
              <button
                onClick={loadData}
                disabled={!date || loading}
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "text-xs sm:text-sm px-4 py-2.5 rounded-xl transition",
                  "w-full md:w-auto",
                  !date || loading
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
                    : "bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99]"
                )}
              >
                <FiRefreshCw />
                {loading ? "Loading..." : "Load Routes"}
              </button>

              <button
                onClick={clear}
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "text-xs sm:text-sm px-4 py-2.5 rounded-xl",
                  "w-full md:w-auto",
                  "border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
                )}
              >
                Clear
              </button>
            </div>
          </div>

          {/* Status */}
          {error ? (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 inline-flex items-center gap-2">
              <FiAlertTriangle />
              {error}
            </div>
          ) : null}

          {!error && date ? (
            <div className="mt-3 text-xs text-slate-500">
              Showing routes for:{" "}
              <span className="font-semibold text-slate-800">
                {safeDateLabel(date)}
              </span>
            </div>
          ) : null}
        </div>

        {/* Content states */}
        {!date ? (
          <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-4 text-sm text-slate-600">
            Select a date to load employee routes.
          </div>
        ) : null}

        {!loading && date && data?.length === 0 ? (
          <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-4 text-sm text-slate-600">
            No routes found for this date.
          </div>
        ) : null}

        {/* Cards */}
        <div className="mt-4 grid grid-cols-1 gap-4">
          {(data || []).map((emp) => {
            const pts = emp?.points || [];
            if (pts.length < 2) return null;

            const polyline = pts.map((p) => [p.lat, p.lng]);
            const distance = haversineKm(pts);
            const start = safeTime(pts[0]?.capturedAt);
            const end = safeTime(pts[pts.length - 1]?.capturedAt);

            return (
              <div
                key={
                  emp?.user?._id || `${emp?.user?.name}-${polyline?.[0]?.join(",")}`
                }
                className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden"
              >
                {/* Card Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                        {emp?.user?.name || "Employee"}
                      </div>
                      <div className="text-xs sm:text-sm text-slate-500 mt-1">
                        {start} → {end} •{" "}
                        <span className="text-slate-800 font-semibold">
                          {distance} km
                        </span>{" "}
                        • Points:{" "}
                        <span className="text-slate-800 font-semibold">
                          {pts.length}
                        </span>
                      </div>
                    </div>

                    {/* Quick chips */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[11px] px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                        Start:{" "}
                        <span className="font-semibold text-slate-800">
                          {start}
                        </span>
                      </span>
                      <span className="text-[11px] px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                        End:{" "}
                        <span className="font-semibold text-slate-800">
                          {end}
                        </span>
                      </span>
                      <span className="text-[11px] px-3 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                        Distance:{" "}
                        <span className="font-semibold text-slate-800">
                          {distance} km
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Map */}
                <div className="p-3 sm:p-4">
                  <div className="w-full overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
                    {/* IMPORTANT: Leaflet needs explicit height; use a wrapper with responsive heights */}
                    <div className="h-[260px] sm:h-[320px] lg:h-[380px] w-full">
                      <MapContainer
                        center={polyline[0]}
                        zoom={14}
                        style={{ height: "100%", width: "100%" }}
                      >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <Marker position={polyline[0]} />
                        <Marker position={polyline[polyline.length - 1]} />
                        <Polyline positions={polyline} />
                      </MapContainer>
                    </div>
                  </div>

                  {/* Footer row */}
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-500">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                      <span>Start</span>
                      <span className="text-slate-800 font-semibold">{start}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                      <span>End</span>
                      <span className="text-slate-800 font-semibold">{end}</span>
                    </div>
                    <div className="flex items-center justify-between sm:justify-start sm:gap-2">
                      <span>Distance</span>
                      <span className="text-slate-800 font-semibold">
                        {distance} km
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}