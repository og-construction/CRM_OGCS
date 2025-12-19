// src/components/admin/OverviewSection.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "./Card";
import {
  fetchPendingQuotes,
  updateQuoteStatus,
} from "../../store/slices/quoteSlice";

const OverviewSection = () => {
  const dispatch = useDispatch();
  const { pendingList, loading, error } = useSelector(
    (state) => state.quotes
  );

  useEffect(() => {
    dispatch(fetchPendingQuotes());
  }, [dispatch]);

  const handleApprove = (id) => {
    dispatch(updateQuoteStatus({ id, status: "approved" })).then(() => {
      // refresh list after update
      dispatch(fetchPendingQuotes());
    });
  };

  const handleReject = (id) => {
    dispatch(updateQuoteStatus({ id, status: "rejected" })).then(() => {
      dispatch(fetchPendingQuotes());
    });
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">Overview</h1>

      {/* Top summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card title="Pending Quotations / Invoices">
          <p className="text-2xl font-bold text-slate-800">
            {pendingList.length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Documents waiting for admin approval.
          </p>
        </Card>

        <Card title="Total Leads">
          <p className="text-2xl font-bold text-slate-800">0</p>
          <p className="text-xs text-slate-500 mt-1">
            Later we will connect this with Leads module.
          </p>
        </Card>

        <Card title="This Week Activity">
          <p className="text-xs text-slate-500">
            Summary of approvals, leads and follow-ups will be shown here.
          </p>
        </Card>
      </div>

      {/* Pending approval table */}
      <Card title="Quotations & Invoices – Pending Approval">
        {loading ? (
          <p className="text-xs text-slate-500">Loading pending documents...</p>
        ) : error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : pendingList.length === 0 ? (
          <p className="text-xs text-slate-500">
            No quotations or invoices are pending for approval.
          </p>
        ) : (
          <div className="border border-slate-100 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left">Type</th>
                  <th className="px-3 py-2 text-left">Customer / Company</th>
                  <th className="px-3 py-2 text-left">Sales Executive</th>
                  <th className="px-3 py-2 text-right">Total</th>
                  <th className="px-3 py-2 text-left">Project</th>
                  <th className="px-3 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingList.map((q) => (
                  <tr key={q._id} className="border-t border-slate-100">
                    <td className="px-3 py-2 text-slate-800 capitalize">
                      {q.type}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      <div className="font-medium">{q.customerName}</div>
                      {q.companyName && (
                        <div className="text-[11px] text-slate-500">
                          {q.companyName}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {q.salesExecutive?.name || "-"}
                      {q.salesExecutive?.email && (
                        <div className="text-[11px] text-slate-500">
                          {q.salesExecutive.email}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-800">
                      ₹{Number(q.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-slate-600">
                      {q.projectName || "-"}
                    </td>
                    <td className="px-3 py-2 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={() => handleApprove(q._id)}
                          className="px-2 py-0.5 text-[11px] rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(q._id)}
                          className="px-2 py-0.5 text-[11px] rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-2 text-[11px] text-slate-500">
          Once you approve, the sales executive will see the document as{" "}
          <strong>Approved</strong> in their Quotation &amp; Invoice section and
          can download it as final.
        </p>
      </Card>
    </div>
  );
};

export default OverviewSection;
