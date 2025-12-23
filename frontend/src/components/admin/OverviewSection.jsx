// src/components/admin/OverviewSection.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Card from "./Card";

import {
  fetchPendingQuotes,
  updateQuoteStatus,
  fetchQuoteById, // ✅ make sure this thunk exists in quoteSlice
} from "../../store/slices/quoteSlice";

import { fetchAdminOverview } from "../../store/slices/adminOverviewSlice";

import QuoteDetailsModal from "./QuoteDetailsModal"; // ✅ create this component

const OverviewSection = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();

  // ✅ Avoid "|| {}" inside selectors to prevent warnings
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

  useEffect(() => {
    dispatch(fetchPendingQuotes());
    dispatch(fetchAdminOverview());
  }, [dispatch]);

  const refreshAll = () => {
    dispatch(fetchPendingQuotes());
    dispatch(fetchAdminOverview());
  };

  const openDetails = (id) => {
    setOpen(true);
    dispatch(fetchQuoteById(id));
  };

  const handleApprove = (id) => {
    dispatch(updateQuoteStatus({ id, status: "approved" })).then(refreshAll);
  };

  const handleReject = (id) => {
    dispatch(updateQuoteStatus({ id, status: "rejected" })).then(refreshAll);
  };

  // ✅ Stats paths from your /admin/overview response
  const leads = stats?.leads;
  const week = stats?.quotes?.week;
  const pendingQuotesFromStats = stats?.quotes?.pendingQuotes;

  return (
    <div>
      {/* ✅ Details Modal */}
      <QuoteDetailsModal
        open={open}
        onClose={() => setOpen(false)}
        quote={selectedQuote}
        loading={detailsLoading}
        error={detailsError}
      />

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Overview</h1>

        <button
          type="button"
          onClick={refreshAll}
          className="text-xs px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
        >
          Refresh
        </button>
      </div>

      {/* Top summary cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-4">
        <Card title="Pending Quotations / Invoices">
          <p className="text-2xl font-bold text-slate-800">{pendingList.length}</p>

          <p className="text-xs text-slate-500 mt-1">
            {statsLoading ? (
              "Checking server..."
            ) : statsError ? (
              <span className="text-red-600">{statsError}</span>
            ) : (
              <>
                Server pending:{" "}
                <span className="font-semibold">{pendingQuotesFromStats ?? 0}</span>
              </>
            )}
          </p>
        </Card>

        <Card title="Total Leads">
          {statsLoading ? (
            <p className="text-xs text-slate-500">Loading leads...</p>
          ) : statsError ? (
            <p className="text-xs text-red-600">{statsError}</p>
          ) : (
            <>
              <p className="text-2xl font-bold text-slate-800">
                {leads?.totalLeads ?? 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                New this week:{" "}
                <span className="font-semibold text-slate-700">
                  {leads?.newLeadsThisWeek ?? 0}
                </span>
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Follow-ups due today:{" "}
                <span className="font-semibold text-slate-700">
                  {leads?.followUpsDueToday ?? 0}
                </span>
              </p>
            </>
          )}
        </Card>

        <Card title="This Week Activity">
          {statsLoading ? (
            <p className="text-xs text-slate-500">Loading weekly stats...</p>
          ) : statsError ? (
            <p className="text-xs text-red-600">{statsError}</p>
          ) : (
            <div className="space-y-1 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-semibold">{week?.created ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved</span>
                <span className="font-semibold">{week?.approved ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Rejected</span>
                <span className="font-semibold">{week?.rejected ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved Amount</span>
                <span className="font-semibold">
                  ₹{Number(week?.approvedAmount ?? 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          )}
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
                  <tr
                    key={q._id}
                    className="border-t border-slate-100 hover:bg-slate-50 cursor-pointer"
                    onClick={() => openDetails(q._id)} // ✅ click row to view details
                    title="Click to view quotation details"
                  >
                    <td className="px-3 py-2 text-slate-800 capitalize">{q.type}</td>

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

                    <td className="px-3 py-2 text-slate-600">{q.projectName || "-"}</td>

                    <td className="px-3 py-2 text-center">
                      <div className="inline-flex gap-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ prevent opening modal
                            handleApprove(q._id);
                          }}
                          className="px-2 py-0.5 text-[11px] rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                        >
                          Approve
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // ✅ prevent opening modal
                            handleReject(q._id);
                          }}
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
          Tip: Click any row to view full quotation details. Approve/Reject buttons won’t open
          the details window.
        </p>
      </Card>
    </div>
  );
};

export default OverviewSection;







































// // src/components/admin/OverviewSection.jsx
// import React, { useEffect } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import Card from "./Card";
// import { fetchPendingQuotes, updateQuoteStatus } from "../../store/slices/quoteSlice";
// import { fetchAdminOverview } from "../../store/slices/adminOverviewSlice";

// const OverviewSection = () => {
//   const [open, setOpen] = useState(false);

//   const dispatch = useDispatch();

//   // ✅ Correct reducers from store
//   const { pendingList = [], loading, error } = useSelector((state) => state.quotes || {});
//   const {
//     stats,
//     loading: statsLoading,
//     error: statsError,
//   } = useSelector((state) => state.adminOverview || {});

//   const { selectedQuote, detailsLoading, detailsError } = useSelector((s) => s.quotes);

//   const openDetails = (id) => {
//     setOpen(true);
//     dispatch(fetchQuoteById(id));
//   };

//   useEffect(() => {
//     dispatch(fetchPendingQuotes());
//     dispatch(fetchAdminOverview());
//   }, [dispatch]);

//   const refreshAll = () => {
//     dispatch(fetchPendingQuotes());
//     dispatch(fetchAdminOverview());
//   };

//   const handleApprove = (id) => {
//     dispatch(updateQuoteStatus({ id, status: "approved" })).then(refreshAll);
//   };

//   const handleReject = (id) => {
//     dispatch(updateQuoteStatus({ id, status: "rejected" })).then(refreshAll);
//   };

//   // ✅ FIXED PATHS (THIS IS THE MAIN ISSUE)
//   const leads = stats?.leads;
//   const week = stats?.quotes?.week;
//   const pendingQuotesFromStats = stats?.quotes?.pendingQuotes;

//   return (
//     <div>
//       <div className="flex items-center justify-between mb-4">
//         <h1 className="text-xl font-bold text-slate-800">Overview</h1>

//         <button
//           type="button"
//           onClick={refreshAll}
//           className="text-xs px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
//         >
//           Refresh
//         </button>
//       </div>

//       {/* Top summary cards */}
//       <div className="grid gap-4 md:grid-cols-3 mb-4">
//         <Card title="Pending Quotations / Invoices">
//           <p className="text-2xl font-bold text-slate-800">
//             {pendingList.length}
//           </p>

//           <p className="text-xs text-slate-500 mt-1">
//             {statsLoading ? (
//               "Checking server..."
//             ) : statsError ? (
//               <span className="text-red-600">{statsError}</span>
//             ) : (
//               <>
//                 Server pending:{" "}
//                 <span className="font-semibold">{pendingQuotesFromStats ?? 0}</span>
//               </>
//             )}
//           </p>
//         </Card>

//         <Card title="Total Leads">
//           {statsLoading ? (
//             <p className="text-xs text-slate-500">Loading leads...</p>
//           ) : statsError ? (
//             <p className="text-xs text-red-600">{statsError}</p>
//           ) : (
//             <>
//               <p className="text-2xl font-bold text-slate-800">
//                 {leads?.totalLeads ?? 0}
//               </p>
//               <p className="text-xs text-slate-500 mt-1">
//                 New this week:{" "}
//                 <span className="font-semibold text-slate-700">
//                   {leads?.newLeadsThisWeek ?? 0}
//                 </span>
//               </p>
//               <p className="text-[11px] text-slate-500 mt-1">
//                 Follow-ups due today:{" "}
//                 <span className="font-semibold text-slate-700">
//                   {leads?.followUpsDueToday ?? 0}
//                 </span>
//               </p>
//             </>
//           )}
//         </Card>

//         <Card title="This Week Activity">
//           {statsLoading ? (
//             <p className="text-xs text-slate-500">Loading weekly stats...</p>
//           ) : statsError ? (
//             <p className="text-xs text-red-600">{statsError}</p>
//           ) : (
//             <div className="space-y-1 text-xs text-slate-700">
//               <div className="flex justify-between">
//                 <span>Created</span>
//                 <span className="font-semibold">{week?.created ?? 0}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Approved</span>
//                 <span className="font-semibold">{week?.approved ?? 0}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Rejected</span>
//                 <span className="font-semibold">{week?.rejected ?? 0}</span>
//               </div>
//               <div className="flex justify-between">
//                 <span>Approved Amount</span>
//                 <span className="font-semibold">
//                   ₹{Number(week?.approvedAmount ?? 0).toLocaleString("en-IN")}
//                 </span>
//               </div>
//             </div>
//           )}
//         </Card>
//       </div>

//       {/* Pending approval table */}
//       <Card title="Quotations & Invoices – Pending Approval">
//         {loading ? (
//           <p className="text-xs text-slate-500">Loading pending documents...</p>
//         ) : error ? (
//           <p className="text-xs text-red-600">{error}</p>
//         ) : pendingList.length === 0 ? (
//           <p className="text-xs text-slate-500">
//             No quotations or invoices are pending for approval.
//           </p>
//         ) : (
//           <div className="border border-slate-100 rounded-lg overflow-hidden">
//             <table className="w-full text-xs">
//               <thead className="bg-slate-50">
//                 <tr>
//                   <th className="px-3 py-2 text-left">Type</th>
//                   <th className="px-3 py-2 text-left">Customer / Company</th>
//                   <th className="px-3 py-2 text-left">Sales Executive</th>
//                   <th className="px-3 py-2 text-right">Total</th>
//                   <th className="px-3 py-2 text-left">Project</th>
//                   <th className="px-3 py-2 text-center">Actions</th>
//                 </tr>
//               </thead>

//               <tbody>
//                 {pendingList.map((q) => (
//                   <tr key={q._id} className="border-t border-slate-100">
//                     <td className="px-3 py-2 text-slate-800 capitalize">{q.type}</td>
//                     <td className="px-3 py-2 text-slate-700">
//                       <div className="font-medium">{q.customerName}</div>
//                       {q.companyName && (
//                         <div className="text-[11px] text-slate-500">{q.companyName}</div>
//                       )}
//                     </td>
//                     <td className="px-3 py-2 text-slate-700">
//                       {q.salesExecutive?.name || "-"}
//                       {q.salesExecutive?.email && (
//                         <div className="text-[11px] text-slate-500">
//                           {q.salesExecutive.email}
//                         </div>
//                       )}
//                     </td>
//                     <td className="px-3 py-2 text-right text-slate-800">
//                       ₹{Number(q.totalAmount || 0).toFixed(2)}
//                     </td>
//                     <td className="px-3 py-2 text-slate-600">{q.projectName || "-"}</td>
//                     <td className="px-3 py-2 text-center">
//                       <div className="inline-flex gap-1">
//                         <button
//                           type="button"
//                           onClick={() => handleApprove(q._id)}
//                           className="px-2 py-0.5 text-[11px] rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
//                         >
//                           Approve
//                         </button>
//                         <button
//                           type="button"
//                           onClick={() => handleReject(q._id)}
//                           className="px-2 py-0.5 text-[11px] rounded-md bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
//                         >
//                           Reject
//                         </button>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}

//         <p className="mt-2 text-[11px] text-slate-500">
//           Once you approve, the sales executive will see the document as{" "}
//           <strong>Approved</strong> and can download final PDF.
//         </p>
//       </Card>
//     </div>
//   );
// };

// export default OverviewSection;
