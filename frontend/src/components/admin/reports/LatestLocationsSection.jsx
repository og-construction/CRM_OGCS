import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../../api/axiosClient";

import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  Polyline,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";

import { FiSearch, FiMapPin, FiExternalLink, FiX, FiCalendar, FiRefreshCw } from "react-icons/fi";

// ✅ Leaflet marker icon fix
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

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
  `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(
    lng
  )}#map=17/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;

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

// ✅ Debounce
const useDebouncedValue = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

// ✅ Extract employee safely (works with your backend "employee" projection)
const getEmployeeInfo = (row) => {
  const emp =
    row?.employee ||
    row?.user ||
    row?.userId ||
    row?.employeeId ||
    row?.createdBy ||
    null;

  const name = emp?.name || emp?.fullName || row?.employeeName || row?.name || "—";
  const email = emp?.email || row?.employeeEmail || row?.email || "";

  return { name, email };
};

// ✅ Convert row to a real userId
const getRowUserId = (row) => {
  if (row?.userId?._id) return row.userId._id;
  if (typeof row?.userId === "string") return row.userId;

  if (row?.employeeId?._id) return row.employeeId._id;
  if (typeof row?.employeeId === "string") return row.employeeId;

  if (row?.employee?._id) return row.employee._id;
  if (row?.user?._id) return row.user._id;

  return null;
};

// ✅ Fit map to bounds of all points
function FitBounds({ positions }) {
  const map = useMap();

  useEffect(() => {
    if (!positions || positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, positions]);

  return null;
}

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
  const debouncedQ = useDebouncedValue(q, 400);

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
  const [routeMsg, setRouteMsg] = useState("");

  // ✅ Important: this assumes VITE_API_BASE_URL ends with "/api"
  // endpoints become: /api/admin/...
  const endpoints = useMemo(
    () => ({
      latest: "/admin/locations/latest",
      dayRoute: "/admin/locations/day-route",
    }),
    []
  );

  const params = useMemo(() => {
    const p = { page, limit };
    if (debouncedQ?.trim()) p.q = debouncedQ.trim();
    return p;
  }, [page, limit, debouncedQ]);

  // prevent race conditions
  const latestReqId = useRef(0);

  const fetchLatest = useCallback(async () => {
    const reqId = ++latestReqId.current;
    setLoading(true);

    try {
      const res = await axiosClient.get(endpoints.latest, { params });

      if (reqId !== latestReqId.current) return;

      setItems(res.data?.data || []);
      setPagination(res.data?.pagination || { page, limit, total: 0, totalPages: 1 });
    } catch (e) {
      if (reqId !== latestReqId.current) return;
      console.error("Latest locations fetch error:", e);
      setItems([]);
      setPagination({ page: 1, limit, total: 0, totalPages: 1 });
    } finally {
      if (reqId === latestReqId.current) setLoading(false);
    }
  }, [endpoints.latest, params, page, limit]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // reset to page 1 when searching
  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

  const searchNow = () => setPage(1);

  const loadRoute = useCallback(
    async (userId, d) => {
      if (!userId || !d) return;

      setRouteLoading(true);
      setPoints([]);
      setRouteMsg("");

      try {
        const res = await axiosClient.get(endpoints.dayRoute, {
          params: { userId, date: d },
        });

        // ✅ backend fallback support (if you implemented usedDate)
        const usedDate = res.data?.usedDate;
        if (usedDate && usedDate !== d) setDate(usedDate);

        const msg = res.data?.message || "";
        if (msg) setRouteMsg(msg);

        const list = res.data?.data || [];

        // ✅ ensure lat/lng are numbers (prevents filtering out)
        const cleaned = list
          .map((p) => ({
            ...p,
            lat: typeof p.lat === "string" ? parseFloat(p.lat) : p.lat,
            lng: typeof p.lng === "string" ? parseFloat(p.lng) : p.lng,
            accuracy: typeof p.accuracy === "string" ? parseFloat(p.accuracy) : p.accuracy,
          }))
          .filter((p) => Number.isFinite(p?.lat) && Number.isFinite(p?.lng))
          .sort((a, b) => new Date(a.capturedAt).getTime() - new Date(b.capturedAt).getTime());

        setPoints(cleaned);
      } catch (e) {
        console.error("Day route fetch error:", e);
        setPoints([]);
        setRouteMsg("Unable to load route. Please try again.");
      } finally {
        setRouteLoading(false);
      }
    },
    [endpoints.dayRoute]
  );

  const openPreview = (row) => {
    setActiveRow(row);

    const d = isoToYMD(row?.capturedAt) || isoToYMD(new Date().toISOString());
    setDate(d);
    setPoints([]);
    setRouteMsg("");
    setOpen(true);

    const userId = getRowUserId(row);
    loadRoute(userId, d);
  };

  const closeModal = () => {
    setOpen(false);
    setActiveRow(null);
    setDate("");
    setPoints([]);
    setRouteLoading(false);
    setRouteMsg("");
  };

  const distanceKm = useMemo(() => computeDistanceKm(points), [points]);
  const polyline = useMemo(() => points.map((p) => [p.lat, p.lng]), [points]);

  const totalPages = pagination?.totalPages || 1;

  const mapCenter = useMemo(() => {
    if (points?.length) return [points[0].lat, points[0].lng];
    if (Number.isFinite(activeRow?.lat) && Number.isFinite(activeRow?.lng)) return [activeRow.lat, activeRow.lng];
    return [19.076, 72.8777];
  }, [points, activeRow]);

  const activeEmp = useMemo(() => getEmployeeInfo(activeRow), [activeRow]);

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
            onKeyDown={(e) => e.key === "Enter" && searchNow()}
            placeholder="Search employee name/email..."
            className="text-sm border rounded-xl px-3 py-2 w-[280px]"
          />
          <button
            onClick={searchNow}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
          >
            <FiSearch /> Search
          </button>

          <button
            onClick={fetchLatest}
            disabled={loading}
            className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl border bg-white hover:bg-slate-50 disabled:opacity-60"
          >
            <FiRefreshCw /> Refresh
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
              items.map((r) => {
                const emp = getEmployeeInfo(r);
                return (
                  <tr key={r._id} className="border-b last:border-b-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{emp.name}</div>
                      <div className="text-xs text-slate-500">{emp.email}</div>
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
                );
              })
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
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="text-xs px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
          >
            Prev
          </button>
          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="text-xs px-3 py-2 rounded-xl border bg-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && activeRow ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          <div className="absolute left-1/2 top-1/2 w-[95%] max-w-5xl -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-xl border overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-800">{activeEmp.name}</div>
                <div className="text-xs text-slate-500">
                  {activeEmp.email} • Total Travel: <b>{routeLoading ? "..." : `${distanceKm} km`}</b>
                </div>
                {routeMsg ? <div className="text-[11px] text-amber-600 mt-1">{routeMsg}</div> : null}
              </div>

              <button
                onClick={closeModal}
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
                  onClick={() => loadRoute(getRowUserId(activeRow), date)}
                  disabled={!date || routeLoading}
                  className="text-xs px-4 py-2 rounded-xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                >
                  Load Day Route
                </button>

                {Number.isFinite(activeRow.lat) && Number.isFinite(activeRow.lng) ? (
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
                  <MapContainer center={mapCenter} zoom={14} style={{ height: 520, width: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    {/* ✅ fit to all points */}
                    <FitBounds positions={polyline} />

                    {/* ✅ ALL points as pins */}
                    {points.map((p, idx) => (
                      <CircleMarker
                        key={p._id || idx}
                        center={[p.lat, p.lng]}
                        radius={5}
                      >
                        <Popup>
                          <div className="text-xs">
                            <div><b>Point:</b> {idx + 1}</div>
                            <div><b>Time:</b> {isoToLocal(p.capturedAt)}</div>
                            {Number.isFinite(p.accuracy) ? <div><b>Accuracy:</b> {Math.round(p.accuracy)} m</div> : null}
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

                    {/* Start + End */}
                    {points.length > 0 ? (
                      <>
                        <Marker position={[points[0].lat, points[0].lng]}>
                          <Popup>Start: {isoToLocal(points[0].capturedAt)}</Popup>
                        </Marker>
                        <Marker position={[points[points.length - 1].lat, points[points.length - 1].lng]}>
                          <Popup>End: {isoToLocal(points[points.length - 1].capturedAt)}</Popup>
                        </Marker>
                      </>
                    ) : null}

                    {/* Route line */}
                    {polyline.length >= 2 ? <Polyline positions={polyline} /> : null}
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
