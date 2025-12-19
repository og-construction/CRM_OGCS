import React, { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import Card from "./Card";
import {
  fetchMyLeads,
  createMyLead,
  importMyLeads,
  clearLeadsError,
  clearImportResult,
} from "../../store/slices/leadsSlice";

const EMPTY = {
  name: "",
  company: "",
  phone: "",
  email: "",
  city: "",
  requirement: "",
  source: "Manual",
  status: "New",
};

const normalizePhone = (v) => String(v ?? "").replace(/\D/g, "").slice(-10);
const normalizeEmail = (v) => String(v ?? "").trim().toLowerCase();
const safeStr = (v) => String(v ?? "").trim();

const STATUS_OPTIONS = ["All", "New", "Follow-Up", "Closed", "Converted"];

function normalizeRowKeys(row) {
  // converts keys like "Lead Name", "lead_name", "LEADNAME" -> "leadname"
  const out = {};
  Object.keys(row || {}).forEach((k) => {
    const nk = String(k)
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/_/g, "");
    out[nk] = row[k];
  });
  return out;
}

function mapRowToLead(rowRaw) {
  const row = normalizeRowKeys(rowRaw);

  const get = (...keys) => {
    for (const k of keys) {
      const nk = String(k)
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "")
        .replace(/_/g, "");
      const val = row[nk];
      if (val !== undefined && val !== null && String(val).trim() !== "") return val;
    }
    return "";
  };

  const status = safeStr(get("status")) || "New";
  const allowed = ["New", "Follow-Up", "Closed", "Converted"];

  return {
    name: safeStr(get("name", "leadname", "customername")),
    company: safeStr(get("company", "companyname", "firm")),
    phone: normalizePhone(get("phone", "mobile", "contact", "contactnumber")),
    email: normalizeEmail(get("email", "emailid", "e-mail")),
    city: safeStr(get("city", "location")),
    requirement: safeStr(get("requirement", "notes", "need", "remark", "remarks")),
    source: safeStr(get("source")) || "Excel",
    status: allowed.includes(status) ? status : "New",
  };
}

