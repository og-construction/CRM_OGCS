// src/components/admin/AdminLeadsSection.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import {
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiPhoneCall,
  FiMessageCircle,
  FiEdit3,
  FiTrash2,
  FiSave,
} from "react-icons/fi";

const allowedStatuses = ["New", "Follow-Up", "Closed", "Converted"];
const allowedLeadTypes = ["Buyer", "Contractor", "Seller", "Manufacturer"];
const PAGE_SIZES = [10, 20, 50, 100];

const cn = (...a) => a.filter(Boolean).join(" ");

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

const pill = (text) =>
  text ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-700">
      {text}
    </span>
  ) : (
    <span className="text-slate-400">—</span>
  );

const statusBadge = (status = "") => {
  const s = String(status).toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset";
  if (s === "converted") return `${base} bg-green-50 text-green-800 ring-green-200`;
  if (s === "closed") return `${base} bg-slate-100 text-slate-800 ring-slate-200`;
  if (s === "follow-up" || s === "followup")
    return `${base} bg-amber-50 text-amber-800 ring-amber-200`;
  if (s === "new") return `${base} bg-blue-50 text-blue-800 ring-blue-200`;
  return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
};

const leadTypeBadge = (leadType = "") => {
  const t = String(leadType).toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset";
  if (t === "buyer") return `${base} bg-indigo-50 text-indigo-800 ring-indigo-200`;
  if (t === "contractor") return `${base} bg-cyan-50 text-cyan-800 ring-cyan-200`;
  if (t === "seller") return `${base} bg-purple-50 text-purple-800 ring-purple-200`;
  if (t === "manufacturer") return `${base} bg-rose-50 text-rose-800 ring-rose-200`;
  return `${base} bg-slate-50 text-slate-700 ring-slate-200`;
};

const normalizeUserList = (data) => {
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list
    .filter(Boolean)
    .map((u) => ({
      _id: u._id || u.id,
      name: u.name || u.fullName || u.email || "User",
      email: u.email || "",
      role: u.role || "",
      isActive: u.isActive,
    }))
    .filter((u) => u._id);
};

// ------------ small UI helpers (only UI) ------------
const inputBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none " +
  "focus:ring-2 focus:ring-sky-200 focus:border-sky-300";

const selectBase =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none " +
  "focus:ring-2 focus:ring-sky-200 focus:border-sky-300";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition active:scale-[0.99]";

const btnPrimary = `${btnBase} bg-slate-900 text-white hover:bg-slate-800`;
const btnGhost = `${btnBase} border border-slate-200 bg-white text-slate-800 hover:bg-slate-50`;
const btnDanger = `${btnBase} border border-red-200 bg-red-50 text-red-700 hover:bg-red-100`;

