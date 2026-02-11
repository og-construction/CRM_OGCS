// src/components/admin/OverviewSection.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  FiRefreshCw,
  FiFileText,
  FiCheckCircle,
  FiXCircle,
  FiTrendingUp,
  FiClock,
  FiChevronRight,
} from "react-icons/fi";

import Card from "./Card";

import {
  fetchPendingQuotes,
  updateQuoteStatus,
  fetchQuoteById, // ✅ make sure thunk exists in quoteSlice
} from "../../store/slices/quoteSlice";

import { fetchAdminOverview } from "../../store/slices/adminOverviewSlice";

import QuoteDetailsModal from "./QuoteDetailsModal"; // ✅ your component

const cn = (...a) => a.filter(Boolean).join(" ");

const moneyINR = (v) => {
  const n = Number(v || 0);
  try {
    return n.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  } catch {
    return String(v ?? 0);
  }
};

const StatRow = ({ label, value }) => (
  <div className="flex items-center justify-between text-xs sm:text-sm">
    <span className="text-slate-600">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

export default function OverviewSection() {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const quoteState = useSelector((s) => s.quotes, shallowEqual);
  const overviewState = useSelector((s) => s.adminOverview, shallowEqual);

  const pendingList = quoteState?.pendingList ?? [];
  const loading = quoteState?.loading ?? false;
  const error = quoteState?.error ?? null;

  const selectedQuote = quoteState?.selectedQuote ?? null;
  const detailsLoading = quoteState?.detailsLoading ?? false;
  const detailsError = quoteState?.detailsError ?? null;

  const stats = overviewState?.stats ?? null;
  const statsLoading = overviewState?.loading ?? false;
  const statsError = overviewState?.error ?? null;

  const leads = stats?.leads;
  const week = stats?.quotes?.week;
  const pendingQuotesFromStats = stats?.quotes?.pendingQuotes;

  const refreshAll = useCallback(() => {
    dispatch(fetchPendingQuotes());
    dispatch(fetchAdminOverview());
  }, [dispatch]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const openDetails = useCallback(
    (id) => {
      setOpen(true);
      dispatch(fetchQuoteById(id));
    },
    [dispatch]
  );

  const handleApprove = useCallback(
    (id) => {
      dispatch(updateQuoteStatus({ id, status: "approved" })).then(() => refreshAll());
    },
    [dispatch, refreshAll]
  );

  const handleReject = useCallback(
    (id) => {
      dispatch(updateQuoteStatus({ id, status: "rejected" })).then(() => refreshAll());
    },
    [dispatch, refreshAll]
  );

  const weekCards = useMemo(
    () => [
      { label: "Created", value: week?.created ?? 0 },
      { label: "Approved", value: week?.approved ?? 0 },
      { label: "Rejected", value: week?.rejected ?? 0 },
      { label: "Approved Amount", value: `₹${moneyINR(week?.approvedAmount ?? 0)}` },
    ],
    [week]
  );

  return (
    <div className="space-y-4">
      {/* Details Modal */}
      <QuoteDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        quote={selectedQuote}
        loading={detailsLoading}
        error={detailsError}
      />

      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">Overview</h1>
          <p className="text-xs sm:text-sm text-slate-600">
            Quick admin snapshot + pending approvals.
          </p>
        </div>

        <button
          type="button"
          onClick={refreshAll}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 transition"
        >
          <FiRefreshCw />
          Refresh
        </button>
      </div>

      {/* Top summary cards */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card
          title="Pending Quotations / Invoices"
          subtitle="Requires admin approval"
          right={
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <FiClock />
              Live
            </span>
          }
        >
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="text-3xl font-extrabold text-slate-900">{pendingList.length}</div>

              <div className="mt-2 text-xs text-slate-500">
                {statsLoading ? (
                  "Checking server…"
                ) : statsError ? (
                  <span className="text-red-600">{statsError}</span>
                ) : (
                  <>
                    Server pending:{" "}
                    <span className="font-semibold text-slate-700">
                      {pendingQuotesFromStats ?? 0}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="hidden sm:flex items-center justify-center rounded-2xl border border-slate-100 bg-slate-50 p-3">
              <FiFileText className="text-2xl text-slate-600" />
            </div>
          </div>
        </Card>

        <Card
          title="Total Leads"
          subtitle="Overall + this week + due follow-ups"
          right={
            <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <FiTrendingUp />
              Growth
            </span>
          }
        >
          {statsLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : statsError ? (
            <div className="text-sm text-red-600">{statsError}</div>
          ) : (
            <div className="space-y-2">
              <div className="text-3xl font-extrabold text-slate-900">
                {leads?.totalLeads ?? 0}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="text-[11px] text-slate-500">New this week</div>
                  <div className="text-base font-bold text-slate-900">
                    {leads?.newLeadsThisWeek ?? 0}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <div className="text-[11px] text-slate-500">Follow-ups today</div>
                  <div className="text-base font-bold text-slate-900">
                    {leads?.followUpsDueToday ?? 0}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card title="This Week Activity" subtitle="Quotation workflow summary">
          {statsLoading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : statsError ? (
            <div className="text-sm text-red-600">{statsError}</div>
          ) : (
            <div className="space-y-2">
              {weekCards.map((r) => (
                <StatRow key={r.label} label={r.label} value={r.value} />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Pending approval list */}
      <Card
        title="Quotations & Invoices – Pending Approval"
        subtitle="Tap any row to open details"
        right={
          <span className="text-xs font-semibold text-slate-500">
            Total: <span className="text-slate-900">{pendingList.length}</span>
          </span>
        }
      >
        {loading ? (
          <div className="text-sm text-slate-500">Loading pending documents…</div>
        ) : error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : pendingList.length === 0 ? (
          <div className="text-sm text-slate-500">
            No quotations or invoices are pending for approval.
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-slate-100">
              <table className="min-w-[980px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-bold text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Customer / Company</th>
                    <th className="px-4 py-3">Sales Executive</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {pendingList.map((q) => (
                    <tr
                      key={q._id}
                      className="hover:bg-slate-50/70 cursor-pointer"
                      onClick={() => openDetails(q._id)}
                      title="Click to view quotation details"
                    >
                      <td className="px-4 py-3 text-slate-800 capitalize">{q.type}</td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{q.customerName}</div>
                        {q.companyName ? (
                          <div className="text-xs text-slate-500">{q.companyName}</div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {q.salesExecutive?.name || "—"}
                        </div>
                        {q.salesExecutive?.email ? (
                          <div className="text-xs text-slate-500">{q.salesExecutive.email}</div>
                        ) : null}
                      </td>

                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        ₹{moneyINR(q.totalAmount || 0)}
                      </td>

                      <td className="px-4 py-3 text-slate-700">{q.projectName || "—"}</td>

                      <td className="px-4 py-3">
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => handleApprove(q._id)}
                            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                          >
                            <FiCheckCircle />
                            Approve
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReject(q._id)}
                            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                          >
                            <FiXCircle />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="lg:hidden divide-y divide-slate-100 rounded-2xl border border-slate-100 overflow-hidden">
              {pendingList.map((q) => (
                <button
                  key={q._id}
                  type="button"
                  onClick={() => openDetails(q._id)}
                  className="w-full text-left p-4 bg-white hover:bg-slate-50/70 transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 truncate">
                        {q.customerName || "—"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {q.companyName || q.projectName || "—"}
                      </div>

                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700 capitalize">
                          {q.type}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-700">
                          ₹{moneyINR(q.totalAmount || 0)}
                        </span>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-500">
                        SE:{" "}
                        <span className="font-semibold text-slate-700">
                          {q.salesExecutive?.name || "—"}
                        </span>
                      </div>
                    </div>

                    <FiChevronRight className="text-slate-400 mt-1 shrink-0" />
                  </div>

                  <div
                    className="mt-3 flex gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => handleApprove(q._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
                    >
                      <FiCheckCircle />
                      Approve
                    </button>

                    <button
                      type="button"
                      onClick={() => handleReject(q._id)}
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                    >
                      <FiXCircle />
                      Reject
                    </button>
                  </div>
                </button>
              ))}
            </div>

            <p className="mt-3 text-[11px] text-slate-500">
              Tip: Tap a row to view full quotation details. Approve/Reject will not open the
              details window.
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
