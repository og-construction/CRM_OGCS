// ✅ Updated MyLeads.jsx (frontend): add Lead Type filter + field in Create/Edit form
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMyLeads,
  createMyLead,
  updateMyLead,
  deleteMyLead,
  importMyLeads,
  clearLeadsError,
  clearImportResult,
} from "../../store/slices/leadsSlice";

const STATUSES = ["All", "New", "Follow-Up", "Closed", "Converted"];

// ✅ NEW
const LEAD_TYPES = ["All", "Buyer", "Contractor", "Seller", "Manufacturer"];

const emptyForm = {
  leadType: "Buyer", // ✅ NEW default
  name: "",
  company: "",
  phone: "",
  email: "",
  city: "",
  address: "",
  description: "",
  source: "Manual",
  status: "New",
};

const cleanPhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);

const statusPill = (status) => {
  switch (status) {
    case "New":
      return "bg-blue-50 text-blue-700 ring-1 ring-blue-200";
    case "Follow-Up":
      return "bg-amber-50 text-amber-800 ring-1 ring-amber-200";
    case "Closed":
      return "bg-slate-100 text-slate-700 ring-1 ring-slate-200";
    case "Converted":
      return "bg-green-50 text-green-700 ring-1 ring-green-200";
    default:
      return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
};

// ✅ NEW
const typePill = (t) => {
  switch (t) {
    case "Buyer":
      return "bg-sky-50 text-sky-800 ring-1 ring-sky-200";
    case "Contractor":
      return "bg-indigo-50 text-indigo-800 ring-1 ring-indigo-200";
    case "Seller":
      return "bg-rose-50 text-rose-800 ring-1 ring-rose-200";
    case "Manufacturer":
      return "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200";
    default:
      return "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  }
};

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div className="font-semibold text-gray-900">{title}</div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50"
          >
            Close
          </button>
        </div>
        <div className="p-5">{children}</div>
        {footer ? <div className="px-5 py-4 border-t bg-gray-50">{footer}</div> : null}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-xs font-semibold text-gray-700">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
        {hint ? <span className="text-[11px] text-gray-500">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

export default function MyLeads() {
  const dispatch = useDispatch();
  const { items, loading, error, importing, importResult } = useSelector((s) => s.leads);

  const [status, setStatus] = useState("All");
  const [leadType, setLeadType] = useState("All"); // ✅ NEW
  const [search, setSearch] = useState("");

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [openImport, setOpenImport] = useState(false);
  const [importJson, setImportJson] = useState("");

  const [openDesc, setOpenDesc] = useState(false);
  const [descText, setDescText] = useState("");

  // ✅ IMPORTANT: include leadType in fetch
  useEffect(() => {
    dispatch(fetchMyLeads({ status, leadType, search }));
  }, [dispatch, status, leadType]);

  const onSearch = (e) => {
    e.preventDefault();
    dispatch(fetchMyLeads({ status, leadType, search }));
  };

  const resetForm = () => {
    setEditing(null);
    setForm(emptyForm);
  };

  const startCreate = () => {
    resetForm();
    setOpenForm(true);
  };

  const startEdit = (lead) => {
    setEditing(lead);
    setForm({
      leadType: lead?.leadType || "Buyer", // ✅ NEW
      name: lead?.name || "",
      company: lead?.company || "",
      phone: lead?.phone || "",
      email: lead?.email || "",
      city: lead?.city || "",
      address: lead?.address || "",
      description: lead?.description || "",
      source: lead?.source || "Manual",
      status: lead?.status || "New",
    });
    setOpenForm(true);
  };

  const submitLead = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      leadType: String(form.leadType || "Buyer"), // ✅ NEW
      phone: cleanPhone(form.phone),
      email: String(form.email || "").trim().toLowerCase(),
      name: String(form.name || "").trim(),
      company: String(form.company || "").trim(),
      city: String(form.city || "").trim(),
      address: String(form.address || "").trim(),
      description: String(form.description || "").trim(),
      source: String(form.source || "").trim() || "Manual",
    };

    if (!payload.name) return alert("Name is required");
    if (payload.phone && payload.phone.length !== 10) return alert("Phone must be 10 digits");

    try {
      setSaving(true);
      if (editing?._id) {
        await dispatch(updateMyLead({ id: editing._id, payload })).unwrap();
      } else {
        await dispatch(createMyLead(payload)).unwrap();
      }
      setOpenForm(false);
      resetForm();
    } catch {
      // handled in slice
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (lead) => {
    const ok = confirm(`Delete lead: ${lead.name}?`);
    if (!ok) return;
    await dispatch(deleteMyLead(lead._id));
  };

  const summary = useMemo(() => {
    const total = items.length;
    const by = (s) => items.filter((x) => x.status === s).length;
    const byType = (t) => items.filter((x) => x.leadType === t).length;
    return {
      total,
      newCount: by("New"),
      fuCount: by("Follow-Up"),
      closedCount: by("Closed"),
      convertedCount: by("Converted"),
      buyerCount: byType("Buyer"),
      contractorCount: byType("Contractor"),
      sellerCount: byType("Seller"),
      manufacturerCount: byType("Manufacturer"),
    };
  }, [items]);

  const runImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) return alert("Import JSON must be an array of leads");
      await dispatch(importMyLeads(parsed)).unwrap();
      setOpenImport(false);
      setImportJson("");
      dispatch(fetchMyLeads({ status, leadType, search }));
    } catch {
      alert("Invalid JSON / Import failed");
    }
  };

  const openDescription = (text) => {
    setDescText(text || "");
    setOpenDesc(true);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#EFF6FF" }}>
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-white shadow-sm border">
          <div className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-red-50 flex items-center justify-center border">
                    <span className="text-red-700 font-bold">L</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">My Leads</h1>
                    <p className="text-sm text-gray-600">
                      Total <b>{summary.total}</b> • New <b>{summary.newCount}</b> • Follow-Up{" "}
                      <b>{summary.fuCount}</b> • Closed <b>{summary.closedCount}</b> • Converted{" "}
                      <b>{summary.convertedCount}</b>
                    </p>
                    {/* ✅ NEW small type summary */}
                    <p className="text-xs text-gray-500 mt-1">
                      Buyer <b>{summary.buyerCount}</b> • Contractor <b>{summary.contractorCount}</b> •
                      Seller <b>{summary.sellerCount}</b> • Manufacturer <b>{summary.manufacturerCount}</b>
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:opacity-95"
                  onClick={() => setOpenImport(true)}
                >
                  Import Leads
                </button>
                <button
                  className="px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                  onClick={startCreate}
                >
                  + Create Lead
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mt-4 p-3 rounded-xl bg-red-50 text-red-800 text-sm border border-red-100 flex items-start justify-between gap-3">
                <div className="leading-relaxed">{error}</div>
                <button
                  className="text-xs underline shrink-0"
                  onClick={() => dispatch(clearLeadsError())}
                >
                  dismiss
                </button>
              </div>
            )}

            {importResult && (
              <div className="mt-4 p-3 rounded-xl bg-green-50 text-green-900 text-sm border border-green-100 flex items-start justify-between gap-3">
                <div className="leading-relaxed">
                  Import done — Added <b>{importResult.added}</b>, Duplicate skipped{" "}
                  <b>{importResult.skippedDuplicate}</b>, Invalid skipped{" "}
                  <b>{importResult.skippedInvalid}</b>
                </div>
                <button
                  className="text-xs underline shrink-0"
                  onClick={() => dispatch(clearImportResult())}
                >
                  dismiss
                </button>
              </div>
            )}

            {/* Filters */}
            <form onSubmit={onSearch} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-gray-700 mb-1">Status</div>
                <select
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* ✅ NEW Lead Type Filter */}
              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-gray-700 mb-1">Lead Type</div>
                <select
                  className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                  value={leadType}
                  onChange={(e) => setLeadType(e.target.value)}
                >
                  {LEAD_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-4">
                <div className="text-xs font-semibold text-gray-700 mb-1">Search</div>
                <input
                  className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                  placeholder="Name, company, phone, email, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 flex items-end gap-2">
                <button
                  className="w-full px-4 py-2.5 rounded-xl bg-white border text-sm font-semibold hover:bg-gray-50"
                  type="submit"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 rounded-xl bg-white border text-sm font-semibold hover:bg-gray-50"
                  onClick={() => dispatch(fetchMyLeads({ status, leadType, search }))}
                >
                  Refresh
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="px-5 py-4 border-b bg-gray-50 flex items-center justify-between">
            <div className="text-sm font-semibold text-gray-900">Leads List</div>
            <div className="text-xs text-gray-500">
              Showing <b>{items.length}</b> record(s)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs uppercase tracking-wide text-gray-600">
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th> {/* ✅ NEW */}
                  <th className="p-3">Company</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">City</th>
                  <th className="p-3">Address</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Source</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 w-44">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-gray-600">
                      Loading leads...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-10">
                      <div className="text-center">
                        <div className="text-gray-900 font-semibold">No leads found</div>
                        <div className="text-gray-600 text-sm mt-1">
                          Try changing filters or create a new lead.
                        </div>
                        <button
                          className="mt-4 px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                          onClick={startCreate}
                        >
                          + Create Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  items.map((lead) => {
                    const desc = lead?.description || "";
                    const shortDesc =
                      desc.length > 36 ? desc.slice(0, 36).trim() + "..." : desc;

                    return (
                      <tr key={lead._id} className="hover:bg-red-50/30 align-top">
                        <td className="p-3">
                          <div className="font-semibold text-gray-900">{lead.name}</div>
                          <div className="text-xs text-gray-500">
                            Created: {fmtDate(lead.createdAt)}
                          </div>
                        </td>

                        {/* ✅ NEW Type Pill */}
                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typePill(
                              lead.leadType || "Buyer"
                            )}`}
                          >
                            {lead.leadType || "Buyer"}
                          </span>
                        </td>

                        <td className="p-3">{lead.company || "-"}</td>
                        <td className="p-3">{lead.phone || "-"}</td>
                        <td className="p-3">
                          <div className="max-w-[220px] break-words">{lead.email || "-"}</div>
                        </td>
                        <td className="p-3">{lead.city || "-"}</td>
                        <td className="p-3 whitespace-normal break-words max-w-[260px]">
                          {lead.address || "-"}
                        </td>
                        <td className="p-3">
                          {desc ? (
                            <button
                              className="text-sm text-red-700 font-semibold hover:underline"
                              onClick={() => openDescription(desc)}
                              title={desc}
                            >
                              {shortDesc}
                            </button>
                          ) : (
                            "-"
                          )}
                        </td>

                        <td className="p-3">{lead.source || "-"}</td>

                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(
                              lead.status
                            )}`}
                          >
                            {lead.status}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-50"
                              onClick={() => startEdit(lead)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-lg border text-xs font-semibold hover:bg-gray-50"
                              onClick={() => onDelete(lead)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal
          open={openForm}
          title={editing ? "Edit Lead" : "Create Lead"}
          onClose={() => {
            setOpenForm(false);
            resetForm();
          }}
          footer={
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-600">
                Fields marked <span className="text-red-600 font-semibold">*</span> are required
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-white"
                  onClick={() => {
                    setOpenForm(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitLead}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={submitLead} className="space-y-5">
            {/* Section: Basic */}
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Basic Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* ✅ NEW Lead Type field */}
                <Field label="Lead Type" required hint="Buyer / Contractor / Seller / Manufacturer">
                  <select
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                    value={form.leadType}
                    onChange={(e) => setForm((p) => ({ ...p, leadType: e.target.value }))}
                  >
                    {LEAD_TYPES.filter((x) => x !== "All").map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Name" required>
                  <input
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="Enter lead name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>

                <Field label="Company">
                  <input
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="Company / firm name"
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  />
                </Field>

                <Field label="Phone" hint="10 digits">
                  <input
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Field>

                <Field label="Email">
                  <input
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            {/* Section: Location */}
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Location</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="City">
                  <input
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  />
                </Field>

                <Field label="Address">
                  <input
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="Full address"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            {/* Section: Lead Info */}
            <div className="rounded-2xl border p-4">
              <div className="text-sm font-semibold text-gray-900 mb-3">Lead Info</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Status">
                  <select
                    className="w-full border rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-200"
                    value={form.status}
                    onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                  >
                    {STATUSES.filter((x) => x !== "All").map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Source" hint="Manual/Import/Referral">
                  <input
                    className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                    placeholder="Manual"
                    value={form.source}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
                      placeholder="Requirement / notes..."
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <button type="submit" className="hidden">submit</button>
          </form>
        </Modal>

        {/* Import Modal */}
        <Modal
          open={openImport}
          title="Import Leads (JSON Array)"
          onClose={() => setOpenImport(false)}
          footer={
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border text-sm font-semibold hover:bg-white"
                onClick={() => setOpenImport(false)}
                disabled={importing}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:opacity-95 disabled:opacity-60"
                disabled={importing}
                onClick={runImport}
              >
                {importing ? "Importing..." : "Import"}
              </button>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="text-sm text-gray-700">Paste JSON array of leads. Example:</div>
            <pre className="text-xs bg-gray-50 border rounded-xl p-3 overflow-auto">
{`[
  { "leadType": "Buyer", "name": "ABC", "phone": "9876543210", "city": "Mumbai", "status": "New" },
  { "leadType": "Manufacturer", "name": "XYZ", "email": "xyz@email.com", "status": "Follow-Up" }
]`}
            </pre>

            <textarea
              className="w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-200"
              rows={10}
              placeholder="Paste JSON array here..."
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
            />
          </div>
        </Modal>

        {/* Description Viewer */}
        <Modal open={openDesc} title="Lead Description" onClose={() => setOpenDesc(false)}>
          <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
            {descText || "-"}
          </div>
        </Modal>
      </div>
    </div>
  );
}
