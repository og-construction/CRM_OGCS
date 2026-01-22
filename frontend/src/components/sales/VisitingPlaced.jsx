// src/components/sales/VisitingPlaces.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiImage,
  FiChevronLeft,
  FiChevronRight,
  FiEdit2,
  FiTrash2,
  FiX,
  FiSave,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

const prettyDT = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString("en-IN");
};

export default function VisitingPlaces() {
  // ✅ form state
  const [form, setForm] = useState({
    companyName: "",
    personName: "",
    partyType: "Buyer",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    address: "",
    status: "Visited",
    visitedAt: "", // datetime-local
    notes: "",
  });

  const [visitImage, setVisitImage] = useState(null);
  const [visitingCardImage, setVisitingCardImage] = useState(null);

  // ✅ list state
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ filters
  const [q, setQ] = useState("");
  const [partyType, setPartyType] = useState("");
  const [status, setStatus] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  // ✅ paging
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // ✅ Edit/Delete state
  const [editOpen, setEditOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [editVisitImage, setEditVisitImage] = useState(null);
  const [editVisitingCardImage, setEditVisitingCardImage] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  const statusOptions = ["Planned", "Visited", "Follow-Up", "Closed", "Not Interested"];
  const partyOptions = ["Seller", "Manufacturer", "Buyer", "Customer"];

  const canPrev = page > 1;
  const canNext = page < totalPages;

  const fetchData = async (p = page) => {
    setLoading(true);
    setErr("");
    try {
      const params = {
        page: p,
        limit,
        q: q.trim() || undefined,
        partyType: partyType || undefined,
        status: status || undefined,
        from: from ? new Date(from).toISOString() : undefined,
        to: to ? new Date(to).toISOString() : undefined,
        onlyMine: 1, // sales sees own
      };

      const res = await axiosClient.get("/visiting-places", { params });
      setItems(res.data.items || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
      setPage(res.data.page || p);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const onChange = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const resetForm = () => {
    setForm({
      companyName: "",
      personName: "",
      partyType: "Buyer",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
      address: "",
      status: "Visited",
      visitedAt: "",
      notes: "",
    });
    setVisitImage(null);
    setVisitingCardImage(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErr("");
    setMsg("");

    try {
      if (!form.companyName || !form.partyType || !form.contactName || !form.visitedAt) {
        throw new Error("Company Name, Party Type, Contact Name, Visited Date+Time required.");
      }

      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v ?? ""));
      if (visitImage) fd.append("visitImage", visitImage);
      if (visitingCardImage) fd.append("visitingCardImage", visitingCardImage);

      await axiosClient.post("/visiting-places", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Visit saved");
      resetForm();
      fetchData(1);
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const excelRows = useMemo(() => {
    return items.map((it, idx) => ({
      sNo: (page - 1) * limit + idx + 1,
      ...it,
    }));
  }, [items, page, limit]);

  // ✅ Edit helpers
  const openEdit = (row) => {
    setErr("");
    setMsg("");
    setEditRow({
      _id: row._id,
      companyName: row.companyName || "",
      personName: row.personName || "",
      partyType: row.partyType || "Buyer",
      contactName: row.contactName || "",
      contactPhone: row.contactPhone || "",
      contactEmail: row.contactEmail || "",
      address: row.address || "",
      status: row.status || "Visited",
      visitedAt: row.visitedAt ? new Date(row.visitedAt).toISOString().slice(0, 16) : "",
      notes: row.notes || "",
    });
    setEditVisitImage(null);
    setEditVisitingCardImage(null);
    setEditOpen(true);
  };

  const closeEdit = () => {
    setEditOpen(false);
    setEditRow(null);
    setEditVisitImage(null);
    setEditVisitingCardImage(null);
  };

  const updateVisit = async (e) => {
    e.preventDefault();
    if (!editRow?._id) return;

    setUpdating(true);
    setErr("");
    setMsg("");

    try {
      if (!editRow.companyName || !editRow.partyType || !editRow.contactName || !editRow.visitedAt) {
        throw new Error("Company Name, Party Type, Contact Name, Date+Time required.");
      }

      const fd = new FormData();
      Object.entries(editRow).forEach(([k, v]) => {
        if (k !== "_id") fd.append(k, v ?? "");
      });
      if (editVisitImage) fd.append("visitImage", editVisitImage);
      if (editVisitingCardImage) fd.append("visitingCardImage", editVisitingCardImage);

      await axiosClient.put(`/visiting-places/${editRow._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMsg("✅ Updated successfully");
      closeEdit();
      fetchData(page);
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Update failed");
    } finally {
      setUpdating(false);
    }
  };

  const deleteVisit = async (id) => {
    if (!id) return;

    const ok = window.confirm("Are you sure you want to delete this visit?");
    if (!ok) return;

    setDeletingId(id);
    setErr("");
    setMsg("");

    try {
      await axiosClient.delete(`/visiting-places/${id}`);
      setMsg("🗑️ Deleted successfully");

      // Safe page recalculation
      const nextTotal = Math.max(0, total - 1);
      const nextPages = Math.max(1, Math.ceil(nextTotal / limit));
      const nextPage = Math.min(page, nextPages);

      fetchData(nextPage);
    } catch (e2) {
      setErr(e2?.response?.data?.message || e2.message || "Delete failed");
    } finally {
      setDeletingId("");
    }
  };

  return (
    <div className="w-full p-3 md:p-5" style={{ background: "#EFF6FF" }}>
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Visiting Places</h2>
            <p className="text-sm text-slate-600">
              Sales visit form + Excel-like list (Search, Filters, Pagination)
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => fetchData(1)}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-medium text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
              disabled={loading}
            >
              <FiRefreshCw /> Refresh
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={submit} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div>
              <label className="text-xs font-medium text-slate-700">Company Name *</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.companyName}
                onChange={(e) => onChange("companyName", e.target.value)}
                placeholder="e.g. ABC Constructions"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Person Name</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.personName}
                onChange={(e) => onChange("personName", e.target.value)}
                placeholder="e.g. Mr. Raj"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">
                Seller / Manufacturer / Buyer / Customer *
              </label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.partyType}
                onChange={(e) => onChange("partyType", e.target.value)}
              >
                {partyOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Contact Name *</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.contactName}
                onChange={(e) => onChange("contactName", e.target.value)}
                placeholder="e.g. Site Engineer / Purchase Head"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Contact Phone</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.contactPhone}
                onChange={(e) => onChange("contactPhone", e.target.value)}
                placeholder="e.g. 98XXXXXXXX"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Contact Email</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.contactEmail}
                onChange={(e) => onChange("contactEmail", e.target.value)}
                placeholder="e.g. mail@company.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-slate-700">Address</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.address}
                onChange={(e) => onChange("address", e.target.value)}
                placeholder="Full address / area / city"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Status</label>
              <select
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.status}
                onChange={(e) => onChange("status", e.target.value)}
              >
                {statusOptions.map((x) => (
                  <option key={x} value={x}>
                    {x}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Date & Time *</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.visitedAt}
                onChange={(e) => onChange("visitedAt", e.target.value)}
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Visit Image</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVisitImage(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                <FiImage className="text-slate-500" />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-700">Visiting Card Image</label>
              <div className="mt-1 flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVisitingCardImage(e.target.files?.[0] || null)}
                  className="w-full text-sm"
                />
                <FiImage className="text-slate-500" />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="text-xs font-medium text-slate-700">Notes</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                rows={2}
                value={form.notes}
                onChange={(e) => onChange("notes", e.target.value)}
                placeholder="Discussion summary, next steps..."
              />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="text-sm">
              {err ? <span className="text-red-600">{err}</span> : null}
              {msg ? <span className="text-green-700">{msg}</span> : null}
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              <FiPlus />
              {saving ? "Saving..." : "Save Visit"}
            </button>
          </div>
        </form>

        {/* Filters */}
        <div className="mt-4 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex w-full flex-col gap-2 md:flex-row md:items-center">
              <div className="relative w-full md:w-80">
                <FiSearch className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
                  placeholder="Search company / contact / address..."
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">All Party</option>
                  {partyOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  <option value="">All Status</option>
                  {statusOptions.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => fetchData(1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm font-medium text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100"
                  disabled={loading}
                  type="button"
                >
                  <FiFilter /> Apply
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">From</span>
                <input
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
                <span className="text-xs text-slate-600">To</span>
                <input
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </div>

              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              >
                {[10, 20, 30, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}/page
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-2 text-sm text-slate-600">
            Total: <span className="font-semibold text-slate-900">{total}</span>
          </div>
        </div>

        {/* Table (Excel-like) */}
        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="overflow-x-auto">
            <table className="min-w-[1300px] w-full border-collapse text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                  <th className="border-b border-slate-200 px-3 py-3">S.No</th>
                  <th className="border-b border-slate-200 px-3 py-3">Company</th>
                  <th className="border-b border-slate-200 px-3 py-3">Person</th>
                  <th className="border-b border-slate-200 px-3 py-3">Party Type</th>
                  <th className="border-b border-slate-200 px-3 py-3">Contact</th>
                  <th className="border-b border-slate-200 px-3 py-3">Phone</th>
                  <th className="border-b border-slate-200 px-3 py-3">Address</th>
                  <th className="border-b border-slate-200 px-3 py-3">Initiated By</th>
                  <th className="border-b border-slate-200 px-3 py-3">Status</th>
                  <th className="border-b border-slate-200 px-3 py-3">Visit Img</th>
                  <th className="border-b border-slate-200 px-3 py-3">Card Img</th>
                  <th className="border-b border-slate-200 px-3 py-3">Date & Time</th>
                  <th className="border-b border-slate-200 px-3 py-3">Actions</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={13}>
                      Loading...
                    </td>
                  </tr>
                ) : excelRows.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-slate-500" colSpan={13}>
                      No records found.
                    </td>
                  </tr>
                ) : (
                  excelRows.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50">
                      <td className="border-b border-slate-100 px-3 py-3">{r.sNo}</td>
                      <td className="border-b border-slate-100 px-3 py-3 font-medium text-slate-900">
                        {r.companyName}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3">{r.personName || "-"}</td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                          {r.partyType}
                        </span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3">{r.contactName}</td>
                      <td className="border-b border-slate-100 px-3 py-3">{r.contactPhone || "-"}</td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        <span className="line-clamp-2">{r.address || "-"}</span>
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3">
                        {r.initiatedBy?.name || r.initiatedBy?.email || "-"}
                      </td>
                      <td className="border-b border-slate-100 px-3 py-3">{r.status}</td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {r.visitImage?.url ? (
                          <a
                            href={r.visitImage.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 underline"
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">
                        {r.visitingCardImage?.url ? (
                          <a
                            href={r.visitingCardImage.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 underline"
                          >
                            View
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="border-b border-slate-100 px-3 py-3">{prettyDT(r.visitedAt)}</td>

                      {/* ✅ Actions */}
                      <td className="border-b border-slate-100 px-3 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit(r)}
                            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-800"
                            title="Edit"
                          >
                            <FiEdit2 /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteVisit(r._id)}
                            disabled={deletingId === r._id}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold ring-1",
                              deletingId === r._id
                                ? "bg-slate-100 text-slate-400 ring-slate-200"
                                : "bg-white text-red-700 ring-red-200 hover:bg-red-50"
                            )}
                            title="Delete"
                          >
                            <FiTrash2 /> {deletingId === r._id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 px-3 py-3">
            <div className="text-sm text-slate-600">
              Page <span className="font-semibold text-slate-900">{page}</span> /{" "}
              <span className="font-semibold text-slate-900">{totalPages}</span>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canPrev || loading}
                onClick={() => fetchData(page - 1)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1",
                  canPrev
                    ? "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                    : "bg-slate-100 text-slate-400 ring-slate-200"
                )}
              >
                <FiChevronLeft /> Prev
              </button>

              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => fetchData(page + 1)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ring-1",
                  canNext
                    ? "bg-white text-slate-800 ring-slate-200 hover:bg-slate-50"
                    : "bg-slate-100 text-slate-400 ring-slate-200"
                )}
              >
                Next <FiChevronRight />
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Edit Modal */}
        {editOpen && editRow && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3">
            <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl ring-1 ring-slate-200">
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Edit Visit</h3>
                  <p className="text-xs text-slate-600">Update fields and save</p>
                </div>
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  <FiX />
                </button>
              </div>

              <form onSubmit={updateVisit} className="p-4">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div>
                    <label className="text-xs font-medium text-slate-700">Company Name *</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.companyName}
                      onChange={(e) => setEditRow((s) => ({ ...s, companyName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Person Name</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.personName}
                      onChange={(e) => setEditRow((s) => ({ ...s, personName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Party Type *</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.partyType}
                      onChange={(e) => setEditRow((s) => ({ ...s, partyType: e.target.value }))}
                    >
                      {partyOptions.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Contact Name *</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.contactName}
                      onChange={(e) => setEditRow((s) => ({ ...s, contactName: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Contact Phone</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.contactPhone}
                      onChange={(e) => setEditRow((s) => ({ ...s, contactPhone: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Contact Email</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.contactEmail}
                      onChange={(e) => setEditRow((s) => ({ ...s, contactEmail: e.target.value }))}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-xs font-medium text-slate-700">Address</label>
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.address}
                      onChange={(e) => setEditRow((s) => ({ ...s, address: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Status</label>
                    <select
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.status}
                      onChange={(e) => setEditRow((s) => ({ ...s, status: e.target.value }))}
                    >
                      {statusOptions.map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Date & Time *</label>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.visitedAt}
                      onChange={(e) => setEditRow((s) => ({ ...s, visitedAt: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Replace Visit Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditVisitImage(e.target.files?.[0] || null)}
                      className="mt-1 w-full text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-700">Replace Visiting Card</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setEditVisitingCardImage(e.target.files?.[0] || null)}
                      className="mt-1 w-full text-sm"
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-slate-700">Notes</label>
                    <textarea
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                      value={editRow.notes}
                      onChange={(e) => setEditRow((s) => ({ ...s, notes: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={closeEdit}
                    className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={updating}
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    <FiSave /> {updating ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
