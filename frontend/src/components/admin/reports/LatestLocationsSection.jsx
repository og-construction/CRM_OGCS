import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import axiosClient from "../../../api/axiosClient";

import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  Popup,
  CircleMarker,
  useMap,
} from "react-leaflet";

import {
  FiSearch,
  FiMapPin,
  FiExternalLink,
  FiX,
  FiCalendar,
  FiRefreshCw,
  FiUsers,
  FiAlertTriangle,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";

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

// ---------------- helpers ----------------
const cn = (...a) => a.filter(Boolean).join(" ");

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

const useDebouncedValue = (value, delay = 400) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const getEmployeeInfo = (row) => {
  const emp = row?.employee || row?.user || row?.userId || row?.employeeId || row?.createdBy || null;
  const name = emp?.name || emp?.fullName || row?.employeeName || row?.name || "—";
  const email = emp?.email || row?.employeeEmail || row?.email || "";
  return { name, email };
};

const getRowUserId = (row) => {
  if (row?.userId?._id) return row.userId._id;
  if (typeof row?.userId === "string") return row.userId;

  if (row?.employeeId?._id) return row.employeeId._id;
  if (typeof row?.employeeId === "string") return row.employeeId;

  if (row?.employee?._id) return row.employee._id;
  if (row?.user?._id) return row.user._id;

  return null;
};

function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (!positions || positions.length === 0) return;
    const bounds = L.latLngBounds(positions);
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [map, positions]);
  return null;
}

// ---------------- component ----------------
export default function LatestLocationsSection() {
  const user = useSelector((s) => s.auth.user);

  // ✅ Access control
  if (!isAdminUser(user)) {
    return (
      <div className="bg-white border border-slate-100 rounded-2xl p-5">
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // modal state
  const [open, setOpen] = useState(false);
  const [activeRow, setActiveRow] = useState(null);

  const [date, setDate] = useState("");
  const [points, setPoints] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeMsg, setRouteMsg] = useState("");

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

  // Prevent race conditions
  const latestReqId = useRef(0);

  const fetchLatest = useCallback(async () => {
    const reqId = ++latestReqId.current;
    setLoading(true);
    setError("");

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
      setError(e?.response?.data?.message || "Failed to load latest locations.");
    } finally {
      if (reqId === latestReqId.current) setLoading(false);
    }
  }, [endpoints.latest, params, page, limit]);

  useEffect(() => {
    fetchLatest();
  }, [fetchLatest]);

  // Reset to page 1 when searching changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQ]);

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

        // backend fallback support (if usedDate returned)
        const usedDate = res.data?.usedDate;
        if (usedDate && usedDate !== d) setDate(usedDate);

        const msg = res.data?.message || "";
        if (msg) setRouteMsg(msg);

        const list = res.data?.data || [];

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

  const openPreview = useCallback(
    (row) => {
      setActiveRow(row);

      const d = isoToYMD(row?.capturedAt) || isoToYMD(new Date().toISOString());
      setDate(d);
      setPoints([]);
      setRouteMsg("");
      setOpen(true);

      const userId = getRowUserId(row);
      loadRoute(userId, d);
    },
    [loadRoute]
  );

  const closeModal = useCallback(() => {
    setOpen(false);
    setActiveRow(null);
    setDate("");
    setPoints([]);
    setRouteLoading(false);
    setRouteMsg("");
  }, []);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeModal();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeModal]);

  // ✅ prevent background scroll when modal open (UI only)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const distanceKm = useMemo(() => computeDistanceKm(points), [points]);
  const polyline = useMemo(() => points.map((p) => [p.lat, p.lng]), [points]);

  const totalPages = pagination?.totalPages || 1;

  const mapCenter = useMemo(() => {
    if (points?.length) return [points[0].lat, points[0].lng];
    if (Number.isFinite(activeRow?.lat) && Number.isFinite(activeRow?.lng))
      return [activeRow.lat, activeRow.lng];
    return [19.076, 72.8777]; // default: Mumbai
  }, [points, activeRow]);

  const activeEmp = useMemo(() => getEmployeeInfo(activeRow), [activeRow]);

  const stats = useMemo(() => {
    return {
      total: pagination?.total || 0,
      showing: items?.length || 0,
    };
  }, [pagination, items]);

  return (
    <div className="space-y-4">
      {/* ✅ CRM container */}
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-5">
        {/* ✅ Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shrink-0">
              <FiMapPin className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-slate-800 truncate">
                Latest Locations (All Employees)
              </div>
              <div className="text-xs sm:text-sm text-slate-500">
                Search employee → Preview → view full day route + total travel.
              </div>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap gap-2 lg:justify-end">
            <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
              <FiUsers />
              Total: <span className="font-semibold text-slate-800">{stats.total}</span>
            </span>
            <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
              <FiMapPin />
              Showing: <span className="font-semibold text-slate-800">{stats.showing}</span>
            </span>
          </div>
        </div>

        {/* ✅ Search / Controls */}
        <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-3 sm:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:items-end">
            <div className="lg:col-span-6">
              <label className="text-xs text-slate-500 flex items-center gap-2">
                <FiSearch /> Search
              </label>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setPage(1)}
                placeholder="Search employee name/email..."
                className={cn(
                  "mt-1 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white",
                  "focus:outline-none focus:ring-2 focus:ring-sky-200 focus:border-sky-300"
                )}
              />
              <div className="mt-1 text-[11px] text-slate-400">
                Tip: typing will auto-search after a short delay.
              </div>
            </div>

            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:justify-end gap-2">
              <button
                onClick={fetchLatest}
                disabled={loading}
                className={cn(
                  "inline-flex w-full lg:w-auto items-center justify-center gap-2",
                  "text-xs sm:text-sm px-4 py-2.5 rounded-xl border transition",
                  loading
                    ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
                )}
              >
                <FiRefreshCw /> Refresh
              </button>

              <div className="w-full lg:w-auto rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Rows</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(parseInt(e.target.value, 10));
                    setPage(1);
                  }}
                  className="text-sm bg-transparent outline-none"
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

          {error ? (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2 inline-flex items-center gap-2">
              <FiAlertTriangle />
              {error}
            </div>
          ) : null}
        </div>

        {/* ✅ Table + Cards */}
        <div className="mt-4 bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-100 sticky top-0 z-10">
                <tr className="text-slate-600">
                  <th className="px-4 py-3 text-left font-semibold">Employee</th>
                  <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">
                    Captured At
                  </th>
                  <th className="px-4 py-3 text-right font-semibold w-[160px] whitespace-nowrap">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan={3}>
                      Loading...
                    </td>
                  </tr>
                ) : items.length ? (
                  items.map((r) => {
                    const emp = getEmployeeInfo(r);
                    return (
                      <tr
                        key={r._id}
                        className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/70"
                      >
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{emp.name}</div>
                          <div className="text-xs text-slate-500">{emp.email}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-700 whitespace-nowrap">
                          {isoToLocal(r.capturedAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => openPreview(r)}
                            className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
                          >
                            <FiMapPin /> Preview
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td className="px-4 py-5 text-slate-500" colSpan={3}>
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 text-sm text-slate-500">Loading...</div>
            ) : items.length ? (
              items.map((r) => {
                const emp = getEmployeeInfo(r);
                return (
                  <div key={r._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-slate-800 truncate">
                          {emp.name}
                        </div>
                        <div className="text-xs text-slate-500 truncate">{emp.email}</div>
                        <div className="mt-2 text-xs text-slate-500">
                          Captured:{" "}
                          <span className="text-slate-800 font-semibold">
                            {isoToLocal(r.capturedAt)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => openPreview(r)}
                        className="shrink-0 inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
                      >
                        <FiMapPin /> Preview
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-sm text-slate-500">No employees found.</div>
            )}
          </div>
        </div>

        {/* ✅ Pagination */}
        <div className="mt-4 bg-white border border-slate-100 rounded-2xl p-3 sm:p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-slate-500">
              Total:{" "}
              <span className="text-slate-800 font-semibold">{pagination.total || 0}</span>{" "}
              <span className="mx-1">•</span>
              Page{" "}
              <span className="text-slate-800 font-semibold">{pagination.page || page}</span> of{" "}
              <span className="text-slate-800 font-semibold">{totalPages}</span>
            </div>

            <div className="grid grid-cols-2 sm:flex items-center gap-2 sm:justify-end">
              <button
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-[0.99] transition"
              >
                <FiChevronLeft />
                Prev
              </button>

              <button
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm px-3 sm:px-4 py-2.5 rounded-xl border border-slate-200 bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 active:scale-[0.99] transition"
              >
                Next
                <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ Modal */}
      {open && activeRow ? (
        <RouteModal
          activeRow={activeRow}
          activeEmp={activeEmp}
          date={date}
          setDate={setDate}
          points={points}
          polyline={polyline}
          mapCenter={mapCenter}
          distanceKm={distanceKm}
          routeLoading={routeLoading}
          routeMsg={routeMsg}
          loadRoute={loadRoute}
          onClose={closeModal}
        />
      ) : null}
    </div>
  );
}

/* ---------------- Modal (UI improved, logic unchanged) ---------------- */

function RouteModal({
  activeRow,
  activeEmp,
  date,
  setDate,
  points,
  polyline,
  mapCenter,
  distanceKm,
  routeLoading,
  routeMsg,
  loadRoute,
  onClose,
}) {
  const userId = useMemo(() => getRowUserId(activeRow), [activeRow]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
      />

      {/* Center wrapper: bottom sheet on mobile, dialog on desktop */}
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "w-full sm:w-[92vw] max-w-6xl",
            "h-[92vh] sm:h-auto sm:max-h-[88vh]",
            "rounded-t-3xl sm:rounded-2xl",
            "bg-white border border-slate-100 shadow-2xl overflow-hidden ring-1 ring-black/5"
          )}
        >
          {/* Drag handle (mobile) */}
          <div className="sm:hidden absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-200" />

          {/* Header (sticky) */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100">
            <div className="px-4 sm:px-6 py-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-semibold text-slate-800 truncate">
                  {activeEmp.name}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {activeEmp.email || "—"} • Total Travel:{" "}
                  <span className="font-semibold text-slate-800">
                    {routeLoading ? "..." : `${distanceKm} km`}
                  </span>
                </div>
                {routeMsg ? <div className="text-[11px] text-amber-600 mt-1">{routeMsg}</div> : null}
              </div>

              <button
                onClick={onClose}
                className="shrink-0 inline-flex items-center gap-2 text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
              >
                <FiX />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Body (scroll area) */}
          <div className="p-4 sm:p-6 space-y-3 overflow-auto h-[calc(92vh-92px)] sm:h-auto sm:max-h-[calc(88vh-96px)]">
            {/* Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-[220px_1fr] lg:grid-cols-[220px_220px_1fr] gap-3 items-end">
              <div className="min-w-0">
                <div className="text-xs text-slate-500 flex items-center gap-2">
                  <FiCalendar /> Date
                </div>
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

              <button
                onClick={() => loadRoute(userId, date)}
                disabled={!date || routeLoading}
                className={cn(
                  "inline-flex items-center justify-center gap-2",
                  "text-xs sm:text-sm px-4 py-2.5 rounded-xl transition",
                  "w-full sm:w-auto",
                  !date || routeLoading
                    ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                    : "bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99]"
                )}
              >
                <FiRefreshCw />
                {routeLoading ? "Loading..." : "Load Day Route"}
              </button>

              {Number.isFinite(activeRow?.lat) && Number.isFinite(activeRow?.lng) ? (
                <a
                  href={openStreetMapLink(activeRow.lat, activeRow.lng)}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs sm:text-sm text-sky-700 hover:underline inline-flex items-center gap-2 justify-start sm:justify-end"
                >
                  <FiExternalLink /> Open in Map
                </a>
              ) : null}
            </div>

            {/* Map */}
            <div className="rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
              {routeLoading ? (
                <div className="p-6 text-sm text-slate-500">Loading route...</div>
              ) : points.length ? (
                <div className="h-[50vh] sm:h-[520px] lg:h-[600px] w-full">
                  <MapContainer center={mapCenter} zoom={14} style={{ width: "100%", height: "100%" }}>
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

                    <FitBounds positions={polyline} />

                    {points.map((p, idx) => (
                      <CircleMarker key={p._id || idx} center={[p.lat, p.lng]} radius={5}>
                        <Popup>
                          <div className="text-xs">
                            <div>
                              <b>Point:</b> {idx + 1}
                            </div>
                            <div>
                              <b>Time:</b> {isoToLocal(p.capturedAt)}
                            </div>
                            {Number.isFinite(p.accuracy) ? (
                              <div>
                                <b>Accuracy:</b> {Math.round(p.accuracy)} m
                              </div>
                            ) : null}
                          </div>
                        </Popup>
                      </CircleMarker>
                    ))}

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

                    {polyline.length >= 2 ? <Polyline positions={polyline} /> : null}
                  </MapContainer>
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-500">No route points found for this day.</div>
              )}
            </div>

            <div className="text-[11px] text-slate-400">
              Map uses OpenStreetMap (no API key). Distance is calculated from captured points.
            </div>
          </div>

          {/* Footer (mobile friendly) */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 p-4 sm:hidden">
            <button
              onClick={onClose}
              className="w-full inline-flex items-center justify-center gap-2 text-sm px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] transition"
            >
              <FiX /> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}