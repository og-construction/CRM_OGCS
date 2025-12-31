import React, { useEffect, useMemo, useState } from "react";
import {
  FiUser,
  FiMail,
  FiBriefcase,
  FiPhone,
  FiMessageSquare,
  FiRefreshCcw,
  FiCheckCircle,
  FiAlertTriangle,
  FiSearch,
  FiClock,
  FiCopy,
  FiX,
} from "react-icons/fi";
import axiosClient from "../../api/axiosClient";

const emptyForm = {
  name: "",
  email: "",
  companyName: "",
  role: "",
  phone: "",
  discussionNote: "",
};

const isValidEmail = (email = "") =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleString();
  } catch {
    return "-";
  }
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export default function ContactDiscussionPage() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const [items, setItems] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // UI extras
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  // nice UX
  const [copied, setCopied] = useState(false);
  const [compact, setCompact] = useState(false); // compact list view toggle

  const canSubmit = useMemo(() => {
    const { name, email, companyName, role, phone, discussionNote } = form;
    return (
      name.trim() &&
      companyName.trim() &&
      role.trim() &&
      phone.trim() &&
      discussionNote.trim() &&
      isValidEmail(email)
    );
  }, [form]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => {
      const hay = [
        it?.name,
        it?.email,
        it?.companyName,
        it?.role,
        it?.phone,
        it?.discussionNote,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [items, search]);

  const stats = useMemo(() => {
    const total = items.length;
    const shown = filteredItems.length;
    const hasSelected = Boolean(selected?._id);
    return { total, shown, hasSelected };
  }, [items.length, filteredItems.length, selected?._id]);

  const fetchAll = async () => {
    try {
      setError("");
      setSuccess("");
      setLoadingList(true);
      const res = await axiosClient.get("/contact-discussions?limit=50");
      const list = res.data?.data || [];
      setItems(list);

      // keep selection stable if possible
      setSelected((prev) => {
        if (!list.length) return null;
        if (!prev?._id) return list[0];
        const still = list.find((x) => String(x._id) === String(prev._id));
        return still || list[0];
      });
    } catch (e) {
      console.error(e);
      setError(e.response?.data?.message || "Failed to fetch data.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChange = (e) => {
    setError("");
    setSuccess("");
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm);
    setError("");
    setSuccess("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!canSubmit) {
      setError("Please fill all fields and enter a valid email.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await axiosClient.post("/contact-discussions", form);

      setSuccess("Saved successfully ✅");
      setForm(emptyForm);

      const created = res?.data?.data;
      if (created?._id) {
        setItems((prev) => [created, ...prev]);
        setSelected(created);
      } else {
        await fetchAll();
      }
    } catch (e2) {
      console.error(e2);
      setError(e2.response?.data?.message || "Failed to save. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const activeId = selected?._id ? String(selected._id) : null;

  const copySelectedNote = async () => {
    const text = selected?.discussionNote || "";
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // fallback: do nothing (browser permissions)
      setCopied(false);
    }
  };

  const shortNote = (s) => {
    const t = String(s || "").trim().replace(/\s+/g, " ");
    if (!t) return "-";
    return t.length > 90 ? t.slice(0, 90) + "…" : t;
  };

  return (
    <div className="min-h-screen" style={{ background: "#EFF6FF" }}>
      <div className="mx-auto max-w-7xl px-3 sm:px-4 py-5 sm:py-8">
        {/* ======= HERO HEADER ======= */}
        <div className="mb-4 sm:mb-6 rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-sm overflow-hidden">
          <div className="h-1.5 w-full bg-gradient-to-r from-[#8B0000] via-[#F4D03F] to-[#00204E]" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  Contact / Discussion
                </div>

                <h1 className="mt-2 text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 whitespace-normal break-words">
                  Contact / Discussion Form
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 whitespace-normal break-words">
                  Save inquiry details, view full notes, and manage latest submissions in a clean professional UI.
                </p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <Pill label="Total" value={stats.total} />
                  <Pill label="Showing" value={stats.shown} />
                  <Pill
                    label="Selected"
                    value={stats.hasSelected ? "Yes" : "No"}
                    tone={stats.hasSelected ? "good" : "neutral"}
                  />
                </div>
              </div>

              <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2">
                <button
                  onClick={fetchAll}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99]"
                >
                  <FiRefreshCcw />
                  Refresh
                </button>

                <button
                  onClick={() => setCompact((p) => !p)}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99]"
                >
                  {compact ? "Comfort View" : "Compact View"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {(error || success) && (
          <div className="mb-4 sm:mb-6">
            <div
              className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
                error
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
              }`}
            >
              <span className="mt-0.5">
                {error ? <FiAlertTriangle /> : <FiCheckCircle />}
              </span>
              <div className="leading-5 whitespace-normal break-words">
                {error || success}
              </div>
            </div>
          </div>
        )}

        {/* Layout */}
        <div className="grid gap-5 lg:grid-cols-5">
          {/* LIST + NOTE VIEW */}
          <div className="lg:col-span-3 order-1">
            <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="border-b border-slate-200 p-4 sm:p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 whitespace-normal break-words">
                      Latest Entries
                    </h2>
                    <p className="mt-0.5 text-xs sm:text-sm text-slate-600 whitespace-normal break-words">
                      Tap any item to view full discussion note.
                    </p>
                  </div>

                  <div className="w-full md:w-96">
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <FiSearch />
                      </div>
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search name, company, phone, note..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                      {search.trim() ? (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                          aria-label="Clear search"
                        >
                          <FiX />
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-5">
                {/* List */}
                <div className="lg:col-span-3">
                  {loadingList ? (
                    <SkeletonTable />
                  ) : filteredItems.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center bg-white">
                      <div className="text-sm font-semibold text-slate-900">
                        No data found
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        Try a different search or add a new entry.
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ✅ Mobile view (cards) */}
                      <div className="space-y-3 lg:hidden">
                        {filteredItems.map((it) => {
                          const active = activeId === String(it._id);
                          return (
                            <button
                              key={it._id}
                              onClick={() => setSelected(it)}
                              className={`w-full text-left rounded-3xl border transition active:scale-[0.99] ${
                                active
                                  ? "border-slate-300 bg-slate-50"
                                  : "border-slate-200 bg-white hover:bg-slate-50"
                              } ${compact ? "p-3" : "p-4"}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-sm font-extrabold text-slate-900 whitespace-normal break-words">
                                    {it.name}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-600 whitespace-normal break-all">
                                    {it.email}
                                  </div>
                                </div>
                                {active ? (
                                  <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                                    Active
                                  </span>
                                ) : null}
                              </div>

                              <div className={`mt-3 grid grid-cols-2 gap-2 text-xs ${compact ? "opacity-95" : ""}`}>
                                <MiniStat label="Company" value={it.companyName || "-"} />
                                <MiniStat label="Role" value={it.role || "-"} />
                                <MiniStat label="Phone" value={it.phone || "-"} mono />
                                <MiniStat
                                  label="Date"
                                  value={it.createdAt ? fmtDate(it.createdAt) : "-"}
                                />
                              </div>

                              {!compact ? (
                                <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                  <div className="text-[11px] font-semibold text-slate-600">
                                    Note Preview
                                  </div>
                                  <div className="mt-1 text-sm text-slate-800 whitespace-normal break-words">
                                    {shortNote(it.discussionNote)}
                                  </div>
                                </div>
                              ) : null}
                            </button>
                          );
                        })}

                        <div className="text-xs text-slate-600 flex items-center justify-between px-1">
                          <span>
                            Showing{" "}
                            <b className="text-slate-900">{filteredItems.length}</b>{" "}
                            item(s)
                          </span>
                          <span className="text-slate-500">Tap to open note</span>
                        </div>
                      </div>

                      {/* ✅ Desktop view (table) */}
                      <div className="hidden lg:block overflow-hidden rounded-3xl border border-slate-200">
                        <div className="max-h-[440px] overflow-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-700">
                              <tr>
                                <th className="px-3 py-3">Name</th>
                                <th className="px-3 py-3">Company</th>
                                <th className="px-3 py-3">Role</th>
                                <th className="px-3 py-3">Phone</th>
                                <th className="px-3 py-3">Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {filteredItems.map((it) => {
                                const active = activeId === String(it._id);
                                return (
                                  <tr
                                    key={it._id}
                                    onClick={() => setSelected(it)}
                                    className={`cursor-pointer border-t border-slate-200 transition ${
                                      active ? "bg-slate-100" : "hover:bg-slate-50"
                                    }`}
                                  >
                                    <td className="px-3 py-3">
                                      <div className="font-extrabold text-slate-900 whitespace-normal break-words">
                                        {it.name}
                                      </div>
                                      <div className="mt-0.5 text-xs text-slate-600 whitespace-normal break-all">
                                        {it.email}
                                      </div>
                                      <div className="mt-1 text-xs text-slate-500 whitespace-normal break-words">
                                        {compact ? "" : `Note: ${shortNote(it.discussionNote)}`}
                                      </div>
                                    </td>
                                    <td className="px-3 py-3 text-slate-800 whitespace-normal break-words">
                                      {it.companyName}
                                    </td>
                                    <td className="px-3 py-3 text-slate-800 whitespace-normal break-words">
                                      {it.role}
                                    </td>
                                    <td className="px-3 py-3 font-semibold text-slate-900 whitespace-normal break-all">
                                      {it.phone}
                                    </td>
                                    <td className="px-3 py-3 text-xs text-slate-600 whitespace-normal break-words">
                                      <span className="inline-flex items-center gap-1">
                                        <FiClock />
                                        {it.createdAt ? fmtDate(it.createdAt) : "-"}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-3 py-2 text-xs text-slate-600">
                          <span>
                            Showing{" "}
                            <b className="text-slate-900">{filteredItems.length}</b>{" "}
                            item(s)
                          </span>
                          <span className="text-slate-500">Click row to open note</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Note Viewer */}
                <div className="lg:col-span-2">
                  <div className="lg:sticky lg:top-5 space-y-3">
                    <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-4 sm:p-5 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-slate-600">
                            Note Viewer
                          </div>
                          <div className="mt-1 text-base sm:text-lg font-extrabold text-slate-900 whitespace-normal break-words">
                            {selected?.name || "Select an entry"}
                          </div>
                          <div className="mt-1 text-sm text-slate-700 whitespace-normal break-words">
                            {selected?.companyName || ""}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {selected?.discussionNote ? (
                            <button
                              type="button"
                              onClick={copySelectedNote}
                              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              <FiCopy />
                              {copied ? "Copied" : "Copy"}
                            </button>
                          ) : null}

                          {selected?._id ? (
                            <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700">
                              Active
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-700">
                        <InfoRow label="Email" value={selected?.email || "-"} />
                        <InfoRow label="Role" value={selected?.role || "-"} />
                        <InfoRow label="Phone" value={selected?.phone || "-"} />
                        <InfoRow
                          label="Date"
                          value={selected?.createdAt ? fmtDate(selected.createdAt) : "-"}
                        />
                      </div>

                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                            <FiMessageSquare className="text-slate-500" />
                            Discussion Note
                          </div>
                          {selected?.discussionNote ? (
                            <span className="text-[11px] font-semibold text-slate-500">
                              {clamp(String(selected.discussionNote).length, 0, 99999)} chars
                            </span>
                          ) : null}
                        </div>

                        <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-800">
                          {selected?.discussionNote
                            ? selected.discussionNote
                            : "Select any item from the list to view full note here."}
                        </div>
                      </div>

                      {selected?.discussionNote && (
                        <div className="mt-3 text-xs text-slate-500 whitespace-normal break-words">
                          Tip: Copy this note and add follow-up tasks in Lead module.
                        </div>
                      )}
                    </div>

                    {/* Small quick hint box */}
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-xs font-bold text-slate-900">
                        Quick Tips
                      </div>
                      <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc pl-4">
                        <li>Use search to find by phone / company quickly.</li>
                        <li>Keep notes short + actionable for easy follow-up.</li>
                        <li>Refresh after another user adds entries.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              {/* end grid */}
            </div>
          </div>

          {/* FORM */}
          <div className="lg:col-span-2 order-2">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/90 backdrop-blur shadow-sm">
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-slate-100" />
              <div className="absolute -bottom-14 -left-14 h-52 w-52 rounded-full bg-slate-50" />

              <div className="relative border-b border-slate-200 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Add New Entry
                    </h2>
                    <p className="mt-1 text-xs sm:text-sm text-slate-600 whitespace-normal break-words">
                      Enter details carefully. Notes are saved in CRM.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <FiX />
                    Clear
                  </button>
                </div>
              </div>

              <div className="relative p-4 sm:p-5">
                <form onSubmit={onSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FancyField
                      icon={<FiUser />}
                      label="Name"
                      name="name"
                      value={form.name}
                      onChange={onChange}
                      placeholder="Enter full name"
                      required
                    />
                    <FancyField
                      icon={<FiMail />}
                      label="Email"
                      name="email"
                      value={form.email}
                      onChange={onChange}
                      placeholder="name@company.com"
                      type="email"
                      required
                      hint={
                        form.email && !isValidEmail(form.email)
                          ? "Enter a valid email"
                          : ""
                      }
                      hintTone={form.email && !isValidEmail(form.email) ? "bad" : "neutral"}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <FancyField
                      icon={<FiBriefcase />}
                      label="Company Name"
                      name="companyName"
                      value={form.companyName}
                      onChange={onChange}
                      placeholder="Company / Organization"
                      required
                    />
                    <FancyField
                      icon={<FiBriefcase />}
                      label="Your Role"
                      name="role"
                      value={form.role}
                      onChange={onChange}
                      placeholder="Owner / Engineer / Manager"
                      required
                    />
                  </div>

                  <FancyField
                    icon={<FiPhone />}
                    label="Phone Number"
                    name="phone"
                    value={form.phone}
                    onChange={onChange}
                    placeholder="10-digit mobile / WhatsApp"
                    required
                    mono
                  />

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Related Discussion Note
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute left-3 top-3 text-slate-400">
                        <FiMessageSquare />
                      </div>
                      <textarea
                        name="discussionNote"
                        value={form.discussionNote}
                        onChange={onChange}
                        rows={6}
                        placeholder="Write requirement, product discussion, follow-up plan..."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                      />
                    </div>

                    <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                      <span className="whitespace-normal break-words">
                        Keep it clear and actionable.
                      </span>
                      <span>{String(form.discussionNote || "").length}/2000</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiCheckCircle className="opacity-90" />
                        Submit
                      </>
                    )}
                  </button>

                  {!canSubmit && (
                    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600 whitespace-normal break-words">
                      Tip: Fill all fields + valid email to enable submit.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
        {/* end main grid */}
      </div>
    </div>
  );
}

/* =================== Small Components =================== */

function Pill({ label, value, tone = "neutral" }) {
  const cls =
    tone === "good"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold ${cls}`}
    >
      <span className="text-slate-500">{label}:</span>
      <span className="text-slate-900">{value}</span>
    </span>
  );
}

function MiniStat({ label, value, mono }) {
  return (
    <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
      <div
        className={`mt-1 text-sm font-semibold text-slate-900 whitespace-normal ${
          mono ? "break-all font-mono" : "break-words"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function FancyField({
  icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  required,
  hint,
  hintTone = "neutral",
  mono,
}) {
  const hintCls =
    hintTone === "bad"
      ? "text-red-600"
      : hintTone === "good"
      ? "text-emerald-600"
      : "text-slate-500";

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="mb-1.5 block text-sm font-semibold text-slate-700">
          {label} {required ? <span className="text-red-600">*</span> : null}
        </label>
        {hint ? <span className={`text-xs ${hintCls}`}>{hint}</span> : null}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </div>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 ${
            mono ? "font-mono" : ""
          }`}
        />
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  const isEmail = label.toLowerCase() === "email";
  const isPhone = label.toLowerCase() === "phone";
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-white/70 border border-slate-200 px-3 py-2">
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
      <div
        className={`text-right text-sm font-semibold text-slate-900 whitespace-normal ${
          isEmail || isPhone ? "break-all" : "break-words"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SkeletonTable() {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
      <div className="bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
        Loading entries...
      </div>
      <div className="divide-y divide-slate-200">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200" />
            <div className="flex-1">
              <div className="h-3 w-1/2 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="hidden sm:block">
              <div className="h-3 w-28 animate-pulse rounded bg-slate-200" />
              <div className="mt-2 h-3 w-20 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
