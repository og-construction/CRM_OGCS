// ✅ Updated MyLeads.jsx (Restricted Palette + Excel Import)
// NOTE: npm i xlsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as XLSX from "xlsx";

import {
  fetchMyLeads,
  createMyLead,
  updateMyLead,
  deleteMyLead,
  importMyLeads,
  clearLeadsError,
  clearImportResult,
} from "../../store/slices/leadsSlice";

/**
 * ✅ Restricted palette ONLY:
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 */

const STATUSES = ["All", "New", "Follow-Up", "Closed", "Converted"];
const LEAD_TYPES = ["All", "Buyer", "Contractor", "Seller", "Manufacturer"];

const emptyForm = {
  leadType: "Buyer",
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

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ✅ Pills using only allowed colors
const statusPill = (status) => {
  switch (status) {
    case "New":
      return "bg-slate-50 text-blue-600 border border-slate-200";
    case "Follow-Up":
      return "bg-slate-50 text-orange-500 border border-slate-200";
    case "Closed":
      return "bg-slate-100 text-slate-600 border border-slate-200";
    case "Converted":
      return "bg-slate-50 text-green-600 border border-slate-200";
    default:
      return "bg-slate-50 text-slate-600 border border-slate-200";
  }
};

const typePill = (t) => {
  switch (t) {
    case "Buyer":
      return "bg-slate-50 text-blue-600 border border-slate-200";
    case "Contractor":
      return "bg-slate-50 text-orange-500 border border-slate-200";
    case "Seller":
      return "bg-slate-50 text-red-500 border border-slate-200";
    case "Manufacturer":
      return "bg-slate-50 text-green-600 border border-slate-200";
    default:
      return "bg-slate-50 text-slate-600 border border-slate-200";
  }
};

function useDebouncedValue(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function Modal({ open, title, onClose, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="font-semibold text-slate-900">{title}</div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-2xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50"
          >
            Close
          </button>
        </div>
        <div className="p-5 bg-white">{children}</div>
        {footer ? <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">{footer}</div> : null}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <label className="text-xs font-semibold text-slate-600">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

// ✅ Normalize excel/json row -> lead object
function normalizeLeadRow(row = {}) {
  const pick = (obj, keys) => {
    for (const k of keys) {
      if (obj?.[k] !== undefined && obj?.[k] !== null && String(obj[k]).trim() !== "") return obj[k];
    }
    return "";
  };

  const leadTypeRaw = pick(row, ["leadType", "Lead Type", "type", "Type"]);
  const statusRaw = pick(row, ["status", "Status"]);
  const sourceRaw = pick(row, ["source", "Source"]) || "Import";

  const leadType = LEAD_TYPES.includes(String(leadTypeRaw)) ? String(leadTypeRaw) : "Buyer";
  const status = STATUSES.includes(String(statusRaw)) ? String(statusRaw) : "New";

  const phone = cleanPhone(pick(row, ["phone", "Phone", "mobile", "Mobile"]));

  return {
    leadType,
    name: String(pick(row, ["name", "Name"])).trim(),
    company: String(pick(row, ["company", "Company", "firm", "Firm"])).trim(),
    phone: phone || "",
    email: String(pick(row, ["email", "Email"])).trim().toLowerCase(),
    city: String(pick(row, ["city", "City"])).trim(),
    address: String(pick(row, ["address", "Address"])).trim(),
    description: String(pick(row, ["description", "Description", "notes", "Notes"])).trim(),
    source: String(sourceRaw).trim() || "Import",
    status,
  };
}

export default function MyLeads() {
  const dispatch = useDispatch();
  const { items, loading, error, importing, importResult } = useSelector((s) => s.leads);

  const [status, setStatus] = useState("All");
  const [leadType, setLeadType] = useState("All");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [openImport, setOpenImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importPreviewCount, setImportPreviewCount] = useState(0);

  const [openDesc, setOpenDesc] = useState(false);
  const [descText, setDescText] = useState("");

  useEffect(() => {
    dispatch(fetchMyLeads({ status, leadType, search: debouncedSearch }));
  }, [dispatch, status, leadType, debouncedSearch]);

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
      leadType: lead?.leadType || "Buyer",
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
      leadType: String(form.leadType || "Buyer"),
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

  const openDescription = (text) => {
    setDescText(text || "");
    setOpenDesc(true);
  };

  const runImport = async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) return alert("Import must be an array");

      const normalized = parsed.map(normalizeLeadRow).filter((l) => l.name);
      if (normalized.length === 0) return alert("No valid rows found (Name required)");

      await dispatch(importMyLeads(normalized)).unwrap();
      setOpenImport(false);
      setImportJson("");
      setImportPreviewCount(0);

      dispatch(fetchMyLeads({ status, leadType, search }));
    } catch {
      alert("Invalid JSON / Import failed");
    }
  };

  const onExcelPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });

      const normalized = raw.map(normalizeLeadRow).filter((l) => l.name);
      setImportPreviewCount(normalized.length);
      setImportJson(JSON.stringify(normalized, null, 2));

      e.target.value = "";
    } catch {
      alert("Excel read failed. Please check the file format.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-xl font-extrabold text-slate-900">My Leads</h1>
                <p className="text-sm text-slate-600 mt-1">
                  Total <b className="text-slate-900">{summary.total}</b> • New{" "}
                  <b className="text-slate-900">{summary.newCount}</b> • Follow-Up{" "}
                  <b className="text-slate-900">{summary.fuCount}</b> • Closed{" "}
                  <b className="text-slate-900">{summary.closedCount}</b> • Converted{" "}
                  <b className="text-slate-900">{summary.convertedCount}</b>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Buyer <b className="text-slate-900">{summary.buyerCount}</b> • Contractor{" "}
                  <b className="text-slate-900">{summary.contractorCount}</b> • Seller{" "}
                  <b className="text-slate-900">{summary.sellerCount}</b> • Manufacturer{" "}
                  <b className="text-slate-900">{summary.manufacturerCount}</b>
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-semibold"
                  onClick={() => setOpenImport(true)}
                >
                  Import Leads
                </button>
                <button
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold"
                  onClick={startCreate}
                >
                  + Create Lead
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 text-slate-900 text-sm border border-slate-200 flex items-start justify-between gap-3">
                <div className="leading-relaxed">
                  <span className="text-red-500 font-semibold">Error:</span>{" "}
                  <span className="text-slate-900">{error}</span>
                </div>
                <button
                  className="text-xs underline shrink-0 text-slate-600"
                  onClick={() => dispatch(clearLeadsError())}
                >
                  dismiss
                </button>
              </div>
            )}

            {importResult && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 text-slate-900 text-sm border border-slate-200 flex items-start justify-between gap-3">
                <div className="leading-relaxed">
                  <span className="text-green-600 font-semibold">Import done:</span>{" "}
                  Added <b>{importResult.added}</b>, Duplicate skipped{" "}
                  <b>{importResult.skippedDuplicate}</b>, Invalid skipped{" "}
                  <b>{importResult.skippedInvalid}</b>
                </div>
                <button
                  className="text-xs underline shrink-0 text-slate-600"
                  onClick={() => dispatch(clearImportResult())}
                >
                  dismiss
                </button>
              </div>
            )}

            {/* Filters */}
            <form onSubmit={onSearch} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">Status</div>
                <select
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
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

              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">Lead Type</div>
                <select
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
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
                <div className="text-xs font-semibold text-slate-600 mb-1">Search</div>
                <input
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                  placeholder="Name, company, phone, email, city..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="text-[11px] text-slate-400 mt-1">Auto search enabled</div>
              </div>

              <div className="md:col-span-2 flex items-end gap-2">
                <button
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  type="submit"
                >
                  {loading ? "Searching..." : "Search"}
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => dispatch(fetchMyLeads({ status, leadType, search }))}
                >
                  Refresh
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">Leads List</div>
            <div className="text-xs text-slate-600">
              Showing <b className="text-slate-900">{items.length}</b> record(s)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs uppercase tracking-wide text-slate-600">
                  <th className="p-3">Name</th>
                  <th className="p-3">Type</th>
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

              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="p-6 text-slate-600">
                      Loading leads...
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-10">
                      <div className="text-center">
                        <div className="text-slate-900 font-semibold">No leads found</div>
                        <div className="text-slate-600 text-sm mt-1">
                          Try changing filters or create a new lead.
                        </div>
                        <button
                          className="mt-4 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-semibold"
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
                    const shortDesc = desc.length > 36 ? desc.slice(0, 36).trim() + "..." : desc;

                    return (
                      <tr key={lead._id} className="hover:bg-slate-50 align-top">
                        <td className="p-3">
                          <div className="font-semibold text-slate-900">{lead.name}</div>
                          <div className="text-xs text-slate-400">Created: {fmtDate(lead.createdAt)}</div>
                        </td>

                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typePill(lead.leadType || "Buyer")}`}>
                            {lead.leadType || "Buyer"}
                          </span>
                        </td>

                        <td className="p-3 text-slate-900">{lead.company || "-"}</td>
                        <td className="p-3 text-slate-900">{lead.phone || "-"}</td>
                        <td className="p-3">
                          <div className="max-w-[220px] break-words text-slate-900">{lead.email || "-"}</div>
                        </td>
                        <td className="p-3 text-slate-900">{lead.city || "-"}</td>
                        <td className="p-3 whitespace-normal break-words max-w-[260px] text-slate-900">
                          {lead.address || "-"}
                        </td>

                        <td className="p-3">
                          {desc ? (
                            <button
                              className="text-sm font-semibold text-blue-600 hover:underline"
                              onClick={() => openDescription(desc)}
                              title={desc}
                            >
                              {shortDesc}
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        <td className="p-3 text-slate-900">{lead.source || "-"}</td>

                        <td className="p-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(lead.status)}`}>
                            {lead.status}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              className="px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => startEdit(lead)}
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold text-red-500 hover:bg-slate-50"
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
              <div className="text-xs text-slate-600">
                Fields marked <span className="text-red-500 font-semibold">*</span> are required
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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
                  className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </div>
          }
        >
          <form onSubmit={submitLead} className="space-y-5">
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="text-sm font-semibold text-slate-900 mb-3">Basic Details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Lead Type" required hint="Buyer / Contractor / Seller / Manufacturer">
                  <select
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
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
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                    placeholder="Enter lead name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>

                <Field label="Company">
                  <input
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                    placeholder="Company / firm name"
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  />
                </Field>

                <Field label="Phone" hint="10 digits">
                  <input
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  />
                </Field>

                <Field label="Email">
                  <input
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="text-sm font-semibold text-slate-900 mb-3">Location</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="City">
                  <input
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  />
                </Field>

                <Field label="Address">
                  <input
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                    placeholder="Full address"
                    value={form.address}
                    onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  />
                </Field>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="text-sm font-semibold text-slate-900 mb-3">Lead Info</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Status">
                  <select
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
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
                    className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                    placeholder="Manual"
                    value={form.source}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                      placeholder="Requirement / notes..."
                      rows={4}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <button type="submit" className="hidden">
              submit
            </button>
          </form>
        </Modal>

        {/* Import Modal */}
        <Modal
          open={openImport}
          title="Import Leads (Excel / JSON)"
          onClose={() => setOpenImport(false)}
          footer={
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs text-slate-600">
                {importPreviewCount > 0 ? (
                  <>
                    Ready to import: <b className="text-slate-900">{importPreviewCount}</b> lead(s)
                  </>
                ) : (
                  <>Upload Excel or paste JSON array</>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => setOpenImport(false)}
                  disabled={importing}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                  disabled={importing}
                  onClick={runImport}
                >
                  {importing ? "Importing..." : "Import"}
                </button>
              </div>
            </div>
          }
        >
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 p-4 bg-slate-50">
              <div className="text-sm font-semibold text-slate-900">Upload Excel (.xlsx/.xls)</div>
              <div className="text-xs text-slate-600 mt-1">
                Headers supported:{" "}
                <b className="text-slate-900">
                  leadType, name, company, phone, email, city, address, description, status, source
                </b>
              </div>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={onExcelPick}
                className="mt-3 w-full"
                disabled={importing}
              />
              <div className="text-[11px] text-slate-400 mt-2">
                Tip: Column name “Lead Type” also works.
              </div>
            </div>

            <div className="text-sm font-semibold text-slate-900">Or paste JSON array</div>
            <textarea
              className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
              rows={10}
              placeholder="Excel data will auto-fill here OR paste JSON array here..."
              value={importJson}
              onChange={(e) => {
                setImportJson(e.target.value);
                setImportPreviewCount(0);
              }}
            />
          </div>
        </Modal>

        {/* Description Viewer */}
        <Modal open={openDesc} title="Lead Description" onClose={() => setOpenDesc(false)}>
          <div className="whitespace-pre-wrap text-sm text-slate-900 leading-relaxed">
            {descText || "-"}
          </div>
        </Modal>
      </div>
    </div>
  );
}
