// ✅ COMPLETE FIXED Visits.jsx (NO double toast)
// - Toast only inside actions (saveVisit + linkOrCreateLead)
// - Removed toast-from-lastActionMsg and toast-from-error useEffects
// - Still clears lastActionMsg silently to keep slice clean
// - Sends metIndex correctly
// - Never sends invalid GeoJSON location

// src/components/sales/Visits.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import {
  createMyVisit,
  fetchMyVisits,
  createLeadFromMetPerson,
  clearVisitsMsg,
} from "../../store/slices/visitsSlice";
import { fetchMyLeads } from "../../store/slices/leadsSlice";

const cn = (...a) => a.filter(Boolean).join(" ");

const LEAD_TYPES = ["Buyer", "Contractor", "Seller", "Manufacturer"];
const OUTCOMES = ["Interested", "Not Interested", "Call Back", "Quotation Asked", "Meeting Fixed"];

const inputClass =
  "w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100";

const makeKey = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

const cleanPhone10 = (v) => String(v || "").replace(/\D/g, "").slice(-10);

// ✅ FAST GPS (non-blocking)
function getFastPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 3000,
      maximumAge: 60000,
    });
  });
}

const emptyPerson = () => ({
  _key: makeKey(),
  leadType: "Buyer",
  name: "",
  company: "",
  phone: "",
  email: "",
  conversationNotes: "",
  outcome: "Interested",
  followUpDate: "",
});

const emptyForm = () => ({
  placeName: "",
  siteType: "Site",
  address: "",
  city: "",
  metPeople: [emptyPerson()],
});

