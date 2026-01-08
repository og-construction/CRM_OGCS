import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../../api/axiosClient";

import { MapContainer, TileLayer, Marker, Circle, Polyline, Popup } from "react-leaflet";

import { FiSearch, FiMapPin, FiExternalLink, FiX, FiCalendar } from "react-icons/fi";

// ---- helpers ----
const isAdminUser = (u) => {
  const role = String(u?.role || u?.userRole || u?.type || "").toLowerCase();
  return role === "admin" || role === "super admin" || role === "superadmin";
};

const isoToLocal = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
};

const isoToYMD = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
};

const openStreetMapLink = (lat, lng) =>
  `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=17/${encodeURIComponent(
    lat
  )}/${encodeURIComponent(lng)}`;

const haversineMeters = (a, b) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const computeDistanceKm = (points) => {
  if (!Array.isArray(points) || points.length < 2) return 0;
  let meters = 0;
  for (let i = 1; i < points.length; i++) meters += haversineMeters(points[i - 1], points[i]);
  return Math.round((meters / 1000) * 100) / 100;
};

export default function LatestLocationsSection() {
  const user = useSelector((s) => s.auth.user);

  if (!isAdminUser(user)) {
    return (
      <div className="bg-white border rounded-2xl p-5">
        <div className="text-lg font-semibold text-slate-800">Access Denied</div>
        <div className="text-sm text-slate-500 mt-1">Only Admin can view this section.</div>
      </div>
    );
  }

  // list state
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(false);

  // modal state
  const [open, setOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);
  const [date, setDate] = useState("");
  const [points, setPoints] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const params = useMemo(() => ({ page, limit, q }), [page, limit, q]);

  const fetchLatest = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get("/admin/locations/latest", { params });
      setItems(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e) {
      console.error("Latest locations fetch error:", e);
      setItems([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatest();
    // eslint-disable-next-line
  }, [page, limit]);

  const searchNow = () => {
    setPage(1);
    fetchLatest();
  };

  const loadRoute = async (userId, d) => {
    if (!userId || !d) return;
    setRouteLoading(true);
    setPoints([]);
    try {
      const res = await axiosClient.get("/admin/locations/day-route", {
        params: { userId, date: d },
      });
      const list = res.data?.data || [];
      setPoints(
        list
          .filter((p) => typeof p.lat === "number" && typeof p.lng === "number")
          .map((p) => ({ ...p }))
      );
    } catch (e) {
      console.error("Day route fetch error:", e);
      setPoints([]);
    } finally {
      setRouteLoading(false);
    }
  };

  const openPreview = async (row) => {
    setActiveRow(row);
    const d = isoToYMD(row?.capturedAt);
    setDate(d);
    setOpen(true);
    await loadRoute(row?.userId, d);
  };

  const distanceKm = useMemo(() => computeDistanceKm(points), [points]);
  const polyline = useMemo(() => points.map((p) => [p.lat, p.lng]), [points]);

  const totalPages = pagination?.totalPages || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-800">Latest Locations (All Employees)</div>
          <div className="text-xs text-slate-500">
            Search by name → click Preview → see full day route + total travel.
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search employee name/email..."
            className="text-sm border rounded-xl px-3 py-2 w-[280px]"
          />
          <button
            onClick={searchNow}
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700"
          >
            <FiSearch /> Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white border rounded-2xl shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr className="text-slate-600">
              <th className="px-4 py-3 text-left">Employee Name</th>
              <th className="px-4 py-3 text-left">Captured At</th>
              <th className="px-4 py-3 text-left">Preview</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={3}>
                  Loading...
                </td>
              </tr>
            ) : items.length ? (
              items.map((r) => (
                <tr key={r._id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{r.employee?.name || "—"}</div>
                    <div className="text-xs text-slate-500">{r.employee?.email || ""}</div>
                  </td>
                  <td className="px-4 py-3">{isoToLocal(r.capturedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => openPreview(r)}
                      className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border bg-white hover:bg-slate-50"
                    >
                      <FiMapPin /> Preview
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-4 text-slate-500" colSpan={3}>
                  No employees found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm">
        <div className="text-xs text-slate-500">
          Total: {pagination.total || 0} | Page {pagination.page || 1} of {totalPages}
        </div>

        <div className="flex gap-2 items-center">
          <select
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value, 10));
              setPage(1);
            }}
            className="text-xs border rounded-xl px-2 py-2 bg-white"
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal: whole day route */}
      {open && activeRow ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          <div className="absolute left-1/2 top-1/2 w-[95%] max-w-5xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">{activeRow.employee?.name}</div>
                <div className="text-xs text-slate-500">
                  {activeRow.employee?.email} • Total Travel:{" "}
                  <b>{routeLoading ? "..." : `${distanceKm} km`}</b>
                </div>
              </div>

              <button
                onClick={() => setOpen(false)}
                className="text-xs px-3 py-2 rounded-xl border hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <FiX /> Close
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex flex-wrap items-end gap-3">
                <div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <FiCalendar /> Date
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="mt-1 text-sm border rounded-xl px-3 py-2"
                  />
                </div>

                <button
                  onClick={() => loadRoute(activeRow.userId, date)}
                  className="text-xs px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700"
                >
                  Load Day Route
                </button>

                {typeof activeRow.lat === "number" && typeof activeRow.lng === "number" ? (
                  <a
                    href={openStreetMapLink(activeRow.lat, activeRow.lng)}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 hover:underline inline-flex items-center gap-2 ml-auto"
                  >
                    <FiExternalLink /> Open in Map
                  </a>
                ) : null}
              </div>

              <div className="rounded-xl overflow-hidden border bg-slate-50">
                {routeLoading ? (
                  <div className="p-6 text-sm text-slate-500">Loading route...</div>
                ) : points.length ? (
                  <MapContainer
                    center={[points[0].lat, points[0].lng]}
                    zoom={14}
                    style={{ height: 520, width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* Start + End */}
                    <Marker position={[points[0].lat, points[0].lng]}>
                      <Popup>Start: {isoToLocal(points[0].capturedAt)}</Popup>
                    </Marker>

                    <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]}>
                      <Popup>End: {isoToLocal(points[points.length - 1].capturedAt)}</Popup>
                    </Marker>

                    {/* Accuracy circle (last point) */}
                    {Number(points[points.length - 1]?.accuracy || 0) > 0 ? (
                      <Circle
                        center={[points[points.length - 1].lat, points[points.length - 1].lng]}
                        radius={Number(points[points.length - 1].accuracy)}
                        pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.2 }}
                      />
                    ) : null}

                    {/* Route */}
                    {polyline.length >= 2 ? (
                      <Polyline positions={polyline} pathOptions={{ color: "red", weight: 4, opacity: 0.9 }} />
                    ) : null}
                  </MapContainer>
                ) : (
                  <div className="p-6 text-sm text-slate-500">No route points found for this day.</div>
                )}
              </div>

              <div className="text-[11px] text-slate-400">
                Map uses OpenStreetMap (no API key). Distance is calculated from captured points.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
