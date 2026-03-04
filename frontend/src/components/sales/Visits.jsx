import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiCalendar,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiUpload,
  FiSearch,
  FiX,
  FiTrash2,
  FiFlag,
} from "react-icons/fi";
import Card from "./Card";
import { createVisit, fetchVisits, deleteVisit, clearVisitsError } from "../../store/slices/visitsSlice";

const cn = (...a) => a.filter(Boolean).join(" ");

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

export default function Visits() {
  const dispatch = useDispatch();
  const { items, loading, saving, page, pages, total, error } = useSelector((s) => s.visits);

  // ✅ Form
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [companyName, setCompanyName] = useState("");
  const [personName, setPersonName] = useState("");
  const [partyType, setPartyType] = useState("Buyer");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("Visited");
  const [priority, setPriority] = useState("Medium");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [notes, setNotes] = useState("");
  const [visitImage, setVisitImage] = useState(null);
  const [visitingCardImage, setVisitingCardImage] = useState(null);

  // ✅ Filters
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [fPartyType, setFPartyType] = useState("");
  const [fPriority, setFPriority] = useState("");
  const [onlyMine, setOnlyMine] = useState("1");

  const canSubmit = useMemo(() => {
    return companyName.trim() && partyType && contactName.trim() && notes.trim() && visitDate;
  }, [companyName, partyType, contactName, notes, visitDate]);

  useEffect(() => {
    dispatch(fetchVisits({ page: 1, limit: 10, q, status: fStatus, partyType: fPartyType, priority: fPriority, onlyMine }));
  }, [dispatch, q, fStatus, fPartyType, fPriority, onlyMine]);

  const submit = async (e) => {
    e.preventDefault();
    dispatch(clearVisitsError());

    if (!canSubmit) return;

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const visitedAt = new Date(`${visitDate}T${hh}:${mm}:00`).toISOString();

    const fd = new FormData();
    fd.append("companyName", companyName.trim());
    fd.append("personName", personName.trim());
    fd.append("partyType", partyType);
    fd.append("contactName", contactName.trim());
    fd.append("contactPhone", contactPhone.trim());
    fd.append("contactEmail", contactEmail.trim());
    fd.append("address", address.trim());
    fd.append("status", status);
    fd.append("priority", priority);
    fd.append("visitedAt", visitedAt);
    fd.append("notes", notes);

    if (nextFollowUpAt) fd.append("nextFollowUpAt", new Date(nextFollowUpAt).toISOString());
    if (visitImage) fd.append("visitImage", visitImage);
    if (visitingCardImage) fd.append("visitingCardImage", visitingCardImage);

    const res = await dispatch(createVisit(fd));
    if (createVisit.fulfilled.match(res)) {
      // reset
      setCompanyName("");
      setPersonName("");
      setPartyType("Buyer");
      setContactName("");
      setContactPhone("");
      setContactEmail("");
      setAddress("");
      setStatus("Visited");
      setPriority("Medium");
      setNextFollowUpAt("");
      setNotes("");
      setVisitImage(null);
      setVisitingCardImage(null);

      dispatch(fetchVisits({ page: 1, limit: 10, q, status: fStatus, partyType: fPartyType, priority: fPriority, onlyMine }));
    }
  };

  const goPage = (p) => {
    dispatch(fetchVisits({ page: p, limit: 10, q, status: fStatus, partyType: fPartyType, priority: fPriority, onlyMine }));
  };

  return (
    <div className="min-h-[calc(100dvh-120px)] bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="min-w-0">
              <div className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
                Visits CRM
              </div>
              <div className="mt-1 text-xs sm:text-sm text-slate-600">
                Record visits, track follow-ups, and maintain contact history professionally.
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-red-500">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-5">
          {/* LEFT: Create Visit */}
          <div className="lg:col-span-2 space-y-4">
            <Card title="Create Visit">
              <form onSubmit={submit} className="space-y-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-600">Visit Date *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FiCalendar /></span>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-600">Company Name *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FiUser /></span>
                    <input
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="ABC Builders"
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-extrabold text-slate-600">Party Type *</label>
                    <select
                      value={partyType}
                      onChange={(e) => setPartyType(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    >
                      <option>Seller</option>
                      <option>Manufacturer</option>
                      <option>Buyer</option>
                      <option>Customer</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-600">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    >
                      <option>Planned</option>
                      <option>Visited</option>
                      <option>Follow-Up</option>
                      <option>Closed</option>
                      <option>Not Interested</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-600">Contact Name *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FiUser /></span>
                    <input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Purchase Manager"
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-extrabold text-slate-600">Phone</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FiPhone /></span>
                      <input
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="9876543210"
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-600">Email</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FiMail /></span>
                      <input
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="name@email.com"
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-600">Address</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FiMapPin /></span>
                    <input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Navi Mumbai"
                      className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-extrabold text-slate-600">Priority</label>
                    <div className="relative mt-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><FiFlag /></span>
                      <select
                        value={priority}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-3 py-2.5 text-sm"
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-600">Next Follow-up</label>
                    <input
                      type="datetime-local"
                      value={nextFollowUpAt}
                      onChange={(e) => setNextFollowUpAt(e.target.value)}
                      className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-600">Notes / Outcome *</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-3 text-slate-400"><FiFileText /></span>
                    <textarea
                      rows={5}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Discussion + outcome + next step"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-extrabold text-slate-600 mb-2">Attachments (optional)</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">Visit Image</span>
                        <FiUpload className="text-slate-400" />
                      </div>
                      <div className="mt-2 text-[11px] text-slate-600">
                        {visitImage ? `${visitImage.name} • ${formatBytes(visitImage.size)}` : "No file selected"}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setVisitImage(e.target.files?.[0] || null)} />
                    </label>

                    <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-slate-900">Visiting Card</span>
                        <FiUpload className="text-slate-400" />
                      </div>
                      <div className="mt-2 text-[11px] text-slate-600">
                        {visitingCardImage ? `${visitingCardImage.name} • ${formatBytes(visitingCardImage.size)}` : "No file selected"}
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={(e) => setVisitingCardImage(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || saving}
                  className={cn(
                    "w-full rounded-2xl py-3 text-sm font-extrabold",
                    canSubmit ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600",
                    "border border-slate-200 disabled:opacity-60"
                  )}
                >
                  {saving ? "Saving..." : "Save Visit"}
                </button>
              </form>
            </Card>
          </div>

          {/* RIGHT: List */}
          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <div className="text-base sm:text-lg font-extrabold text-slate-900">Visits List</div>
                  <div className="text-sm text-slate-600">Search, filter, and manage visits like a CRM.</div>
                </div>

                <div className="w-full sm:w-[340px] relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <FiSearch />
                  </span>
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search company / person / phone / notes..."
                    className="w-full rounded-2xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm"
                  />
                  {q ? (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl border border-slate-200 bg-white"
                    >
                      <FiX />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="p-4 sm:p-5 space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">All Status</option>
                    <option>Planned</option>
                    <option>Visited</option>
                    <option>Follow-Up</option>
                    <option>Closed</option>
                    <option>Not Interested</option>
                  </select>

                  <select value={fPartyType} onChange={(e) => setFPartyType(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">All Party</option>
                    <option>Seller</option>
                    <option>Manufacturer</option>
                    <option>Buyer</option>
                    <option>Customer</option>
                  </select>

                  <select value={fPriority} onChange={(e) => setFPriority(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="">All Priority</option>
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>

                  <select value={onlyMine} onChange={(e) => setOnlyMine(e.target.value)} className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm">
                    <option value="1">Only Mine</option>
                    <option value="0">All</option>
                  </select>

                  <div className="text-xs text-slate-600 flex items-center justify-end">
                    Total <b className="text-slate-900 mx-1">{total}</b>
                  </div>
                </div>

                {loading ? (
                  <div className="text-sm text-slate-600">Loading...</div>
                ) : items.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                    No visits found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((v) => (
                      <div key={v._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-base font-extrabold text-slate-900 truncate">
                              {v.companyName}
                            </div>
                            <div className="mt-1 text-sm text-slate-600 truncate">
                              {v.contactName} {v.personName ? `• ${v.personName}` : ""} • {v.partyType}
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-600">
                              {v.contactPhone ? <span>📞 {v.contactPhone}</span> : null}
                              {v.contactEmail ? <span>✉️ {v.contactEmail}</span> : null}
                              {v.address ? <span>📍 {v.address}</span> : null}
                            </div>

                            {v.notes ? (
                              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700 whitespace-pre-wrap">
                                {v.notes}
                              </div>
                            ) : null}

                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="px-3 py-1 rounded-2xl border border-slate-200 bg-white text-[11px] font-extrabold">
                                Status: {v.status}
                              </span>
                              <span className="px-3 py-1 rounded-2xl border border-slate-200 bg-white text-[11px] font-extrabold">
                                Priority: {v.priority || "Medium"}
                              </span>
                              <span className="px-3 py-1 rounded-2xl border border-slate-200 bg-white text-[11px] font-extrabold">
                                Visit: {v.visitedAt ? new Date(v.visitedAt).toLocaleString("en-IN") : "-"}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => dispatch(deleteVisit(v._id))}
                            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-slate-900 hover:bg-slate-50"
                            title="Delete"
                          >
                            <FiTrash2 className="text-red-500" />
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-slate-600">
                        Page <b className="text-slate-900">{page}</b> / <b className="text-slate-900">{pages}</b>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          disabled={page <= 1}
                          onClick={() => goPage(page - 1)}
                          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold disabled:opacity-60"
                        >
                          Prev
                        </button>
                        <button
                          type="button"
                          disabled={page >= pages}
                          onClick={() => goPage(page + 1)}
                          className="px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm font-extrabold disabled:opacity-60"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}