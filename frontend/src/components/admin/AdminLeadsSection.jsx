// src/components/admin/AdminLeadsSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";

const allowedStatuses = ["New", "Follow-Up", "Closed", "Converted"];
const allowedLeadTypes = ["Buyer", "Contractor", "Seller", "Manufacturer"];
const PAGE_SIZES = [10, 20, 50, 100];

const pill = (text) =>
  text ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
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

const statusBadge = (status = "") => {
  const s = String(status).toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  if (s === "converted") return `${base} bg-green-100 text-green-800`;
  if (s === "closed") return `${base} bg-slate-200 text-slate-800`;
  if (s === "follow-up" || s === "followup")
    return `${base} bg-amber-100 text-amber-800`;
  if (s === "new") return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-slate-100 text-slate-700`;
};

const leadTypeBadge = (leadType = "") => {
  const t = String(leadType).toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  if (t === "buyer") return `${base} bg-indigo-100 text-indigo-800`;
  if (t === "contractor") return `${base} bg-cyan-100 text-cyan-800`;
  if (t === "seller") return `${base} bg-purple-100 text-purple-800`;
  if (t === "manufacturer") return `${base} bg-rose-100 text-rose-800`;
  return `${base} bg-slate-100 text-slate-700`;
};

const normalizeUserList = (data) => {
  // supports: {data:[...]} or [...], and your auth slice style res.data?.data ?? []
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

export default function AdminLeadsSection() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]); // current page items (server-side) OR all items (fallback)
  const [error, setError] = useState("");

  // Users for dropdowns
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [leadType, setLeadType] = useState("All");
  const [owner, setOwner] = useState("All"); // dropdown

  // pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [serverPagination, setServerPagination] = useState(null); // {total,page,limit,pages} if backend supports it

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
    owner: "", // userId
    assignedTo: "", // userId
  });

  // ===== Fetch users for dropdowns =====
  const fetchUsers = async () => {
    try {
      setUsersLoading(true);
      // Your existing endpoint used in authSlice: "/auth/sales-executive"
      const res = await axiosClient.get("/auth/sales-executive");
      const list = normalizeUserList(res.data);
      setUsers(list);
    } catch (err) {
      // Keep UI usable even if users load fails
      console.error("fetchUsers error:", err);
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  // ===== Fetch admin leads (supports server pagination if backend supports it) =====
  const fetchAdminLeads = async (opts = {}) => {
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

      // expected:
      // A) { items: [...], pagination: { total, page, limit, pages } }
      // B) { items: [...] } (no pagination)
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
        setServerPagination(null); // fallback: client side pagination
      }
    } catch (err) {
      setItems([]);
      setServerPagination(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load admin leads"
      );
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchAdminLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When filters/limit change, reset to page 1 and reload
  useEffect(() => {
    setPage(1);
    fetchAdminLeads({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, leadType, owner, limit]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchAdminLeads({ page: 1 });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // Client-side pagination fallback (when backend doesn't return pagination)
  const clientPagination = useMemo(() => {
    if (serverPagination) return null;
    const total = items.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const safePage = Math.min(Math.max(page, 1), pages);
    return { total, pages, page: safePage, limit };
  }, [items, limit, page, serverPagination]);

  const displayedRows = useMemo(() => {
    if (serverPagination) return items; // server already paginated
    const pg = clientPagination;
    if (!pg) return items;
    const start = (pg.page - 1) * pg.limit;
    return items.slice(start, start + pg.limit);
  }, [items, serverPagination, clientPagination]);

  const effectivePagination = serverPagination || clientPagination;

  const resetFilters = () => {
    setSearch("");
    setStatus("All");
    setLeadType("All");
    setOwner("All");
    setLimit(20);
    setPage(1);
    setTimeout(() => fetchAdminLeads({ page: 1, limit: 20 }), 0);
  };

  const openDrawer = (lead) => {
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
        lead?.assignedTo?._id || (typeof lead?.assignedTo === "string" ? lead.assignedTo : "") || "",
    });
    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
    setSelected(null);
    setEditMode(false);
  };

  const saveLead = async () => {
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
        // Update in current list
        setItems((prev) => prev.map((x) => (x._id === updated._id ? updated : x)));
        setSelected(updated);
      }

      setEditMode(false);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to update lead"
      );
    }
  };

  const deleteLead = async () => {
    if (!selected?._id) return;

    const ok = window.confirm("Delete this lead? This cannot be undone.");
    if (!ok) return;

    try {
      setError("");
      await axiosClient.delete(`/admin/leads/${selected._id}`);

      // If server pagination, refetch current page (because total changed)
      if (serverPagination) {
        closeDrawer();
        fetchAdminLeads({ page });
        return;
      }

      // Client fallback: remove locally
      setItems((prev) => prev.filter((x) => x._id !== selected._id));
      closeDrawer();
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || "Failed to delete lead"
      );
    }
  };

  const goToPage = (p) => {
    const pages = effectivePagination?.pages || 1;
    const next = Math.min(Math.max(p, 1), pages);
    setPage(next);
    if (serverPagination) fetchAdminLeads({ page: next });
  };

  const OwnerSelect = ({ value, onChange, includeAll = false, includeEmpty = false, disabled = false }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
    >
      {includeAll ? <option value="All">All Owners</option> : null}
      {includeEmpty ? <option value="">— Not set —</option> : null}
      {users.map((u) => (
        <option key={u._id} value={u._id}>
          {u.name}{u.email ? ` (${u.email})` : ""}
        </option>
      ))}
    </select>
  );

  const AssignedSelect = ({ value, onChange, includeEmpty = true, disabled = false }) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
    >
      {includeEmpty ? <option value="">— Unassigned —</option> : null}
      {users.map((u) => (
        <option key={u._id} value={u._id}>
          {u.name}{u.email ? ` (${u.email})` : ""}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-[70vh] rounded-2xl bg-[#EFF6FF] p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Admin Leads</h2>
          <p className="text-sm text-slate-600">
            View and manage all leads (Admin only).
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => fetchUsers()}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            {usersLoading ? "Loading Users..." : "Reload Users"}
          </button>

          <button
            onClick={() => fetchAdminLeads()}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Filters + Pagination controls */}
      <div className="mb-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="grid gap-3 md:grid-cols-12">
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Search
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name / Company / Phone / City…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
            <div className="mt-1 text-[11px] text-slate-400">
              Auto-search after typing (350ms).
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="All">All</option>
              {allowedStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Lead Type
            </label>
            <select
              value={leadType}
              onChange={(e) => setLeadType(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value="All">All</option>
              {allowedLeadTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* ✅ Owner dropdown filter */}
          <div className="md:col-span-4">
            <label className="mb-1 block text-xs font-semibold text-slate-600">
              Owner
            </label>
            <OwnerSelect
              value={owner}
              onChange={setOwner}
              includeAll
              disabled={usersLoading}
            />
            <div className="mt-1 text-[11px] text-slate-400">
              Owner dropdown replaces typing userId.
            </div>
          </div>

          {/* Pagination controls */}
          <div className="md:col-span-12 mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => fetchAdminLeads({ page: 1 })}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Apply Now
              </button>
              <button
                onClick={resetFilters}
                className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
              >
                Reset
              </button>

              <div className="ml-0 sm:ml-2 inline-flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Rows</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>

                {serverPagination ? (
                  <span className="text-xs text-slate-500">
                    Server pagination enabled
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">
                    Client pagination fallback
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <button
                onClick={() => goToPage((effectivePagination?.page || page) - 1)}
                disabled={(effectivePagination?.page || page) <= 1}
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Prev
              </button>

              <div className="text-sm text-slate-700">
                Page{" "}
                <span className="font-semibold">
                  {effectivePagination?.page || page}
                </span>{" "}
                of{" "}
                <span className="font-semibold">
                  {effectivePagination?.pages || 1}
                </span>
                {typeof effectivePagination?.total === "number" ? (
                  <span className="text-slate-400">
                    {" "}
                    • Total {effectivePagination.total}
                  </span>
                ) : null}
              </div>

              <button
                onClick={() => goToPage((effectivePagination?.page || page) + 1)}
                disabled={
                  (effectivePagination?.page || page) >=
                  (effectivePagination?.pages || 1)
                }
                className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <p className="text-sm text-slate-600">
            Showing{" "}
            <span className="font-semibold text-slate-900">
              {displayedRows.length}
            </span>{" "}
            leads
          </p>

          {error ? (
            <span className="text-sm font-semibold text-red-600">{error}</span>
          ) : (
            <span className="text-sm text-slate-500">
              Updated: {fmtDate(displayedRows?.[0]?.updatedAt)}
            </span>
          )}
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading leads…</div>
        ) : displayedRows.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[1200px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {displayedRows.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {l?.name || "—"}
                      </div>
                      <div className="text-xs text-slate-600">
                        {l?.company || "—"}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {pill(l?.email)}
                        {pill(l?.source)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span className={leadTypeBadge(l?.leadType)}>
                        {l?.leadType || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {l?.phone || "—"}
                      </div>
                      <div className="mt-2 flex gap-2">
                        <a
                          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          href={l?.phone ? `tel:${l.phone}` : undefined}
                          onClick={(e) => !l?.phone && e.preventDefault()}
                        >
                          Call
                        </a>
                        <a
                          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          href={
                            l?.phone ? `https://wa.me/91${l.phone}` : undefined
                          }
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => !l?.phone && e.preventDefault()}
                        >
                          WhatsApp
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3">{l?.city || "—"}</td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">
                        {pickName(l?.owner)}
                      </div>
                    </td>

                    <td className="px-4 py-3">{pickName(l?.assignedTo)}</td>

                    <td className="px-4 py-3">
                      <span className={statusBadge(l?.status)}>
                        {l?.status || "—"}
                      </span>
                    </td>

                    <td className="px-4 py-3">{fmtDate(l?.updatedAt)}</td>

                    <td className="px-4 py-3">
                      <button
                        onClick={() => openDrawer(l)}
                        className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                      >
                        View / Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pagination Bar */}
        <div className="flex flex-col gap-2 border-t border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {typeof effectivePagination?.total === "number" ? (
              <>
                Total <span className="font-semibold text-slate-900">{effectivePagination.total}</span>{" "}
                • Page <span className="font-semibold text-slate-900">{effectivePagination.page}</span> /{" "}
                <span className="font-semibold text-slate-900">{effectivePagination.pages}</span>
              </>
            ) : (
              <>
                Page <span className="font-semibold text-slate-900">{effectivePagination?.page || page}</span> /{" "}
                <span className="font-semibold text-slate-900">{effectivePagination?.pages || 1}</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(1)}
              disabled={(effectivePagination?.page || page) <= 1}
              className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={() => goToPage((effectivePagination?.page || page) - 1)}
              disabled={(effectivePagination?.page || page) <= 1}
              className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => goToPage((effectivePagination?.page || page) + 1)}
              disabled={
                (effectivePagination?.page || page) >= (effectivePagination?.pages || 1)
              }
              className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => goToPage(effectivePagination?.pages || 1)}
              disabled={
                (effectivePagination?.page || page) >= (effectivePagination?.pages || 1)
              }
              className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      </div>

      {/* Drawer */}
      {open && selected ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />

          <div className="absolute right-0 top-0 h-full w-full max-w-[560px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selected?.name || "Lead Details"}
                </h3>
                <p className="text-sm text-slate-600">
                  {selected?.company || "—"}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={leadTypeBadge(form.leadType)}>{form.leadType}</span>
                  <span className={statusBadge(form.status)}>{form.status}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setEditMode((v) => !v)}
                  className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {editMode ? "Cancel" : "Edit"}
                </button>
                <button
                  onClick={closeDrawer}
                  className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
              {error ? (
                <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 ring-1 ring-red-200">
                  {error}
                </div>
              ) : null}

              <Section title="Basic Info">
                <TwoCol
                  label="Name"
                  value={form.name}
                  readOnly={!editMode}
                  onChange={(v) => setForm((p) => ({ ...p, name: v }))}
                />
                <TwoCol
                  label="Company"
                  value={form.company}
                  readOnly={!editMode}
                  onChange={(v) => setForm((p) => ({ ...p, company: v }))}
                />
                <TwoCol
                  label="Phone"
                  value={form.phone}
                  readOnly={!editMode}
                  onChange={(v) => setForm((p) => ({ ...p, phone: v }))}
                />
                <TwoCol
                  label="Email"
                  value={form.email}
                  readOnly={!editMode}
                  onChange={(v) => setForm((p) => ({ ...p, email: v }))}
                />
                <TwoCol
                  label="City"
                  value={form.city}
                  readOnly={!editMode}
                  onChange={(v) => setForm((p) => ({ ...p, city: v }))}
                />
                <TwoCol
                  label="Address"
                  value={form.address}
                  readOnly={!editMode}
                  onChange={(v) => setForm((p) => ({ ...p, address: v }))}
                />
              </Section>

              <Section title="Description / Requirement">
                <Label className="mb-1">Description</Label>
                {editMode ? (
                  <textarea
                    value={form.description}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, description: e.target.value }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                    rows={4}
                  />
                ) : (
                  <div className="text-sm text-slate-800">
                    {form.description ? (
                      form.description
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                )}
              </Section>

              <Section title="Management">
                <Label className="mb-1">Lead Type</Label>
                {editMode ? (
                  <select
                    value={form.leadType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, leadType: e.target.value }))
                    }
                    className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
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
                    onChange={(e) =>
                      setForm((p) => ({ ...p, status: e.target.value }))
                    }
                    className="mb-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
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

                <TwoCol
                  label="Source"
                  value={form.source}
                  readOnly={!editMode}
                  onChange={(v) => setForm((p) => ({ ...p, source: v }))}
                />

                {/* ✅ Owner dropdown replaces typing userId */}
                <Label className="mb-1">Owner</Label>
                <div className="mb-3">
                  <OwnerSelect
                    value={form.owner}
                    onChange={(v) => setForm((p) => ({ ...p, owner: v }))}
                    includeEmpty
                    disabled={!editMode || usersLoading}
                  />
                </div>

                {/* ✅ Assigned dropdown replaces typing userId */}
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

              <div className="mt-4 flex gap-2">
                <a
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                  href={selected?.phone ? `tel:${selected.phone}` : undefined}
                  onClick={(e) => !selected?.phone && e.preventDefault()}
                >
                  Call
                </a>
                <a
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  href={
                    selected?.phone ? `https://wa.me/91${selected.phone}` : undefined
                  }
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => !selected?.phone && e.preventDefault()}
                >
                  WhatsApp
                </a>
              </div>

              <div className="mt-3 flex gap-2">
                {editMode ? (
                  <button
                    onClick={saveLead}
                    className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Edit Lead
                  </button>
                )}

                <button
                  onClick={deleteLead}
                  className="flex-1 rounded-xl bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                >
                  Delete
                </button>
              </div>

              <div className="mt-4 text-xs text-slate-500">
                Users list loaded from <span className="font-semibold">/auth/sales-executive</span>. If you want Admins too in dropdown,
                create a backend endpoint returning all users.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="mb-3 text-sm font-bold text-slate-900">{title}</h4>
      {children}
    </div>
  );
}

function GridRow({ label, value }) {
  const show = value === 0 ? "0" : value;
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <div className="col-span-1 font-semibold text-slate-600">{label}</div>
      <div className="col-span-2 text-slate-800">
        {show ? String(show) : "—"}
      </div>
    </div>
  );
}

function Label({ children, className = "" }) {
  return (
    <div className={`block text-xs font-semibold text-slate-600 ${className}`}>
      {children}
    </div>
  );
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
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      )}
    </div>
  );
}
