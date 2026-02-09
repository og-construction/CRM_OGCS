// src/components/sales/Visits.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

import { createMyVisit, fetchMyVisits, clearVisitsMsg } from "../../store/slices/visitsSlice";

const cn = (...a) => a.filter(Boolean).join(" ");

const PARTY_TYPES = ["Buyer", "Contractor", "Seller", "Manufacturer", "Other"];
const STATUSES = ["Visited", "Follow-Up", "Closed"];

const inputClass =
  "w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white text-slate-900 outline-none focus:ring-4 focus:ring-slate-100";

const emptyForm = () => ({
  companyName: "",
  personName: "",
  partyType: "Buyer",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
  address: "",
  status: "Visited",
  visitedAt: new Date().toISOString().slice(0, 10), // yyyy-mm-dd
  notes: "",
  visitImage: null,
  visitingCardImage: null,
});

export default function Visits() {
  const dispatch = useDispatch();

  const { items = [], loading = false, saving = false, lastActionMsg = null, page = 1, pages = 1, total = 0, limit = 10 } =
    useSelector((s) => s.visits || {});

  const [form, setForm] = useState(emptyForm());

  // Pagination controls
  const canPrev = page > 1;
  const canNext = page < pages;

  useEffect(() => {
    dispatch(fetchMyVisits({ page: 1, limit: 10, onlyMine: "1" }));
  }, [dispatch]);

  // Clear slice msg silently
  useEffect(() => {
    if (!lastActionMsg) return;
    const t = setTimeout(() => dispatch(clearVisitsMsg()), 400);
    return () => clearTimeout(t);
  }, [dispatch, lastActionMsg]);

  const onSave = useCallback(async () => {
    const companyName = String(form.companyName || "").trim();
    const partyType = String(form.partyType || "").trim();
    const contactName = String(form.contactName || "").trim();
    const visitedAt = String(form.visitedAt || "").trim();

    if (!companyName) return toast.error("Company Name is required");
    if (!partyType) return toast.error("Party Type is required");
    if (!contactName) return toast.error("Contact Name is required");
    if (!visitedAt) return toast.error("Visited Date is required");

    const toastId = toast.loading("Saving visit...");

    try {
      // ✅ Send multipart ONLY if files exist
      const hasFiles = !!form.visitImage || !!form.visitingCardImage;

      let payload = null;

      if (hasFiles) {
        const fd = new FormData();
        fd.append("companyName", companyName);
        fd.append("personName", form.personName || "");
        fd.append("partyType", partyType);
        fd.append("contactName", contactName);
        fd.append("contactPhone", form.contactPhone || "");
        fd.append("contactEmail", (form.contactEmail || "").toLowerCase());
        fd.append("address", form.address || "");
        fd.append("status", form.status || "Visited");
        fd.append("visitedAt", new Date(visitedAt).toISOString());
        fd.append("notes", form.notes || "");

        if (form.visitImage) fd.append("visitImage", form.visitImage);
        if (form.visitingCardImage) fd.append("visitingCardImage", form.visitingCardImage);

        payload = fd;
      } else {
        payload = {
          companyName,
          personName: form.personName || "",
          partyType,
          contactName,
          contactPhone: form.contactPhone || "",
          contactEmail: (form.contactEmail || "").toLowerCase(),
          address: form.address || "",
          status: form.status || "Visited",
          visitedAt: new Date(visitedAt).toISOString(),
          notes: form.notes || "",
        };
      }

      await dispatch(createMyVisit(payload)).unwrap();

      toast.success("Visit saved ✅", { id: toastId });
      setForm(emptyForm());

      // refresh first page
      dispatch(fetchMyVisits({ page: 1, limit, onlyMine: "1" }));
    } catch (errMsg) {
      toast.error(String(errMsg || "Failed to save visit"), { id: toastId });
    }
  }, [dispatch, form, limit]);

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="max-w-[1200px] mx-auto px-3 sm:px-4 md:px-6 py-4 space-y-4">
        {/* Create */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5">
            <div className="text-lg font-extrabold text-slate-900">Add Visiting Place</div>
            <div className="text-xs text-slate-400 mt-1">This matches backend VisitingPlace controller fields.</div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Company Name *</div>
                <input
                  className={inputClass}
                  value={form.companyName}
                  onChange={(e) => setForm((p) => ({ ...p, companyName: e.target.value }))}
                  placeholder="e.g., ABC Builders"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Party Type *</div>
                <select
                  className={inputClass}
                  value={form.partyType}
                  onChange={(e) => setForm((p) => ({ ...p, partyType: e.target.value }))}
                >
                  {PARTY_TYPES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Visited At *</div>
                <input
                  type="date"
                  className={inputClass}
                  value={form.visitedAt}
                  onChange={(e) => setForm((p) => ({ ...p, visitedAt: e.target.value }))}
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Contact Name *</div>
                <input
                  className={inputClass}
                  value={form.contactName}
                  onChange={(e) => setForm((p) => ({ ...p, contactName: e.target.value }))}
                  placeholder="Person met"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Contact Phone</div>
                <input
                  className={inputClass}
                  value={form.contactPhone}
                  onChange={(e) => setForm((p) => ({ ...p, contactPhone: e.target.value }))}
                  placeholder="9876543210"
                  inputMode="numeric"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Contact Email</div>
                <input
                  className={inputClass}
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  placeholder="email@example.com"
                />
              </div>

              <div className="xl:col-span-2">
                <div className="text-xs font-semibold text-slate-600 mb-1">Address</div>
                <input
                  className={inputClass}
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Full address"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Status</div>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  {STATUSES.map((x) => (
                    <option key={x} value={x}>
                      {x}
                    </option>
                  ))}
                </select>
              </div>

              <div className="xl:col-span-3">
                <div className="text-xs font-semibold text-slate-600 mb-1">Notes</div>
                <textarea
                  className={inputClass}
                  rows={3}
                  value={form.notes}
                  onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Notes..."
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Visit Image</div>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full"
                  onChange={(e) => setForm((p) => ({ ...p, visitImage: e.target.files?.[0] || null }))}
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Visiting Card Image</div>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full"
                  onChange={(e) => setForm((p) => ({ ...p, visitingCardImage: e.target.files?.[0] || null }))}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="px-4 py-2.5 rounded-2xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Visit"}
              </button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-900">My Visits</div>
            <div className="text-xs text-slate-600">
              Total <b className="text-slate-900">{total}</b> • Page <b className="text-slate-900">{page}</b> /{" "}
              <b className="text-slate-900">{pages}</b>
            </div>
          </div>

          <div className="p-4 sm:p-5 space-y-3">
            {loading ? (
              <div className="text-slate-600">Loading...</div>
            ) : items.length === 0 ? (
              <div className="text-slate-600">No visits found.</div>
            ) : (
              items.map((v) => (
                <div key={v._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-base font-extrabold text-slate-900 truncate">{v.companyName}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {v.partyType} • {v.visitedAt ? new Date(v.visitedAt).toLocaleString("en-IN") : "-"}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        Contact: <span className="text-slate-900">{v.contactName || "-"}</span>{" "}
                        {v.contactPhone ? `• ${v.contactPhone}` : ""}
                      </div>
                    </div>
                  </div>

                  {v.notes ? (
                    <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">{v.notes}</div>
                  ) : null}
                </div>
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="border-t border-slate-200 bg-slate-50 px-4 sm:px-5 py-3 flex items-center justify-between">
            <button
              type="button"
              disabled={!canPrev || loading}
              className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-60"
              onClick={() => dispatch(fetchMyVisits({ page: page - 1, limit, onlyMine: "1" }))}
            >
              Prev
            </button>

            <button
              type="button"
              disabled={!canNext || loading}
              className="px-4 py-2 rounded-2xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white disabled:opacity-60"
              onClick={() => dispatch(fetchMyVisits({ page: page + 1, limit, onlyMine: "1" }))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
