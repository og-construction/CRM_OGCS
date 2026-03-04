// src/components/admin/LeadsSection.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiX,
  FiPhoneCall,
  FiMessageCircle,
  FiEye,
  FiChevronLeft,
  FiChevronRight,
  FiFilter,
} from "react-icons/fi";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const cn = (...a) => a.filter(Boolean).join(" ");

const statusBadge = (status = "") => {
  const s = String(status).toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold";
  if (s === "converted") return `${base} bg-green-100 text-green-800`;
  if (s === "closed") return `${base} bg-slate-200 text-slate-800`;
  if (s === "follow-up" || s === "followup")
    return `${base} bg-amber-100 text-amber-800`;
  if (s === "new") return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-slate-100 text-slate-700`;
};

const pill = (text) =>
  text ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
      {text}
    </span>
  ) : (
    <span className="text-slate-400">—</span>
  );

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pickName = (maybeObj) => {
  if (!maybeObj) return "—";
  if (typeof maybeObj === "string") return "—";
  return maybeObj?.name || maybeObj?.fullName || "—";
};

export default function LeadsSection() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");

  // filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [source, setSource] = useState("All");

  // responsive filter toggle (mobile)
  const [filtersOpen, setFiltersOpen] = useState(false);

  // local pagination (client side)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // drawer
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      const params = new URLSearchParams();
      params.set("status", status || "All");
      params.set("leadType", "All");
      params.set("search", q || "");

      const res = await fetch(`${API_BASE}/leads/my?${params.toString()}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Failed to load leads");

      const list = Array.isArray(data?.items) ? data.items : [];
      setLeads(list);
    } catch (e) {
      setError(e.message || "Something went wrong");
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  // auto fetch on status/q changes (debounced q)
  useEffect(() => {
    const t = setTimeout(() => fetchLeads(), 350);
    return () => clearTimeout(t);
  }, [fetchLeads]);

  // unique dropdown options from data
  const uniqueSources = useMemo(() => {
    const s = new Set(leads.map((l) => l?.source).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [leads]);

  const uniqueStatuses = useMemo(() => {
    const s = new Set(leads.map((l) => l?.status).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [leads]);

  // client-side filter (source + status + q)
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return leads
      .filter((l) => {
        if (status !== "All" && l?.status !== status) return false;
        if (source !== "All" && l?.source !== source) return false;

        if (!query) return true;

        const hay = [
          l?.name,
          l?.company,
          l?.phone,
          l?.email,
          l?.city,
          l?.descriptionText,
          l?.description,
          l?.requirement,
          l?.status,
          l?.source,
          l?.leadType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(query);
      })
      .sort(
        (a, b) => new Date(b?.updatedAt || 0) - new Date(a?.updatedAt || 0)
      );
  }, [leads, q, status, source]);

  // pagination
  const pages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / limit)),
    [filtered.length, limit]
  );
  const safePage = useMemo(
    () => Math.min(Math.max(page, 1), pages),
    [page, pages]
  );

  useEffect(() => {
    setPage(1);
  }, [q, status, source, limit]);

  const displayed = useMemo(() => {
    const start = (safePage - 1) * limit;
    return filtered.slice(start, start + limit);
  }, [filtered, safePage, limit]);

  const openDrawer = (lead) => {
    setSelected(lead);
    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
    setSelected(null);
  };

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // ✅ small derived stats (UI only)
  const stats = useMemo(
    () => ({
      total: filtered.length,
      showing: displayed.length,
      updated: fmtDate(leads?.[0]?.updatedAt),
    }),
    [filtered.length, displayed.length, leads]
  );

  return (
    <div className="min-h-[70vh] bg-slate-50 p-3 sm:p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shrink-0">
              <FiFilter className="text-slate-700" />
            </div>

            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                Leads Management
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Search, filter, and review leads quickly.
              </p>

              {/* Pills */}
              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
                  <FiFilter />
                  Status:{" "}
                  <span className="font-semibold text-slate-900">{status}</span>
                </span>

                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
                  Source:{" "}
                  <span className="font-semibold text-slate-900">{source}</span>
                </span>

                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
                  Total:{" "}
                  <span className="font-semibold text-slate-900">
                    {stats.total}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:justify-end">
          <button
            onClick={fetchLeads}
            className={cn(
              "rounded-xl border border-slate-200 bg-white",
              "px-4 py-2 text-xs sm:text-sm font-bold text-slate-800",
              "hover:bg-slate-50 transition inline-flex items-center justify-center gap-2",
              "w-full sm:w-auto"
            )}
          >
            <FiRefreshCw />
            Refresh
          </button>

          <button
            onClick={() => alert("Connect this to your Create Lead form/page")}
            className={cn(
              "rounded-xl bg-slate-900 px-4 py-2",
              "text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition",
              "inline-flex items-center justify-center gap-2",
              "w-full sm:w-auto"
            )}
          >
            <FiPlus />
            New Lead
          </button>

          <button
            onClick={() => setFiltersOpen((v) => !v)}
            className={cn(
              "lg:hidden rounded-xl border border-slate-200 bg-white",
              "px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-50 transition",
              "inline-flex items-center justify-center gap-2",
              "w-full sm:w-auto"
            )}
          >
            <FiFilter />
            {filtersOpen ? "Hide Filters" : "Filters"}
          </button>
        </div>
      </div>

      {/* Filters (Responsive) */}
      <div
        className={cn(
          "rounded-2xl bg-white border border-slate-200/70 shadow-sm ring-1 ring-black/5",
          "p-4 sm:p-5",
          "grid gap-3",
          "lg:grid-cols-12 lg:items-end",
          filtersOpen ? "block" : "hidden lg:grid"
        )}
      >
        {/* Search */}
        <div className="lg:col-span-6">
          <label className="text-xs font-bold text-slate-600 flex items-center gap-2">
            <FiSearch /> Search
          </label>

          <div className="mt-1 relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Name / Company / Phone / City / Description…"
              className={cn(
                "w-full rounded-xl border border-slate-200 bg-white",
                "pl-10 pr-10 py-2 text-sm outline-none",
                "focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              )}
            />

            {q ? (
              <button
                type="button"
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-slate-100"
                aria-label="Clear search"
              >
                <FiX className="text-slate-500" />
              </button>
            ) : null}
          </div>

          <div className="mt-1 text-[11px] text-slate-400">
            Auto-search (350ms).
          </div>
        </div>

        {/* Status */}
        <div className="lg:col-span-3">
          <label className="text-xs font-bold text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={cn(
              "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none",
              "focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            )}
          >
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div className="lg:col-span-3">
          <label className="text-xs font-bold text-slate-600">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className={cn(
              "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none",
              "focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            )}
          >
            {uniqueSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Bottom controls */}
        <div className="lg:col-span-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Rows</span>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                className={cn(
                  "rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none",
                  "focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                )}
              >
                {[10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setQ("");
                setStatus("All");
                setSource("All");
              }}
              className={cn(
                "rounded-xl border border-slate-200 bg-white px-4 py-2",
                "text-xs font-bold text-slate-800 hover:bg-slate-50 transition",
                "inline-flex items-center justify-center gap-2"
              )}
            >
              <FiX />
              Reset
            </button>
          </div>

          {/* Mobile hint */}
          <div className="text-[11px] text-slate-400">
            Tip: Use filters to narrow results faster.
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm ring-1 ring-black/5 overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-4">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">{stats.showing}</span>{" "}
            of{" "}
            <span className="font-semibold text-slate-900">{stats.total}</span>
          </p>

          {error ? (
            <span className="text-sm font-semibold text-red-600">{error}</span>
          ) : (
            <span className="text-xs text-slate-500">Updated: {stats.updated}</span>
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden lg:block overflow-x-auto">
          {loading ? (
            <div className="p-6 text-sm text-slate-600">Loading leads…</div>
          ) : displayed.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No leads found.</div>
          ) : (
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-600 sticky top-0">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 w-[120px]">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayed.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3 align-top">
                      <div className="font-bold text-slate-900">
                        {l?.name || "—"}
                      </div>
                      <div className="text-xs text-slate-600">
                        {l?.company || "—"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {pill(l?.email)}
                        {pill(l?.leadType)}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-slate-900">
                        {l?.phone || "—"}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <a
                          className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 inline-flex items-center gap-2"
                          href={l?.phone ? `tel:${l.phone}` : undefined}
                          onClick={(e) => !l?.phone && e.preventDefault()}
                        >
                          <FiPhoneCall /> Call
                        </a>
                        <a
                          className="rounded-xl bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200 inline-flex items-center gap-2"
                          href={l?.phone ? `https://wa.me/91${l.phone}` : undefined}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => !l?.phone && e.preventDefault()}
                        >
                          <FiMessageCircle /> WhatsApp
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">{l?.city || "—"}</td>

                    <td className="px-4 py-3 align-top">
                      <div className="max-w-[280px] text-slate-800 line-clamp-2">
                        {l?.descriptionText ||
                          l?.description ||
                          l?.requirement ||
                          "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3 align-top">{pill(l?.source)}</td>

                    <td className="px-4 py-3 align-top">
                      <span className={statusBadge(l?.status)}>
                        {l?.status || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top">
                      {pickName(l?.assignedTo)}
                    </td>

                    <td className="px-4 py-3 align-top">{fmtDate(l?.updatedAt)}</td>

                    <td className="px-4 py-3 align-top">
                      <button
                        onClick={() => openDrawer(l)}
                        className={cn(
                          "rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white",
                          "hover:bg-slate-800 transition inline-flex items-center gap-2",
                          "focus:outline-none focus:ring-2 focus:ring-slate-300"
                        )}
                      >
                        <FiEye />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Mobile/Tablet cards */}
        <div className="lg:hidden">
          {loading ? (
            <div className="p-6 text-sm text-slate-600">Loading leads…</div>
          ) : displayed.length === 0 ? (
            <div className="p-6 text-sm text-slate-600">No leads found.</div>
          ) : (
            <div className="divide-y divide-slate-100">
              {displayed.map((l) => (
                <div key={l._id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {l?.name || "—"}
                      </div>
                      <div className="text-xs text-slate-600 truncate">
                        {l?.company || "—"}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={statusBadge(l?.status)}>
                          {l?.status || "—"}
                        </span>
                        {pill(l?.source)}
                        {pill(l?.leadType)}
                      </div>
                    </div>

                    <button
                      onClick={() => openDrawer(l)}
                      className={cn(
                        "shrink-0 rounded-xl bg-slate-900 px-3 py-2 text-xs font-bold text-white",
                        "hover:bg-slate-800 transition inline-flex items-center gap-2",
                        "focus:outline-none focus:ring-2 focus:ring-slate-300"
                      )}
                    >
                      <FiEye />
                      View
                    </button>
                  </div>

                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-slate-500">Phone</div>
                      <div className="font-semibold text-slate-900">
                        {l?.phone || "—"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <div className="text-slate-500">City</div>
                      <div className="font-semibold text-slate-900">
                        {l?.city || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Note:</span>{" "}
                    <span className="text-slate-700">
                      {l?.descriptionText ||
                        l?.description ||
                        l?.requirement ||
                        "—"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <a
                      className={cn(
                        "flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2",
                        "text-xs font-bold text-slate-800 hover:bg-slate-50",
                        "inline-flex items-center justify-center gap-2"
                      )}
                      href={l?.phone ? `tel:${l.phone}` : undefined}
                      onClick={(e) => !l?.phone && e.preventDefault()}
                    >
                      <FiPhoneCall /> Call
                    </a>
                    <a
                      className={cn(
                        "flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2",
                        "text-xs font-bold text-slate-800 hover:bg-slate-50",
                        "inline-flex items-center justify-center gap-2"
                      )}
                      href={l?.phone ? `https://wa.me/91${l.phone}` : undefined}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => !l?.phone && e.preventDefault()}
                    >
                      <FiMessageCircle /> WhatsApp
                    </a>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-400 flex flex-wrap gap-2 justify-between">
                    <span>Updated: {fmtDate(l?.updatedAt)}</span>
                    <span>Assigned: {pickName(l?.assignedTo)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="border-t border-slate-100 p-3 sm:p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-slate-600">
              Page{" "}
              <span className="font-semibold text-slate-900">{safePage}</span> /{" "}
              <span className="font-semibold text-slate-900">{pages}</span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage <= 1}
                className={cn(
                  "rounded-xl border border-slate-200 bg-white px-3 py-2",
                  "text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50",
                  "disabled:opacity-50 transition inline-flex items-center gap-2",
                  "focus:outline-none focus:ring-2 focus:ring-slate-200"
                )}
              >
                <FiChevronLeft /> Prev
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={safePage >= pages}
                className={cn(
                  "rounded-xl border border-slate-200 bg-white px-3 py-2",
                  "text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50",
                  "disabled:opacity-50 transition inline-flex items-center gap-2",
                  "focus:outline-none focus:ring-2 focus:ring-slate-200"
                )}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {open && selected ? (
        <LeadDrawer lead={selected} onClose={closeDrawer} />
      ) : null}
    </div>
  );
}

/* ---------------- Drawer ---------------- */

function LeadDrawer({ lead, onClose }) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
      />

      {/* ✅ responsive drawer: bottom sheet on mobile, side drawer on sm+ */}
      <div
        className={cn(
          "absolute bg-white shadow-2xl border-slate-100 flex flex-col",
          // mobile bottom sheet
          "left-0 right-0 bottom-0 max-h-[88vh] rounded-t-3xl border-t",
          // sm+ right drawer
          "sm:top-0 sm:bottom-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none",
          "sm:w-full sm:max-w-[520px] sm:rounded-none sm:border-l sm:border-t-0"
        )}
      >
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
              {lead?.name || "Lead Details"}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 truncate">
              {lead?.company || "—"}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={statusBadge(lead?.status)}>
                {lead?.status || "—"}
              </span>
              {pill(lead?.source)}
              {pill(lead?.leadType)}
            </div>
          </div>

          <button
            onClick={onClose}
            className={cn(
              "shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2",
              "text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 transition",
              "inline-flex items-center gap-2",
              "focus:outline-none focus:ring-2 focus:ring-slate-200"
            )}
          >
            <FiX />
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <Section title="Basic Information">
            <GridRow label="Phone" value={lead?.phone} />
            <GridRow label="Email" value={lead?.email} />
            <GridRow label="City" value={lead?.city} />
            <GridRow label="Address" value={lead?.address} />
          </Section>

          <Section title="Description / Requirement">
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">
              {lead?.descriptionText || lead?.description || lead?.requirement || "—"}
            </div>
          </Section>

          <Section title="Lead Management">
            <GridRow label="Assigned To" value={pickName(lead?.assignedTo)} />
            <GridRow label="Updated At" value={fmtDate(lead?.updatedAt)} />
          </Section>
        </div>

        <div className="p-4 sm:p-5 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row gap-2">
            <a
              className={cn(
                "flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center",
                "text-xs sm:text-sm font-bold text-white hover:bg-slate-800 transition",
                "inline-flex items-center justify-center gap-2"
              )}
              href={lead?.phone ? `tel:${lead.phone}` : undefined}
              onClick={(e) => !lead?.phone && e.preventDefault()}
            >
              <FiPhoneCall />
              Call
            </a>
            <a
              className={cn(
                "flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-center",
                "text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 transition",
                "inline-flex items-center justify-center gap-2"
              )}
              href={lead?.phone ? `https://wa.me/91${lead.phone}` : undefined}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => !lead?.phone && e.preventDefault()}
            >
              <FiMessageCircle />
              WhatsApp
            </a>
          </div>

          <div className="mt-3 text-[11px] text-slate-400">
            Tip: On mobile, this opens as a bottom sheet for better usability.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Small UI Helpers ---------------- */

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-5">
      <h4 className="mb-3 text-sm font-bold text-slate-900">{title}</h4>
      {children}
    </div>
  );
}

function GridRow({ label, value }) {
  const show = value === 0 ? "0" : value;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 py-2 text-sm">
      <div className="font-bold text-slate-600">{label}</div>
      <div className="sm:col-span-2 text-slate-800 break-words">
        {show ? String(show) : "—"}
      </div>
    </div>
  );
}