const Pill = ({ tone = "sky", children }) => {
  const map = {
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] sm:text-xs px-2 py-1 rounded-full border ${
        map[tone] || map.sky
      }`}
    >
      {children}
    </span>
  );
};

const Field = ({ label, hint, ...props }) => (
  <div className="min-w-0">
    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
      {label}
    </label>
    <input
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
    />
    {hint ? <p className="mt-1 text-[11px] text-slate-500">{hint}</p> : null}
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div className="min-w-0">
    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
      {label}
    </label>
    <textarea
      {...props}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
    />
  </div>
);

const LeadSkeletonCard = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="h-4 w-40 bg-slate-100 rounded" />
        <div className="mt-2 h-3 w-56 bg-slate-100 rounded" />
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full" />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="h-12 bg-slate-50 border border-slate-200 rounded-2xl" />
      <div className="h-12 bg-slate-50 border border-slate-200 rounded-2xl" />
    </div>
    <div className="mt-3 h-9 bg-slate-100 rounded-2xl" />
  </div>
);

export default function LeadManagement() {
  const dispatch = useDispatch();
  const fileRef = useRef(null);

  const { items, loading, importing, error, importResult } = useSelector((s) => s.leads);

  const [activePanel, setActivePanel] = useState("manual"); // manual | import
  const [form, setForm] = useState(EMPTY);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [banner, setBanner] = useState({ type: "", text: "" }); // success | error | info
  const [submitting, setSubmitting] = useState(false);

  const showBanner = (type, text) => setBanner({ type, text });
  const clearBanner = () => setBanner({ type: "", text: "" });

  useEffect(() => {
    dispatch(fetchMyLeads({ status: statusFilter, search }));
  }, [dispatch, statusFilter, search]);

  useEffect(() => {
    return () => {
      dispatch(clearLeadsError());
      dispatch(clearImportResult());
    };
  }, [dispatch]);

  const stats = useMemo(() => {
    const total = items.length;
    const followUp = items.filter((l) => l.status === "Follow-Up").length;
    const closedOrConverted = items.filter(
      (l) => l.status === "Closed" || l.status === "Converted"
    ).length;
    return { total, followUp, closedOrConverted };
  }, [items]);

  const onChange = (e) => {
    dispatch(clearLeadsError());
    clearBanner();
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) return "Name is required";
    const p = normalizePhone(form.phone);
    const e = normalizeEmail(form.email);

    if (!p && !e) return "Phone or Email is required";
    if (p && p.length !== 10) return "Phone must be 10 digits";
    if (e && !/^\S+@\S+\.\S+$/.test(e)) return "Email is invalid";
    return "";
  };

  const refreshList = () => dispatch(fetchMyLeads({ status: statusFilter, search }));

  const submitManual = async (e) => {
    e.preventDefault();
    dispatch(clearLeadsError());
    dispatch(clearImportResult());
    clearBanner();

    const msg = validate();
    if (msg) {
      showBanner("error", msg);
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...form,
        phone: normalizePhone(form.phone),
        email: normalizeEmail(form.email),
        source: "Manual",
      };

      const result = await dispatch(createMyLead(payload));

      if (createMyLead.fulfilled.match(result)) {
        setForm(EMPTY);
        showBanner("success", "✅ Lead added successfully.");
        await refreshList();

        if (
          (statusFilter !== "All" && payload.status !== statusFilter) ||
          (search.trim() &&
            !JSON.stringify(payload)
              .toLowerCase()
              .includes(search.trim().toLowerCase()))
        ) {
          showBanner(
            "info",
            "✅ Lead added, but it may be hidden due to Search/Status filter. Clear filters to see it."
          );
        }
      } else {
        showBanner("error", result.payload || "Failed to add lead.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onImportClick = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    dispatch(clearLeadsError());
    dispatch(clearImportResult());
    clearBanner();

    try {
      const ext = file.name.toLowerCase();
      if (!ext.endsWith(".xlsx") && !ext.endsWith(".xls") && !ext.endsWith(".csv")) {
        showBanner("error", "Please upload only .xlsx / .xls / .csv file.");
        return;
      }

      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!rows.length) {
        showBanner("error", "Excel file is empty.");
        return;
      }

      const mapped = rows
        .map(mapRowToLead)
        .filter((x) => x.name && (x.phone || x.email));

      if (!mapped.length) {
        showBanner(
          "error",
          "No valid rows found. Please check column headers (name, phone/email)."
        );
        return;
      }

      const result = await dispatch(importMyLeads(mapped));

      if (importMyLeads.fulfilled.match(result)) {
        showBanner(
          "success",
          `✅ Import done. Added: ${result.payload.added}, Duplicates: ${result.payload.skippedDuplicate}, Invalid: ${result.payload.skippedInvalid}`
        );

        await refreshList();

        if (statusFilter !== "All" || search.trim()) {
          showBanner(
            "info",
            "✅ Imported leads saved, but they may be hidden due to Search/Status filter. Clear filters to see all."
          );
        }
      } else {
        showBanner("error", result.payload || "Import failed.");
      }
    } catch (err) {
      console.error(err);
      showBanner("error", "Import failed. Please check file format.");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [items]);

  const toneByStatus = (st) => {
    if (st === "Converted") return "emerald";
    if (st === "Closed") return "slate";
    if (st === "Follow-Up") return "amber";
    if (st === "New") return "violet";
    return "sky";
  };

  return (
    <div
      className="space-y-4 sm:space-y-5"
      style={{ background: "#EFF6FF", padding: 12, borderRadius: 16 }}
    >
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 whitespace-normal break-words">
              Lead Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 whitespace-normal break-words">
              Add leads manually or import Excel/CSV, then search and filter.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                setSearch("");
                setStatusFilter("All");
                clearBanner();
                showBanner("info", "Filters cleared ✅");
              }}
              className="w-full sm:w-auto text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
            >
              Clear Filters
            </button>

            <button
              onClick={() => refreshList()}
              className="w-full sm:w-auto text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Banner */}
        {(banner.text || error) && (
          <div
            className={`mt-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              banner.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : banner.type === "info"
                ? "bg-sky-50 border-sky-200 text-sky-800"
                : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            {banner.text || error}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card title="Total Leads Assigned">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            <Pill tone="slate">All</Pill>
          </div>
        </Card>

        <Card title="Leads in Follow-Up">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{stats.followUp}</p>
            <Pill tone="amber">Active</Pill>
          </div>
        </Card>

        <Card title="Closed / Converted">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{stats.closedOrConverted}</p>
            <Pill tone="emerald">Done</Pill>
          </div>
        </Card>
      </div>

      {/* Panels */}
      <Card title="Add Leads">
        {/* Tabs (mobile scroll) */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 -mx-1 px-1">
          <button
            onClick={() => {
              setActivePanel("manual");
              clearBanner();
            }}
            className={`shrink-0 text-xs px-3 py-2 rounded-2xl border transition ${
              activePanel === "manual"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Manual Entry
          </button>

          <button
            onClick={() => {
              setActivePanel("import");
              clearBanner();
            }}
            className={`shrink-0 text-xs px-3 py-2 rounded-2xl border transition ${
              activePanel === "import"
                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Excel / CSV Import
          </button>
        </div>

        {activePanel === "manual" ? (
          <form onSubmit={submitManual} className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <Field
              label="Name *"
              name="name"
              value={form.name}
              onChange={onChange}
              placeholder="Customer name"
            />

            <Field
              label="Company"
              name="company"
              value={form.company}
              onChange={onChange}
              placeholder="Company / Firm"
            />

            <Field
              label="Phone (10 digits)"
              name="phone"
              value={form.phone}
              onChange={onChange}
              placeholder="9876543210"
            />

            <Field
              label="Email"
              name="email"
              value={form.email}
              onChange={onChange}
              placeholder="lead@email.com"
              hint="Phone or Email is required (both recommended)."
            />

            <Field
              label="City"
              name="city"
              value={form.city}
              onChange={onChange}
              placeholder="City"
            />

            <div className="min-w-0">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Status
              </label>
              <select
                name="status"
                value={form.status}
                onChange={onChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              >
                <option>New</option>
                <option>Follow-Up</option>
                <option>Closed</option>
                <option>Converted</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <TextArea
                label="Requirement / Notes"
                name="requirement"
                value={form.requirement}
                onChange={onChange}
                rows={4}
                placeholder="What does customer need?"
              />
            </div>

            <div className="md:col-span-2 flex flex-col sm:flex-row gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {submitting ? "Saving..." : "Add Lead"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(EMPTY);
                  clearBanner();
                }}
                className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 active:scale-[0.99] transition"
              >
                Reset
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={onFileChange}
              className="hidden"
            />

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-800 font-semibold mb-1">
                Supported columns (any order)
              </p>
              <p className="text-xs text-slate-600 whitespace-normal break-words">
                name, company, phone, email, city, requirement/notes, source, status
              </p>
              <p className="text-xs text-slate-500 mt-2 whitespace-normal break-words">
                Tip: Headers like <b>Lead Name</b> / <b>Mobile</b> also work.
              </p>
            </div>

            <button
              type="button"
              onClick={onImportClick}
              disabled={importing}
              className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 text-sm font-semibold bg-slate-900 text-white rounded-2xl hover:bg-black active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition"
            >
              {importing ? "Importing..." : "Choose File & Import"}
            </button>

            {importResult ? (
              <div className="text-xs text-slate-600">
                Last Import → Added: <b>{importResult.added}</b>, Duplicates:{" "}
                <b>{importResult.skippedDuplicate}</b>, Invalid:{" "}
                <b>{importResult.skippedInvalid}</b>
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {/* List */}
      <Card title="Leads List">
        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-80 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
            placeholder="Search by name / phone / email / company / city..."
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full md:w-52 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s === "All" ? "All Status" : s}
              </option>
            ))}
          </select>

          <div className="md:ml-auto text-xs text-slate-600">
            Showing <b className="text-slate-900">{sortedItems.length}</b>
          </div>
        </div>

        {/* Data */}
        {loading ? (
          <div className="grid gap-3 lg:hidden">
            <LeadSkeletonCard />
            <LeadSkeletonCard />
            <LeadSkeletonCard />
          </div>
        ) : sortedItems.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
            <div className="text-sm font-semibold text-slate-900">No leads found</div>
            <div className="text-xs text-slate-500 mt-1">
              Add manually or import from Excel/CSV.
            </div>
          </div>
        ) : (
          <>
            {/* ✅ Mobile cards (no cutting) */}
            <div className="grid gap-3 lg:hidden">
              {sortedItems.map((l) => (
                <div
                  key={l._id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 whitespace-normal break-words">
                        {l.name}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 whitespace-normal break-words">
                        {l.company || "-"} {l.city ? `• ${l.city}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Pill tone={toneByStatus(l.status)}>{l.status}</Pill>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">Phone</div>
                      <div className="mt-1 text-sm font-medium text-slate-900 break-all">
                        {l.phone || "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">Email</div>
                      <div className="mt-1 text-sm font-medium text-slate-900 break-all">
                        {l.email || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">Source</div>
                      <div className="mt-1 text-sm font-medium text-slate-900 break-words">
                        {l.source || "-"}
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">City</div>
                      <div className="mt-1 text-sm font-medium text-slate-900 break-words">
                        {l.city || "-"}
                      </div>
                    </div>
                  </div>

                  {l.requirement ? (
                    <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">Requirement</div>
                      <div className="mt-1 text-sm text-slate-900 whitespace-pre-wrap break-words">
                        {l.requirement}
                      </div>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>

            {/* ✅ Desktop table */}
            <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-3xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-3">Name</th>
                    <th className="text-left px-3 py-3">Company</th>
                    <th className="text-left px-3 py-3">Phone</th>
                    <th className="text-left px-3 py-3">Email</th>
                    <th className="text-left px-3 py-3">City</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((l) => (
                    <tr key={l._id} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-3 font-medium text-slate-900">{l.name}</td>
                      <td className="px-3 py-3 text-slate-700">{l.company || "-"}</td>
                      <td className="px-3 py-3 text-slate-700">{l.phone || "-"}</td>
                      <td className="px-3 py-3 text-slate-700">{l.email || "-"}</td>
                      <td className="px-3 py-3 text-slate-700">{l.city || "-"}</td>
                      <td className="px-3 py-3">
                        <Pill tone={toneByStatus(l.status)}>{l.status}</Pill>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{l.source || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
