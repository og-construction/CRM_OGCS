// src/components/admin/QuoteDetailsModal.jsx
import React, { useEffect, useMemo } from "react";
import { FiX, FiFileText, FiUser, FiBriefcase, FiClock, FiCheckCircle } from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

const money = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const safeDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleString("en-IN");
};

const statusPill = (status = "") => {
  const s = String(status).toLowerCase();
  const base =
    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border";
  if (s === "approved") return `${base} bg-emerald-50 text-emerald-700 border-emerald-200`;
  if (s === "rejected") return `${base} bg-red-50 text-red-700 border-red-200`;
  if (s === "pending") return `${base} bg-amber-50 text-amber-700 border-amber-200`;
  return `${base} bg-slate-50 text-slate-700 border-slate-200`;
};

const typePill = (type = "") =>
  `inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border bg-slate-50 text-slate-700 border-slate-200 capitalize`;

const QuoteDetailsModal = ({ open, onClose, quote, loading, error }) => {
  // ✅ Close on ESC
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // ✅ lock body scroll (UI only)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev || "";
    };
  }, [open]);

  const hasApproval = Boolean(quote?.approvedBy || quote?.approvedAt);

  const totals = useMemo(() => {
    const subtotal = Number(quote?.subtotal || 0);
    const taxPercent = Number(quote?.taxPercent || 0);
    const totalAmount = Number(quote?.totalAmount || 0);
    return { subtotal, taxPercent, totalAmount };
  }, [quote]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/45 backdrop-blur-sm"
      />

      {/* Modal shell */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "w-[95vw] sm:w-[92vw] max-w-4xl",
          "bg-white border border-slate-100 shadow-2xl rounded-2xl overflow-hidden",
          "max-h-[88vh] sm:max-h-[90vh]"
        )}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-9 h-9 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                <FiFileText className="text-slate-700" />
              </span>

              <div className="min-w-0">
                <div className="text-base sm:text-lg font-bold text-slate-900 truncate">
                  Quotation / Invoice Details
                </div>
                <div className="text-[11px] sm:text-xs text-slate-500 truncate">
                  {quote?._id ? `ID: ${quote._id}` : ""}
                </div>
              </div>
            </div>

            {/* chips */}
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={typePill(quote?.type)}>{quote?.type || "—"}</span>
              <span className={statusPill(quote?.status)}>{quote?.status || "—"}</span>
              {quote?.projectName ? (
                <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold border bg-slate-50 text-slate-700 border-slate-200">
                  {quote.projectName}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              "shrink-0 inline-flex items-center gap-2",
              "text-xs sm:text-sm px-3 py-2 rounded-xl border border-slate-200",
              "bg-white hover:bg-slate-50 transition"
            )}
          >
            <FiX />
            Close
          </button>
        </div>

        {/* Body (scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(88vh-72px)] sm:max-h-[calc(90vh-76px)]">
          {loading ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              Loading details…
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          ) : !quote ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              No data
            </div>
          ) : (
            <>
              {/* Top info cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                {/* Customer */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                      <FiUser className="text-slate-700" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-500">Customer</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {quote.customerName || "—"}
                      </div>
                      {quote.companyName ? (
                        <div className="text-xs text-slate-500 truncate">{quote.companyName}</div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Sales Executive */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                      <FiBriefcase className="text-slate-700" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-500">Sales Executive</div>
                      <div className="text-sm sm:text-base font-bold text-slate-900 truncate">
                        {quote.salesExecutive?.name || "—"}
                      </div>
                      {quote.salesExecutive?.email ? (
                        <div className="text-xs text-slate-500 truncate">
                          {quote.salesExecutive.email}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                      <FiClock className="text-slate-700" />
                    </div>

                    <div className="min-w-0 w-full">
                      <div className="text-xs font-semibold text-slate-500">Timeline</div>
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Created</div>
                          <div className="font-semibold text-slate-900">{safeDate(quote.createdAt)}</div>
                        </div>

                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <div className="text-[11px] text-slate-500">Updated</div>
                          <div className="font-semibold text-slate-900">
                            {safeDate(quote.updatedAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approval info (only if exists) */}
                <div className="lg:col-span-6 rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0">
                      <FiCheckCircle className="text-slate-700" />
                    </div>

                    <div className="min-w-0 w-full">
                      <div className="text-xs font-semibold text-slate-500">Approval</div>

                      {hasApproval ? (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">By</div>
                            <div className="font-semibold text-slate-900 truncate">
                              {quote.approvedBy?.name || "—"}
                            </div>
                            {quote.approvedBy?.email ? (
                              <div className="text-[11px] text-slate-500 truncate">
                                {quote.approvedBy.email}
                              </div>
                            ) : null}
                          </div>

                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="text-[11px] text-slate-500">At</div>
                            <div className="font-semibold text-slate-900">
                              {safeDate(quote.approvedAt)}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm text-slate-600">
                          Not approved / rejected yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Items (responsive) */}
              <div className="mt-4 rounded-2xl border border-slate-100 overflow-hidden bg-white">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <div className="text-sm font-bold text-slate-900">Items</div>
                  <div className="text-xs text-slate-500">
                    {Array.isArray(quote.items) ? quote.items.length : 0} lines
                  </div>
                </div>

                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-[720px] w-full text-sm">
                    <thead className="bg-slate-50 text-xs font-bold text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left">Description</th>
                        <th className="px-4 py-3 text-right">Qty</th>
                        <th className="px-4 py-3 text-right">Rate</th>
                        <th className="px-4 py-3 text-right">Line Total</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {(quote.items || []).length === 0 ? (
                        <tr>
                          <td className="px-4 py-4 text-slate-500" colSpan={4}>
                            No items found
                          </td>
                        </tr>
                      ) : (
                        quote.items.map((it, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/60">
                            <td className="px-4 py-3 text-slate-800">
                              <div className="font-semibold">{it.description || "—"}</div>
                            </td>
                            <td className="px-4 py-3 text-right">{it.quantity ?? 0}</td>
                            <td className="px-4 py-3 text-right">₹{money(it.unitPrice)}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">
                              ₹{money(it.lineTotal)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-slate-100">
                  {(quote.items || []).length === 0 ? (
                    <div className="p-4 text-sm text-slate-500">No items found</div>
                  ) : (
                    quote.items.map((it, idx) => (
                      <div key={idx} className="p-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {it.description || "—"}
                        </div>

                        <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="text-slate-500">Qty</div>
                            <div className="font-bold text-slate-900">{it.quantity ?? 0}</div>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="text-slate-500">Rate</div>
                            <div className="font-bold text-slate-900">₹{money(it.unitPrice)}</div>
                          </div>
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                            <div className="text-slate-500">Total</div>
                            <div className="font-bold text-slate-900">₹{money(it.lineTotal)}</div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Totals */}
              <div className="mt-4 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                {/* Notes (left) */}
                {quote.notes ? (
                  <div className="flex-1 rounded-2xl border border-slate-100 bg-white p-4">
                    <div className="text-xs font-semibold text-slate-500 mb-1">Notes</div>
                    <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">
                      {quote.notes}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1" />
                )}

                {/* Totals (right) */}
                <div className="w-full lg:w-[360px] rounded-2xl border border-slate-100 bg-white p-4">
                  <div className="text-sm font-bold text-slate-900">Summary</div>

                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Subtotal</span>
                      <span className="font-semibold text-slate-900">₹{money(totals.subtotal)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Tax %</span>
                      <span className="font-semibold text-slate-900">
                        {totals.taxPercent}%
                      </span>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="text-slate-800">Total</span>
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{money(totals.totalAmount)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-[11px] text-slate-500">
                    Values shown as per quotation items + tax.
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailsModal;