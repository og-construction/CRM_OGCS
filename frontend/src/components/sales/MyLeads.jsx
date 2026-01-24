// ✅ MyLeads.jsx — FULL CODE (Responsive + Create/Edit + Excel Import + Pagination)
// NOTE: npm i xlsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
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

// ✅ Responsive Modal: full-height on mobile, scroll body, sticky footer
function Modal({ open, title, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2 sm:p-4">
      <div
        className="
          w-full
          max-w-3xl
          bg-white
          rounded-2xl
          border border-slate-200
          overflow-hidden
          flex flex-col
          h-[92dvh]
          sm:h-auto
          sm:max-h-[92dvh]
        "
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-white">
          <div className="font-semibold text-slate-900 truncate pr-3">{title}</div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-2xl border border-slate-200 text-sm text-slate-600 hover:bg-slate-50 shrink-0"
            type="button"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-white">{children}</div>

        {/* Footer */}
        {footer ? (
          <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-5 py-3 sm:py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2 mb-1">
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

  const allowedTypes = LEAD_TYPES.filter((x) => x !== "All");
  const allowedStatuses = STATUSES.filter((x) => x !== "All");

  const leadType = allowedTypes.includes(String(leadTypeRaw)) ? String(leadTypeRaw) : "Buyer";
  const status = allowedStatuses.includes(String(statusRaw)) ? String(statusRaw) : "New";

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

  // ✅ Slice can be either:
  // - old: { items: [] }
  // - new: { items: [], page, pages, total, limit }
  const {
    items = [],
    loading,
    error,
    importing,
    importResult,
    page: slicePage,
    pages: slicePages,
    total: sliceTotal,
    limit: sliceLimit,
  } = useSelector((s) => s.leads || {});

  const [status, setStatus] = useState("All");
  const [leadType, setLeadType] = useState("All");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 400);

  // ✅ Pagination state (frontend-side)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [openImport, setOpenImport] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [importPreviewCount, setImportPreviewCount] = useState(0);

  const [openDesc, setOpenDesc] = useState(false);
  const [descText, setDescText] = useState("");

  // ✅ When filter/search changes -> reset to page 1
  useEffect(() => {
    setPage(1);
  }, [status, leadType, debouncedSearch]);

  // ✅ Fetch on filter/search/page/limit change
  useEffect(() => {
    dispatch(fetchMyLeads({ status, leadType, search: debouncedSearch, page, limit }));
  }, [dispatch, status, leadType, debouncedSearch, page, limit]);

  const onSearch = useCallback(
    (e) => {
      e.preventDefault();
      setPage(1);
      dispatch(fetchMyLeads({ status, leadType, search, page: 1, limit }));
    },
    [dispatch, status, leadType, search, limit]
  );

  const resetForm = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
  }, []);

  const startCreate = useCallback(() => {
    resetForm();
    setOpenForm(true);
  }, [resetForm]);

  const startEdit = useCallback((lead) => {
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
  }, []);

  const submitLead = useCallback(
    async (e) => {
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

        // ✅ refresh current list
        dispatch(fetchMyLeads({ status, leadType, search: debouncedSearch, page, limit }));
      } catch {
        // handled in slice
      } finally {
        setSaving(false);
      }
    },
    [dispatch, editing?._id, form, resetForm, status, leadType, debouncedSearch, page, limit]
  );

  const onDelete = useCallback(
    async (lead) => {
      const ok = confirm(`Delete lead: ${lead.name}?`);
      if (!ok) return;
      await dispatch(deleteMyLead(lead._id)).unwrap?.();

      // ✅ if deleting last item on page, move back one page safely
      const remainingOnPage = Math.max(0, (items?.length || 0) - 1);
      if (page > 1 && remainingOnPage === 0) setPage((p) => Math.max(1, p - 1));
      else dispatch(fetchMyLeads({ status, leadType, search: debouncedSearch, page, limit }));
    },
    [dispatch, items?.length, page, status, leadType, debouncedSearch, limit]
  );

  // ✅ Summary can be either page-only OR total from backend
  const summary = useMemo(() => {
    const list = items || [];
    const by = (s) => list.filter((x) => x.status === s).length;
    const byType = (t) => list.filter((x) => x.leadType === t).length;
    return {
      total: sliceTotal ?? list.length,
      newCount: by("New"),
      fuCount: by("Follow-Up"),
      closedCount: by("Closed"),
      convertedCount: by("Converted"),
      buyerCount: byType("Buyer"),
      contractorCount: byType("Contractor"),
      sellerCount: byType("Seller"),
      manufacturerCount: byType("Manufacturer"),
    };
  }, [items, sliceTotal]);

  const openDescription = useCallback((text) => {
    setDescText(text || "");
    setOpenDesc(true);
  }, []);

  const runImport = useCallback(async () => {
    try {
      const parsed = JSON.parse(importJson);
      if (!Array.isArray(parsed)) return alert("Import must be an array");

      const normalized = parsed.map(normalizeLeadRow).filter((l) => l.name);
      if (normalized.length === 0) return alert("No valid rows found (Name required)");

      await dispatch(importMyLeads(normalized)).unwrap();
      setOpenImport(false);
      setImportJson("");
      setImportPreviewCount(0);

      setPage(1);
      dispatch(fetchMyLeads({ status, leadType, search: debouncedSearch, page: 1, limit }));
    } catch {
      alert("Invalid JSON / Import failed");
    }
  }, [dispatch, importJson, leadType, status, debouncedSearch, limit]);

  const onExcelPick = useCallback(async (e) => {
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
  }, []);

  const rows = useMemo(() => {
    return (items || []).map((lead) => {
      const desc = lead?.description || "";
      const shortDesc = desc.length > 60 ? desc.slice(0, 60).trim() + "..." : desc;
      return { lead, desc, shortDesc };
    });
  }, [items]);

  // ✅ Pagination derived (works with or without backend meta)
  const effectivePage = slicePage ?? page;
  const effectiveLimit = sliceLimit ?? limit;
  const effectivePages = slicePages ?? (items?.length ? 1 : 0);
  const effectiveTotal = sliceTotal ?? items.length;

  const canPrev = effectivePage > 1;
  const canNext = effectivePages ? effectivePage < effectivePages : false;

  const inputClass =
    "w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100";

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4">
        {/* Header Card */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">My Leads</h1>

                <div className="mt-1 text-sm text-slate-600 leading-relaxed">
                  <span>
                    Total <b className="text-slate-900">{summary.total}</b>
                  </span>
                  <span className="mx-2 text-slate-400">•</span>
                  <span>
                    New <b className="text-slate-900">{summary.newCount}</b>
                  </span>
                  <span className="mx-2 text-slate-400">•</span>
                  <span>
                    Follow-Up <b className="text-slate-900">{summary.fuCount}</b>
                  </span>
                  <span className="mx-2 text-slate-400">•</span>
                  <span>
                    Closed <b className="text-slate-900">{summary.closedCount}</b>
                  </span>
                  <span className="mx-2 text-slate-400">•</span>
                  <span>
                    Converted <b className="text-slate-900">{summary.convertedCount}</b>
                  </span>
                </div>

                <div className="mt-1 text-xs text-slate-400 leading-relaxed">
                  Buyer <b className="text-slate-900">{summary.buyerCount}</b>
                  <span className="mx-2">•</span>
                  Contractor <b className="text-slate-900">{summary.contractorCount}</b>
                  <span className="mx-2">•</span>
                  Seller <b className="text-slate-900">{summary.sellerCount}</b>
                  <span className="mx-2">•</span>
                  Manufacturer <b className="text-slate-900">{summary.manufacturerCount}</b>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-semibold"
                  onClick={() => setOpenImport(true)}
                  type="button"
                >
                  Import Leads
                </button>
                <button
                  className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-semibold"
                  onClick={startCreate}
                  type="button"
                >
                  + Create Lead
                </button>
              </div>
            </div>

            {/* Alerts */}
            {error && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 text-slate-900 text-sm border border-slate-200 flex items-start justify-between gap-3">
                <div className="leading-relaxed min-w-0">
                  <span className="text-red-500 font-semibold">Error:</span>{" "}
                  <span className="text-slate-900 break-words">{error}</span>
                </div>
                <button
                  className="text-xs underline shrink-0 text-slate-600"
                  onClick={() => dispatch(clearLeadsError())}
                  type="button"
                >
                  dismiss
                </button>
              </div>
            )}

            {importResult && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-50 text-slate-900 text-sm border border-slate-200 flex items-start justify-between gap-3">
                <div className="leading-relaxed min-w-0">
                  <span className="text-green-600 font-semibold">Import done:</span>{" "}
                  Added <b>{importResult.added}</b>, Duplicate skipped{" "}
                  <b>{importResult.skippedDuplicate}</b>, Invalid skipped{" "}
                  <b>{importResult.skippedInvalid}</b>
                </div>
                <button
                  className="text-xs underline shrink-0 text-slate-600"
                  onClick={() => dispatch(clearImportResult())}
                  type="button"
                >
                  dismiss
                </button>
              </div>
            )}

            {/* Filters */}
            <form onSubmit={onSearch} className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">Status</div>
                <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">Lead Type</div>
                <select className={inputClass} value={leadType} onChange={(e) => setLeadType(e.target.value)}>
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
                  className={inputClass}
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
                  onClick={() => dispatch(fetchMyLeads({ status, leadType, search, page, limit }))}
                >
                  Refresh
                </button>
              </div>
            </form>

            {/* ✅ Pagination Controls (top) */}
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-slate-600">
                Page <b className="text-slate-900">{effectivePage}</b> of{" "}
                <b className="text-slate-900">{effectivePages || 1}</b>{" "}
                <span className="text-slate-400">•</span>{" "}
                Total <b className="text-slate-900">{effectiveTotal}</b>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-600">Page size</span>
                  <select
                    className="border border-slate-200 rounded-2xl px-3 py-2 text-sm bg-white text-slate-900"
                    value={limit}
                    onChange={(e) => {
                      setLimit(Number(e.target.value) || 20);
                      setPage(1);
                    }}
                  >
                    {[10, 20, 30, 50].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    disabled={!canPrev || loading}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                    disabled={!canNext || loading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* List / Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">Leads List</div>
            <div className="text-xs text-slate-600">
              Showing <b className="text-slate-900">{items.length}</b> record(s) on this page
            </div>
          </div>

          {/* Mobile/Tablet cards */}
          <div className="block lg:hidden">
            {loading ? (
              <div className="p-5 text-slate-600">Loading leads...</div>
            ) : rows.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-slate-900 font-semibold">No leads found</div>
                <div className="text-slate-600 text-sm mt-1">Try changing filters or create a new lead.</div>
                <button
                  className="mt-4 px-4 py-2 rounded-2xl bg-slate-900 text-white text-sm font-semibold"
                  onClick={startCreate}
                  type="button"
                >
                  + Create Lead
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {rows.map(({ lead, desc, shortDesc }) => (
                  <div key={lead._id} className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-base font-extrabold text-slate-900 truncate">{lead.name}</div>
                        <div className="text-xs text-slate-400 mt-1">Created: {fmtDate(lead.createdAt)}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${statusPill(
                            lead.status
                          )}`}
                        >
                          {lead.status}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typePill(
                            lead.leadType || "Buyer"
                          )}`}
                        >
                          {lead.leadType || "Buyer"}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] text-slate-400">Company</div>
                        <div className="text-slate-900 break-words">{lead.company || "-"}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] text-slate-400">Phone</div>
                        <div className="text-slate-900 break-words">{lead.phone || "-"}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] text-slate-400">Email</div>
                        <div className="text-slate-900 break-words">{lead.email || "-"}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] text-slate-400">City</div>
                        <div className="text-slate-900 break-words">{lead.city || "-"}</div>
                      </div>

                      <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] text-slate-400">Address</div>
                        <div className="text-slate-900 break-words">{lead.address || "-"}</div>
                      </div>

                      <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] text-slate-400">Description</div>
                        {desc ? (
                          <button
                            className="text-left text-sm font-semibold text-blue-600 hover:underline"
                            onClick={() => openDescription(desc)}
                            type="button"
                            title={desc}
                          >
                            {shortDesc}
                          </button>
                        ) : (
                          <div className="text-slate-600">-</div>
                        )}
                      </div>

                      <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-[11px] text-slate-400">Source</div>
                        <div className="text-slate-900 break-words">{lead.source || "-"}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <button
                        className="w-full sm:w-auto px-3 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                        onClick={() => startEdit(lead)}
                        type="button"
                      >
                        Edit
                      </button>
                      <button
                        className="w-full sm:w-auto px-3 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-red-500 hover:bg-slate-50"
                        onClick={() => onDelete(lead)}
                        type="button"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block overflow-x-auto">
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
                          type="button"
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
                          <div className="text-xs text-slate-400">{fmtDate(lead.createdAt)}</div>
                        </td>

                        <td className="p-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${typePill(
                              lead.leadType || "Buyer"
                            )}`}
                          >
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
                              type="button"
                            >
                              {shortDesc}
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>

                        <td className="p-3 text-slate-900">{lead.source || "-"}</td>

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
                              className="px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                              onClick={() => startEdit(lead)}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold text-red-500 hover:bg-slate-50"
                              onClick={() => onDelete(lead)}
                              type="button"
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

          {/* ✅ Pagination Controls (bottom) */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-5 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-xs text-slate-600">
              Page <b className="text-slate-900">{effectivePage}</b> /{" "}
              <b className="text-slate-900">{effectivePages || 1}</b> • Total{" "}
              <b className="text-slate-900">{effectiveTotal}</b>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <button
                type="button"
                className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* ✅ Create/Edit Modal */}
        <Modal
          open={openForm}
          title={editing ? "Edit Lead" : "Create Lead"}
          onClose={() => {
            setOpenForm(false);
            resetForm();
          }}
          footer={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-600">
                Fields marked <span className="text-red-500 font-semibold">*</span> are required
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  onClick={() => {
                    setOpenForm(false);
                    resetForm();
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  form="leadForm"
                  disabled={saving}
                  className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Lead"}
                </button>
              </div>
            </div>
          }
        >
          <form id="leadForm" onSubmit={submitLead} className="space-y-4 sm:space-y-5">
            <div className="rounded-2xl border border-slate-200 p-4 bg-white">
              <div className="text-sm font-semibold text-slate-900 mb-3">Basic Details</div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <Field label="Lead Type" required hint="Buyer / Contractor / Seller / Manufacturer">
                  <select
                    className={inputClass}
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
                    className={inputClass}
                    placeholder="Enter lead name"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </Field>

                <Field label="Company">
                  <input
                    className={inputClass}
                    placeholder="Company / firm name"
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  />
                </Field>

                <Field label="Phone" hint="10 digits">
                  <input
                    className={inputClass}
                    placeholder="9876543210"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    inputMode="numeric"
                  />
                </Field>

                <Field label="Email">
                  <input
                    className={inputClass}
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
                    className={inputClass}
                    placeholder="City"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  />
                </Field>

                <Field label="Address">
                  <input
                    className={inputClass}
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
                    className={inputClass}
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
                    className={inputClass}
                    placeholder="Manual"
                    value={form.source}
                    onChange={(e) => setForm((p) => ({ ...p, source: e.target.value }))}
                  />
                </Field>

                <div className="md:col-span-2">
                  <Field label="Description">
                    <textarea
                      className={inputClass}
                      placeholder="Requirement / notes..."
                      rows={5}
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </form>
        </Modal>

        {/* Import Modal */}
        <Modal
          open={openImport}
          title="Import Leads (Excel / JSON)"
          onClose={() => setOpenImport(false)}
          footer={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs text-slate-600">
                {importPreviewCount > 0 ? (
                  <>
                    Ready to import: <b className="text-slate-900">{importPreviewCount}</b> lead(s)
                  </>
                ) : (
                  <>Upload Excel or paste JSON array</>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  onClick={() => setOpenImport(false)}
                  disabled={importing}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 rounded-2xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                  disabled={importing}
                  onClick={runImport}
                  type="button"
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
              <div className="text-[11px] text-slate-400 mt-2">Tip: Column name “Lead Type” also works.</div>
            </div>

            <div className="text-sm font-semibold text-slate-900">Or paste JSON array</div>
            <textarea
              className={inputClass}
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
          <div className="whitespace-pre-wrap text-sm text-slate-900 leading-relaxed">{descText || "-"}</div>
        </Modal>
      </div>
    </div>
  );
}