export default function Visits() {
  const dispatch = useDispatch();

  const visitsState = useSelector((s) => s.visits) || {};
  const {
    items: visitsRaw = [],
    loading = false,
    saving = false,
    lastActionMsg = null,
  } = visitsState;

  const leadsState = useSelector((s) => s.leads) || {};
  const { items: leads = [] } = leadsState;

  const visits = useMemo(() => {
    if (Array.isArray(visitsRaw)) return visitsRaw;
    if (Array.isArray(visitsRaw?.items)) return visitsRaw.items;
    if (Array.isArray(visitsRaw?.data)) return visitsRaw.data;
    return [];
  }, [visitsRaw]);

  const [date, setDate] = useState("");
  const [form, setForm] = useState(emptyForm());

  // ✅ initial load + date filter
  useEffect(() => {
    dispatch(fetchMyVisits(date ? { date, page: 1, limit: 50 } : { page: 1, limit: 50 }));
    dispatch(fetchMyLeads({ status: "All", leadType: "All", search: "", page: 1, limit: 50 }));
  }, [dispatch, date]);

  // ✅ Clear lastActionMsg silently (NO toast here -> prevents double toast)
  useEffect(() => {
    if (!lastActionMsg) return;
    const t = setTimeout(() => dispatch(clearVisitsMsg()), 400);
    return () => clearTimeout(t);
  }, [dispatch, lastActionMsg]);

  const leadsByPhone = useMemo(() => {
    const m = new Map();
    for (const l of leads || []) {
      const p = cleanPhone10(l.normalizedPhone || l.phone || "");
      if (p) m.set(p, l);
    }
    return m;
  }, [leads]);

  const addPerson = useCallback(() => {
    setForm((p) => ({ ...p, metPeople: [...p.metPeople, emptyPerson()] }));
  }, []);

  const removePerson = useCallback((i) => {
    setForm((p) => ({ ...p, metPeople: p.metPeople.filter((_, idx) => idx !== i) }));
  }, []);

  const updatePerson = useCallback((i, key, val) => {
    setForm((p) => ({
      ...p,
      metPeople: p.metPeople.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)),
    }));
  }, []);

  // ✅ Save Visit (single toast flow)
  const saveVisit = useCallback(async () => {
    const placeName = String(form.placeName || "").trim();
    if (!placeName) return toast.error("Place name required");

    const validPeople = (form.metPeople || []).filter((p) => String(p.name || "").trim());
    if (validPeople.length === 0) return toast.error("Add at least 1 met person (name required)");

    const toastId = toast.loading("Saving visit...");

    // optional GPS
    let location = null;
    try {
      const pos = await getFastPosition();
      const lat = pos?.coords?.latitude;
      const lng = pos?.coords?.longitude;
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        location = { type: "Point", coordinates: [lng, lat] };
      }
    } catch {
      // ignore
    }

    const payload = {
      placeName,
      siteType: form.siteType || "Site",
      address: String(form.address || "").trim(),
      city: String(form.city || "").trim(),
      metPeople: validPeople.map(({ _key, ...p }) => ({
        ...p,
        phone: String(p.phone || "").trim(),
        email: String(p.email || "").trim().toLowerCase(),
        followUpDate: p.followUpDate ? new Date(p.followUpDate).toISOString() : null,
      })),
      checkInAt: new Date().toISOString(),
      visitedAt: new Date().toISOString(),
    };

    // ✅ include location only if valid
    if (location?.coordinates?.length === 2) payload.location = location;

    try {
      await dispatch(createMyVisit(payload)).unwrap();

      toast.success(
        location?.coordinates?.length === 2 ? "Visit saved with location ✅" : "Visit saved ✅ (No GPS)",
        { id: toastId }
      );

      setForm(emptyForm());

      dispatch(fetchMyVisits(date ? { date, page: 1, limit: 50 } : { page: 1, limit: 50 }));
      dispatch(fetchMyLeads({ status: "All", leadType: "All", search: "", page: 1, limit: 50 }));
    } catch (errMsg) {
      toast.error(String(errMsg || "Failed to save visit"), { id: toastId });
    }
  }, [dispatch, form, date]);

  // ✅ Create/Link Lead (single toast flow)
  const linkOrCreateLead = useCallback(
    async (visitId, metIndex) => {
      if (!visitId) return;
      if (!Number.isInteger(metIndex) || metIndex < 0) return toast.error("Invalid met person index");

      const toastId = toast.loading("Creating/Linking lead...");

      try {
        const res = await dispatch(createLeadFromMetPerson({ visitId, metIndex })).unwrap();
        toast.success(res?.message || "Lead linked ✅", { id: toastId });

        dispatch(fetchMyLeads({ status: "All", leadType: "All", search: "", page: 1, limit: 50 }));
        dispatch(fetchMyVisits(date ? { date, page: 1, limit: 50 } : { page: 1, limit: 50 }));
      } catch (errMsg) {
        toast.error(String(errMsg || "Failed to create/link lead"), { id: toastId });
      }
    },
    [dispatch, date]
  );

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4">
        {/* Create Visit */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">Add Visit</div>
                <div className="text-xs text-slate-400 mt-1">
                  Save place + met people. Location auto-captures if allowed.
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Place Name *</div>
                <input
                  className={inputClass}
                  value={form.placeName}
                  onChange={(e) => setForm((p) => ({ ...p, placeName: e.target.value }))}
                  placeholder="e.g., Ulwe Tower Site"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Site Type</div>
                <select
                  className={inputClass}
                  value={form.siteType}
                  onChange={(e) => setForm((p) => ({ ...p, siteType: e.target.value }))}
                >
                  {["Site", "Office", "Store", "Factory", "Other"].map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 xl:col-span-1">
                <div className="text-xs font-semibold text-slate-600 mb-1">City</div>
                <input
                  className={inputClass}
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="e.g., Navi Mumbai"
                />
              </div>

              <div className="md:col-span-2 xl:col-span-1">
                <div className="text-xs font-semibold text-slate-600 mb-1">Address</div>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Full address"
                />
              </div>
            </div>

            {/* Met People */}
            <div className="mt-5">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">Met People</div>
                <button
                  type="button"
                  onClick={addPerson}
                  className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                >
                  + Add Person
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {form.metPeople.map((p, i) => {
                  const phone10 = cleanPhone10(p.phone);
                  const existing = phone10 ? leadsByPhone.get(phone10) : null;

                  return (
                    <div
                      key={p._key}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div className="text-sm font-extrabold text-slate-900">
                          Person #{i + 1}
                          {existing ? (
                            <span className="ml-2 text-xs font-semibold text-green-600">
                              Existing Lead: {existing.leadType} • {existing.name}
                            </span>
                          ) : null}
                        </div>

                        <button
                          type="button"
                          onClick={() => removePerson(i)}
                          disabled={form.metPeople.length === 1}
                          className="px-3 py-1.5 rounded-2xl border border-slate-200 text-xs font-semibold text-red-500 hover:bg-white disabled:opacity-40"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600 mb-1">Lead Type *</div>
                          <select
                            className={inputClass}
                            value={p.leadType}
                            onChange={(e) => updatePerson(i, "leadType", e.target.value)}
                          >
                            {LEAD_TYPES.map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600 mb-1">Name *</div>
                          <input
                            className={inputClass}
                            value={p.name}
                            onChange={(e) => updatePerson(i, "name", e.target.value)}
                            placeholder="Person name"
                          />
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600 mb-1">Company</div>
                          <input
                            className={inputClass}
                            value={p.company}
                            onChange={(e) => updatePerson(i, "company", e.target.value)}
                            placeholder="Company/Firm"
                          />
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600 mb-1">Phone</div>
                          <input
                            className={inputClass}
                            value={p.phone}
                            onChange={(e) => updatePerson(i, "phone", e.target.value)}
                            placeholder="9876543210"
                            inputMode="numeric"
                          />
                        </div>

                        <div className="xl:col-span-2">
                          <div className="text-xs font-semibold text-slate-600 mb-1">Email</div>
                          <input
                            className={inputClass}
                            value={p.email}
                            onChange={(e) => updatePerson(i, "email", e.target.value)}
                            placeholder="email@example.com"
                          />
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600 mb-1">Outcome</div>
                          <select
                            className={inputClass}
                            value={p.outcome}
                            onChange={(e) => updatePerson(i, "outcome", e.target.value)}
                          >
                            {OUTCOMES.map((x) => (
                              <option key={x} value={x}>
                                {x}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-slate-600 mb-1">Follow-up Date</div>
                          <input
                            className={inputClass}
                            type="date"
                            value={p.followUpDate || ""}
                            onChange={(e) => updatePerson(i, "followUpDate", e.target.value)}
                          />
                        </div>

                        <div className="xl:col-span-4">
                          <div className="text-xs font-semibold text-slate-600 mb-1">Conversation Notes</div>
                          <textarea
                            className={inputClass}
                            rows={3}
                            value={p.conversationNotes}
                            onChange={(e) => updatePerson(i, "conversationNotes", e.target.value)}
                            placeholder="What discussed, requirement, next step..."
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={saveVisit}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Visit"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Visits List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="text-sm font-semibold text-slate-900">My Visits</div>

            <div className="flex items-center gap-2">
              <input
                type="date"
                className={cn(inputClass, "py-2")}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button
                type="button"
                onClick={() =>
                  dispatch(fetchMyVisits(date ? { date, page: 1, limit: 50 } : { page: 1, limit: 50 }))
                }
                className="px-3 py-2 rounded-2xl bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                {loading ? "Loading..." : "Refresh"}
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {visits.length === 0 ? (
              <div className="text-slate-600">{loading ? "Loading visits..." : "No visits found."}</div>
            ) : (
              visits.map((v) => (
                <div key={v._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-slate-900 truncate">{v.placeName}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {v.city ? `${v.city} • ` : ""}
                        {v.visitedAt ? new Date(v.visitedAt).toLocaleString("en-IN") : "-"}
                      </div>
                      {v.location?.coordinates?.length === 2 ? (
                        <div className="text-[11px] text-slate-400 mt-1">
                          GPS: {Number(v.location.coordinates[1]).toFixed(5)},{" "}
                          {Number(v.location.coordinates[0]).toFixed(5)}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400 mt-1">GPS: Not captured</div>
                      )}
                    </div>

                    <div className="text-xs font-semibold text-slate-600">
                      People met: <span className="text-slate-900">{v.metPeople?.length || 0}</span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {(v.metPeople || []).map((p, idx) => (
                      <div
                        key={`${v._id}-${p.leadId || p.phone || p.email || p.name || idx}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-slate-900 truncate">
                              {p.name}{" "}
                              <span className="text-xs font-semibold text-slate-400">({p.leadType})</span>
                            </div>
                            <div className="text-xs text-slate-600 mt-1">
                              {p.company || "-"} • {p.phone || "-"}
                            </div>
                            <div className="text-[11px] text-slate-400 mt-1">
                              Outcome: <span className="text-slate-900">{p.outcome || "-"}</span>
                            </div>
                          </div>

                          <button
                            type="button"
                            disabled={!!p.leadId}
                            className={cn(
                              "px-3 py-1.5 rounded-2xl border text-xs font-semibold",
                              p.leadId
                                ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                            )}
                            onClick={() => (!p.leadId ? linkOrCreateLead(v._id, idx) : null)}
                          >
                            {p.leadId ? "Linked" : "Create Lead"}
                          </button>
                        </div>

                        {p.conversationNotes ? (
                          <div className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">
                            {p.conversationNotes}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