export default function AdminLeadsSection() {
  // core state
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  // users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [leadType, setLeadType] = useState("All");
  const [owner, setOwner] = useState("All");

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [serverPagination, setServerPagination] = useState(null);

  // drawer
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  // edit form
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    leadType: "Buyer",
    status: "New",
    name: "",
    company: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    description: "",
    source: "Manual",
    owner: "",
    assignedTo: "",
  });

  // ---------------- fetch users ----------------
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const res = await axiosClient.get("/auth/sales-executive");
      setUsers(normalizeUserList(res.data));
    } catch (err) {
      console.error("fetchUsers error:", err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  // ---------------- fetch leads ----------------
  const fetchAdminLeads = useCallback(
    async (opts = {}) => {
      try {
        setLoading(true);
        setError("");

        const params = {
          status,
          leadType,
          search,
          owner: owner && owner !== "All" ? owner : undefined,
          page: opts.page ?? page,
          limit: opts.limit ?? limit,
        };

        const res = await axiosClient.get("/admin/leads", { params });

        const list = Array.isArray(res.data?.items) ? res.data.items : [];
        setItems(list);

        const pg = res.data?.pagination;
        if (pg && typeof pg === "object" && Number.isFinite(pg.total)) {
          setServerPagination({
            total: pg.total,
            page: pg.page || params.page || 1,
            limit: pg.limit || params.limit || 20,
            pages: pg.pages || Math.max(1, Math.ceil(pg.total / (pg.limit || 20))),
          });
        } else {
          setServerPagination(null);
        }
      } catch (err) {
        setItems([]);
        setServerPagination(null);
        setError(err.response?.data?.message || err.message || "Failed to load admin leads");
      } finally {
        setLoading(false);
      }
    },
    [status, leadType, search, owner, page, limit]
  );

  // initial load
  useEffect(() => {
    fetchUsers();
    fetchAdminLeads();
  }, [fetchUsers, fetchAdminLeads]);

  // filters change => reset + fetch
  useEffect(() => {
    setPage(1);
    fetchAdminLeads({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, leadType, owner, limit]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchAdminLeads({ page: 1 });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // client pagination fallback
  const clientPagination = useMemo(() => {
    if (serverPagination) return null;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(page, 1), pages);
    return { total, pages, page: safePage, limit };
  }, [items, limit, page, serverPagination]);

  const displayedRows = useMemo(() => {
    if (serverPagination) return items;
    const pg = clientPagination;
    if (!pg) return items;
    const start = (pg.page - 1) * pg.limit;
    return items.slice(start, start + pg.limit);
  }, [items, serverPagination, clientPagination]);

  const effectivePagination = serverPagination || clientPagination;

  const resetFilters = useCallback(() => {
    setSearch("");
    setStatus("All");
    setLeadType("All");
    setOwner("All");
    setLimit(20);
    setPage(1);
    setTimeout(() => fetchAdminLeads({ page: 1, limit: 20 }), 0);
  }, [fetchAdminLeads]);

  const openDrawer = useCallback((lead) => {
    setSelected(lead);
    setEditMode(false);
    setForm({
      leadType: lead?.leadType || "Buyer",
      status: lead?.status || "New",
      name: lead?.name || "",
      company: lead?.company || "",
      phone: lead?.phone || "",
      email: lead?.email || "",
      city: lead?.city || "",
      address: lead?.address || "",
      description: lead?.description || lead?.requirement || "",
      source: lead?.source || "Manual",
      owner: lead?.owner?._id || (typeof lead?.owner === "string" ? lead.owner : "") || "",
      assignedTo:
        lead?.assignedTo?._id ||
        (typeof lead?.assignedTo === "string" ? lead.assignedTo : "") ||
        "",
    });
    setOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setOpen(false);
    setSelected(null);
    setEditMode(false);
  }, []);

  // close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeDrawer]);

  // prevent background scroll when drawer open (UI only)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const saveLead = useCallback(async () => {
    if (!selected?._id) return;

    try {
      setError("");

      const payload = {
        leadType: form.leadType,
        status: form.status,
        name: form.name,
        company: form.company,
        phone: form.phone || undefined,
        email: form.email || undefined,
        city: form.city,
        address: form.address,
        description: form.description,
        source: form.source,
        owner: form.owner || undefined,
        assignedTo: form.assignedTo || undefined,
      };

      const res = await axiosClient.put(`/admin/leads/${selected._id}`, payload);
      const updated = res.data?.lead;

      if (updated?._id) {
        setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
        setSelected(updated);
      }

      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to update lead");
    }
  }, [form, selected]);

  const deleteLead = useCallback(async () => {
    if (!selected?._id) return;

    const ok = window.confirm("Delete this lead? This cannot be undone.");
    if (!ok) return;

    try {
      setError("");
      await axiosClient.delete(`/admin/leads/${selected._id}`);

      if (serverPagination) {
        closeDrawer();
        fetchAdminLeads({ page });
        return;
      }

      setItems((prev) => prev.filter((x) => x._id !== selected._id));
      closeDrawer();
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to delete lead");
    }
  }, [selected, serverPagination, closeDrawer, fetchAdminLeads, page]);

  const goToPage = useCallback(
    (p) => {
      const pages = effectivePagination?.pages || 1;
      const next = Math.min(Math.max(p, 1), pages);
      setPage(next);
      if (serverPagination) fetchAdminLeads({ page: next });
    },
    [effectivePagination, serverPagination, fetchAdminLeads]
  );

  // ---------------- selects ----------------
  const OwnerSelect = ({
    value,
    onChange,
    includeAll = false,
    includeEmpty = false,
    disabled = false,
  }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        selectBase,
        "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      )}
    >
      {includeAll ? <option value="All">All Owners</option> : null}
      {includeEmpty ? <option value="">— Not set —</option> : null}
      {users.map((u) => (
        <option key={u._id} value={u._id}>
          {u.name}
          {u.email ? ` (${u.email})` : ""}
        </option>
      ))}
    </select>
  );

  const AssignedSelect = ({ value, onChange, includeEmpty = true, disabled = false }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        selectBase,
        "disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      )}
    >
      {includeEmpty ? <option value="">— Unassigned —</option> : null}
      {users.map((u) => (
        <option key={u._id} value={u._id}>
          {u.name}
          {u.email ? ` (${u.email})` : ""}
        </option>
      ))}
    </select>
  );

  const updatedLabel = useMemo(() => fmtDate(displayedRows?.[0]?.updatedAt), [displayedRows]);

  return (
    <div className="space-y-4">
      {/* ✅ CRM container */}
      <div className="rounded-3xl border border-slate-100 bg-gradient-to-b from-white to-slate-50/40 p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex items-start gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl border border-slate-200 bg-white flex items-center justify-center shrink-0">
              <FiUsers className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-900 truncate">
                Admin Leads
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                View and manage all leads (Admin only).
              </p>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
                  <FiFilter />
                  Status: <span className="font-semibold text-slate-900">{status}</span>
                </span>
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
                  Type: <span className="font-semibold text-slate-900">{leadType}</span>
                </span>
                <span className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-full border border-slate-200 bg-white text-slate-600">
                  Rows: <span className="font-semibold text-slate-900">{limit}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Header actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex gap-2 lg:justify-end">
            <button onClick={fetchUsers} className={btnGhost}>
              {usersLoading ? "Loading Users..." : "Reload Users"}
            </button>

            <button onClick={() => fetchAdminLeads()} className={btnGhost} disabled={loading}>
              <FiRefreshCw />
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 rounded-2xl bg-white p-3 sm:p-4 border border-slate-100 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-12 lg:items-end">
            {/* Search */}
            <div className="lg:col-span-5">
              <label className="text-xs font-semibold text-slate-600 flex items-center gap-2">
                <FiSearch /> Search
              </label>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name / Company / Phone / City…"
                className={cn(inputBase, "mt-1")}
              />
              <div className="mt-1 text-[11px] text-slate-400">Auto-search after typing (350ms).</div>
            </div>

            {/* Status */}
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={cn(selectBase, "mt-1")}>
                <option value="All">All</option>
                {allowedStatuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Lead Type */}
            <div className="lg:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Lead Type</label>
              <select
                value={leadType}
                onChange={(e) => setLeadType(e.target.value)}
                className={cn(selectBase, "mt-1")}
              >
                <option value="All">All</option>
                {allowedLeadTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Owner */}
            <div className="lg:col-span-3">
              <label className="text-xs font-semibold text-slate-600">Owner</label>
              <div className="mt-1">
                <OwnerSelect value={owner} onChange={setOwner} includeAll disabled={usersLoading} />
              </div>
              <div className="mt-1 text-[11px] text-slate-400">Owner dropdown (no userId typing).</div>
            </div>

            {/* Actions row */}
            <div className="lg:col-span-12 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button onClick={() => fetchAdminLeads({ page: 1 })} className={btnPrimary}>
                  Apply Now
                </button>

                <button onClick={resetFilters} className={btnGhost}>
                  <FiX />
                  Reset
                </button>

                <div className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-600">Rows</span>
                  <select
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                    className="text-sm bg-transparent outline-none"
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 sm:justify-end">
                <button
                  onClick={() => goToPage((effectivePagination?.page || page) - 1)}
                  disabled={(effectivePagination?.page || page) <= 1}
                  className={btnGhost}
                >
                  <FiChevronLeft />
                  Prev
                </button>

                <div className="text-xs sm:text-sm text-slate-700">
                  Page{" "}
                  <span className="font-semibold">{effectivePagination?.page || page}</span> of{" "}
                  <span className="font-semibold">{effectivePagination?.pages || 1}</span>
                  {typeof effectivePagination?.total === "number" ? (
                    <span className="text-slate-400"> • Total {effectivePagination.total}</span>
                  ) : null}
                </div>

                <button
                  onClick={() => goToPage((effectivePagination?.page || page) + 1)}
                  disabled={(effectivePagination?.page || page) >= (effectivePagination?.pages || 1)}
                  className={btnGhost}
                >
                  Next
                  <FiChevronRight />
                </button>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="mt-4 rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 p-4">
            <p className="text-sm text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">{displayedRows.length}</span> leads
            </p>

            {!error ? <span className="text-xs text-slate-500">Updated: {updatedLabel}</span> : null}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
            {loading ? (
              <div className="p-6 text-sm text-slate-600">Loading leads…</div>
            ) : displayedRows.length === 0 ? (
              <div className="p-6 text-sm text-slate-600">No leads found.</div>
            ) : (
              <table className="min-w-[1200px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-600 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3">Lead</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">City</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Assigned</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Updated</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {displayedRows.map((l) => (
                    <tr key={l._id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{l?.name || "—"}</div>
                        <div className="text-xs text-slate-600">{l?.company || "—"}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {pill(l?.email)}
                          {pill(l?.source)}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span className={leadTypeBadge(l?.leadType)}>{l?.leadType || "—"}</span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{l?.phone || "—"}</div>
                        <div className="mt-2 flex gap-2">
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

                      <td className="px-4 py-3">{l?.city || "—"}</td>
                      <td className="px-4 py-3">{pickName(l?.owner)}</td>
                      <td className="px-4 py-3">{pickName(l?.assignedTo)}</td>

                      <td className="px-4 py-3">
                        <span className={statusBadge(l?.status)}>{l?.status || "—"}</span>
                      </td>

                      <td className="px-4 py-3">{fmtDate(l?.updatedAt)}</td>

                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openDrawer(l)} className={btnPrimary}>
                          <FiEdit3 />
                          View / Edit
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
            ) : displayedRows.length === 0 ? (
              <div className="p-6 text-sm text-slate-600">No leads found.</div>
            ) : (
              <div className="divide-y divide-slate-100">
                {displayedRows.map((l) => (
                  <div key={l._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">
                          {l?.name || "—"}
                        </div>
                        <div className="text-xs text-slate-600 truncate">{l?.company || "—"}</div>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className={leadTypeBadge(l?.leadType)}>{l?.leadType || "—"}</span>
                          <span className={statusBadge(l?.status)}>{l?.status || "—"}</span>
                        </div>
                      </div>

                      <button onClick={() => openDrawer(l)} className={btnPrimary}>
                        <FiEdit3 />
                        View
                      </button>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="text-slate-500">Phone</div>
                        <div className="font-semibold text-slate-900">{l?.phone || "—"}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="text-slate-500">City</div>
                        <div className="font-semibold text-slate-900">{l?.city || "—"}</div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="text-slate-500">Owner</div>
                        <div className="font-semibold text-slate-900 truncate">
                          {pickName(l?.owner)}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                        <div className="text-slate-500">Assigned</div>
                        <div className="font-semibold text-slate-900 truncate">
                          {pickName(l?.assignedTo)}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {pill(l?.email)}
                      {pill(l?.source)}
                      <span className="text-[11px] text-slate-400 ml-auto">
                        Updated: {fmtDate(l?.updatedAt)}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <a
                        className={btnGhost}
                        href={l?.phone ? `tel:${l.phone}` : undefined}
                        onClick={(e) => !l?.phone && e.preventDefault()}
                      >
                        <FiPhoneCall /> Call
                      </a>
                      <a
                        className={btnGhost}
                        href={l?.phone ? `https://wa.me/91${l.phone}` : undefined}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => !l?.phone && e.preventDefault()}
                      >
                        <FiMessageCircle /> WhatsApp
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bottom pagination bar */}
          <div className="border-t border-slate-100 p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs sm:text-sm text-slate-600">
                {typeof effectivePagination?.total === "number" ? (
                  <>
                    Total{" "}
                    <span className="font-semibold text-slate-900">{effectivePagination.total}</span>{" "}
                    • Page{" "}
                    <span className="font-semibold text-slate-900">{effectivePagination.page}</span>{" "}
                    / <span className="font-semibold text-slate-900">{effectivePagination.pages}</span>
                  </>
                ) : (
                  <>
                    Page{" "}
                    <span className="font-semibold text-slate-900">
                      {effectivePagination?.page || page}
                    </span>{" "}
                    / <span className="font-semibold text-slate-900">{effectivePagination?.pages || 1}</span>
                  </>
                )}
              </div>

              <div className="grid grid-cols-4 sm:flex items-center gap-2 justify-end">
                <button
                  onClick={() => goToPage(1)}
                  disabled={(effectivePagination?.page || page) <= 1}
                  className={btnGhost}
                >
                  First
                </button>
                <button
                  onClick={() => goToPage((effectivePagination?.page || page) - 1)}
                  disabled={(effectivePagination?.page || page) <= 1}
                  className={btnGhost}
                >
                  Prev
                </button>
                <button
                  onClick={() => goToPage((effectivePagination?.page || page) + 1)}
                  disabled={(effectivePagination?.page || page) >= (effectivePagination?.pages || 1)}
                  className={btnGhost}
                >
                  Next
                </button>
                <button
                  onClick={() => goToPage(effectivePagination?.pages || 1)}
                  disabled={(effectivePagination?.page || page) >= (effectivePagination?.pages || 1)}
                  className={btnGhost}
                >
                  Last
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {open && selected ? (
        <LeadDrawer
          selected={selected}
          form={form}
          setForm={setForm}
          editMode={editMode}
          setEditMode={setEditMode}
          usersLoading={usersLoading}
          error={error}
          onClose={closeDrawer}
          onSave={saveLead}
          onDelete={deleteLead}
          OwnerSelect={OwnerSelect}
          AssignedSelect={AssignedSelect}
        />
      ) : null}
    </div>
  );
}

/* -------------------------------- Drawer -------------------------------- */

function LeadDrawer({
  selected,
  form,
  setForm,
  editMode,
  setEditMode,
  usersLoading,
  error,
  onClose,
  onSave,
  onDelete,
  OwnerSelect,
  AssignedSelect,
}) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]"
      />

      {/* Bottom sheet on mobile, side drawer on desktop */}
      <div className="absolute inset-0 flex items-end md:items-stretch md:justify-end">
        <div
          role="dialog"
          aria-modal="true"
          className={cn(
            "bg-white shadow-2xl border-slate-100 ring-1 ring-black/5 flex flex-col",
            "w-full md:max-w-[560px] md:h-full",
            "h-[92vh] md:h-full",
            "rounded-t-3xl md:rounded-none md:rounded-l-2xl",
            "border md:border-l"
          )}
        >
          {/* Drag handle (mobile) */}
          <div className="md:hidden relative">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-1.5 rounded-full bg-slate-200" />
          </div>

          {/* Header (sticky) */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-100 p-4 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {selected?.name || "Lead Details"}
              </div>
              <div className="text-xs sm:text-sm text-slate-600 truncate">{selected?.company || "—"}</div>

              <div className="mt-2 flex flex-wrap gap-2">
                <span className={leadTypeBadge(form.leadType)}>{form.leadType}</span>
                <span className={statusBadge(form.status)}>{form.status}</span>
              </div>
            </div>

            <div className="shrink-0 flex gap-2">
              <button
                onClick={() => setEditMode((v) => !v)}
                className={btnPrimary}
              >
                <FiEdit3 />
                {editMode ? "Cancel" : "Edit"}
              </button>

              <button onClick={onClose} className={btnGhost}>
                <FiX />
                <span className="hidden sm:inline">Close</span>
              </button>
            </div>
          </div>

          {/* Body (scroll area) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {error ? (
              <div className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 border border-red-200">
                {error}
              </div>
            ) : null}

            <Section title="Basic Info">
              <TwoCol label="Name" value={form.name} readOnly={!editMode} onChange={(v) => setForm((p) => ({ ...p, name: v }))} />
              <TwoCol label="Company" value={form.company} readOnly={!editMode} onChange={(v) => setForm((p) => ({ ...p, company: v }))} />
              <TwoCol label="Phone" value={form.phone} readOnly={!editMode} onChange={(v) => setForm((p) => ({ ...p, phone: v }))} />
              <TwoCol label="Email" value={form.email} readOnly={!editMode} onChange={(v) => setForm((p) => ({ ...p, email: v }))} />
              <TwoCol label="City" value={form.city} readOnly={!editMode} onChange={(v) => setForm((p) => ({ ...p, city: v }))} />
              <TwoCol label="Address" value={form.address} readOnly={!editMode} onChange={(v) => setForm((p) => ({ ...p, address: v }))} />
            </Section>

            <Section title="Description / Requirement">
              <Label className="mb-1">Description</Label>
              {editMode ? (
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  className={inputBase}
                  rows={4}
                />
              ) : (
                <div className="text-sm text-slate-800 whitespace-pre-wrap">
                  {form.description ? form.description : <span className="text-slate-400">—</span>}
                </div>
              )}
            </Section>

            <Section title="Management">
              <Label className="mb-1">Lead Type</Label>
              {editMode ? (
                <select
                  value={form.leadType}
                  onChange={(e) => setForm((p) => ({ ...p, leadType: e.target.value }))}
                  className={cn(selectBase, "mb-3")}
                >
                  {allowedLeadTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mb-3">{pill(form.leadType)}</div>
              )}

              <Label className="mb-1">Status</Label>
              {editMode ? (
                <select
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  className={cn(selectBase, "mb-3")}
                >
                  {allowedStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mb-3">{pill(form.status)}</div>
              )}

              <TwoCol label="Source" value={form.source} readOnly={!editMode} onChange={(v) => setForm((p) => ({ ...p, source: v }))} />

              <Label className="mb-1">Owner</Label>
              <div className="mb-3">
                <OwnerSelect
                  value={form.owner}
                  onChange={(v) => setForm((p) => ({ ...p, owner: v }))}
                  includeEmpty
                  disabled={!editMode || usersLoading}
                />
              </div>

              <Label className="mb-1">Assigned To</Label>
              <div className="mb-3">
                <AssignedSelect
                  value={form.assignedTo}
                  onChange={(v) => setForm((p) => ({ ...p, assignedTo: v }))}
                  disabled={!editMode || usersLoading}
                />
              </div>
            </Section>

            <Section title="Audit">
              <GridRow label="Created At" value={fmtDate(selected?.createdAt)} />
              <GridRow label="Updated At" value={fmtDate(selected?.updatedAt)} />
            </Section>
          </div>

          {/* Footer actions (sticky on mobile) */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur border-t border-slate-100 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <a
                className={btnPrimary}
                href={selected?.phone ? `tel:${selected.phone}` : undefined}
                onClick={(e) => !selected?.phone && e.preventDefault()}
              >
                <FiPhoneCall />
                Call
              </a>
              <a
                className={btnGhost}
                href={selected?.phone ? `https://wa.me/91${selected.phone}` : undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => !selected?.phone && e.preventDefault()}
              >
                <FiMessageCircle />
                WhatsApp
              </a>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {editMode ? (
                <button onClick={onSave} className={btnPrimary}>
                  <FiSave />
                  Save
                </button>
              ) : (
                <button onClick={() => setEditMode(true)} className={btnPrimary}>
                  <FiEdit3 />
                  Edit
                </button>
              )}

              <button onClick={onDelete} className={btnDanger}>
                <FiTrash2 />
                Delete
              </button>
            </div>

            <div className="text-[11px] text-slate-500">
              Users dropdown loaded from <span className="font-semibold">/auth/sales-executive</span>.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------- Small UI Components -------------------------------- */

function Section({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="mb-3 text-sm font-bold text-slate-900">{title}</h4>
      {children}
    </div>
  );
}

function GridRow({ label, value }) {
  const show = value === 0 ? "0" : value;
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <div className="col-span-1 font-bold text-slate-600">{label}</div>
      <div className="col-span-2 text-slate-800">{show ? String(show) : "—"}</div>
    </div>
  );
}

function Label({ children, className = "" }) {
  return <div className={`block text-xs font-bold text-slate-600 ${className}`}>{children}</div>;
}

function TwoCol({ label, value, readOnly, onChange }) {
  return (
    <div className="mb-3">
      <Label className="mb-1">{label}</Label>
      {readOnly ? (
        <div className="text-sm text-slate-800">
          {value ? value : <span className="text-slate-400">—</span>}
        </div>
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} className={inputBase} />
      )}
    </div>
  );
}