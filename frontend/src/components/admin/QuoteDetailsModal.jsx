
// src/components/admin/QuoteDetailsModal.jsx
import React, { useEffect } from "react";

const money = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const safeDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleString();
};

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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      <div className="absolute left-1/2 top-1/2 w-[95%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <div className="font-semibold text-slate-800">
              Quotation / Invoice Details
            </div>
            <div className="text-xs text-slate-500">
              {quote?._id ? `ID: ${quote._id}` : ""}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="p-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading details...</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : !quote ? (
            <p className="text-sm text-slate-500">No data</p>
          ) : (
            <>
              {/* ✅ Top info */}
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div>
                  <div className="text-xs text-slate-500">Type</div>
                  <div className="font-medium capitalize">{quote.type}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Status</div>
                  <div className="font-medium capitalize">{quote.status}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Customer</div>
                  <div className="font-medium">{quote.customerName}</div>
                  {quote.companyName ? (
                    <div className="text-xs text-slate-500">{quote.companyName}</div>
                  ) : null}
                </div>

                <div>
                  <div className="text-xs text-slate-500">Sales Executive</div>
                  <div className="font-medium">{quote.salesExecutive?.name || "-"}</div>
                  {quote.salesExecutive?.email ? (
                    <div className="text-xs text-slate-500">{quote.salesExecutive.email}</div>
                  ) : null}
                </div>

                <div>
                  <div className="text-xs text-slate-500">Project</div>
                  <div className="font-medium">{quote.projectName || "-"}</div>
                </div>

                <div>
                  <div className="text-xs text-slate-500">Created</div>
                  <div className="font-medium">{safeDate(quote.createdAt)}</div>
                </div>

                {/* ✅ Show approval info if exists */}
                <div>
                  <div className="text-xs text-slate-500">Approved / Rejected By</div>
                  <div className="font-medium">
                    {quote.approvedBy?.name || "-"}
                  </div>
                  {quote.approvedBy?.email ? (
                    <div className="text-xs text-slate-500">{quote.approvedBy.email}</div>
                  ) : null}
                </div>

                <div>
                  <div className="text-xs text-slate-500">Approved / Rejected At</div>
                  <div className="font-medium">{safeDate(quote.approvedAt)}</div>
                </div>
              </div>

              {/* ✅ Items table */}
              <div className="mt-4 border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Description</th>
                      <th className="px-3 py-2 text-right">Qty</th>
                      <th className="px-3 py-2 text-right">Rate</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(quote.items || []).length === 0 ? (
                      <tr className="border-t">
                        <td className="px-3 py-3 text-slate-500" colSpan={4}>
                          No items found
                        </td>
                      </tr>
                    ) : (
                      quote.items.map((it, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-3 py-2">{it.description}</td>
                          <td className="px-3 py-2 text-right">{it.quantity}</td>
                          <td className="px-3 py-2 text-right">₹{money(it.unitPrice)}</td>
                          <td className="px-3 py-2 text-right">₹{money(it.lineTotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ✅ Totals */}
              <div className="mt-3 flex justify-end text-sm">
                <div className="w-full max-w-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-semibold">₹{money(quote.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tax %</span>
                    <span className="font-semibold">{Number(quote.taxPercent || 0)}%</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-slate-800">Total</span>
                    <span className="font-bold">₹{money(quote.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* ✅ Notes */}
              {quote.notes ? (
                <div className="mt-4">
                  <div className="text-xs text-slate-500 mb-1">Notes</div>
                  <div className="text-sm text-slate-700 whitespace-pre-wrap">
                    {quote.notes}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuoteDetailsModal;




















// import React from "react";

// const money = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

// const QuoteDetailsModal = ({ open, onClose, quote, loading, error }) => {
//   if (!open) return null;

//   return (
//     <div className="fixed inset-0 z-50">
//       <div className="absolute inset-0 bg-black/30" onClick={onClose} />
//       <div className="absolute left-1/2 top-1/2 w-[95%] max-w-3xl -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white shadow-xl">
//         <div className="flex items-center justify-between border-b px-4 py-3">
//           <div>
//             <div className="font-semibold text-slate-800">Quotation / Invoice Details</div>
//             <div className="text-xs text-slate-500">
//               {quote?._id ? `ID: ${quote._id}` : ""}
//             </div>
//           </div>
//           <button
//             type="button"
//             onClick={onClose}
//             className="text-xs px-3 py-1 rounded-md border border-slate-200 hover:bg-slate-50"
//           >
//             Close
//           </button>
//         </div>

//         <div className="p-4">
//           {loading ? (
//             <p className="text-sm text-slate-500">Loading details...</p>
//           ) : error ? (
//             <p className="text-sm text-red-600">{error}</p>
//           ) : !quote ? (
//             <p className="text-sm text-slate-500">No data</p>
//           ) : (
//             <>
//               <div className="grid gap-3 md:grid-cols-2 text-sm">
//                 <div>
//                   <div className="text-xs text-slate-500">Type</div>
//                   <div className="font-medium capitalize">{quote.type}</div>
//                 </div>
//                 <div>
//                   <div className="text-xs text-slate-500">Status</div>
//                   <div className="font-medium capitalize">{quote.status}</div>
//                 </div>
//                 <div>
//                   <div className="text-xs text-slate-500">Customer</div>
//                   <div className="font-medium">{quote.customerName}</div>
//                   {quote.companyName ? <div className="text-xs text-slate-500">{quote.companyName}</div> : null}
//                 </div>
//                 <div>
//                   <div className="text-xs text-slate-500">Sales Executive</div>
//                   <div className="font-medium">{quote.salesExecutive?.name || "-"}</div>
//                   {quote.salesExecutive?.email ? <div className="text-xs text-slate-500">{quote.salesExecutive.email}</div> : null}
//                 </div>
//                 <div>
//                   <div className="text-xs text-slate-500">Project</div>
//                   <div className="font-medium">{quote.projectName || "-"}</div>
//                 </div>
//                 <div>
//                   <div className="text-xs text-slate-500">Created</div>
//                   <div className="font-medium">{new Date(quote.createdAt).toLocaleString()}</div>
//                 </div>
//               </div>

//               <div className="mt-4 border rounded-lg overflow-hidden">
//                 <table className="w-full text-xs">
//                   <thead className="bg-slate-50">
//                     <tr>
//                       <th className="px-3 py-2 text-left">Description</th>
//                       <th className="px-3 py-2 text-right">Qty</th>
//                       <th className="px-3 py-2 text-right">Rate</th>
//                       <th className="px-3 py-2 text-right">Line Total</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {quote.items?.map((it, idx) => (
//                       <tr key={idx} className="border-t">
//                         <td className="px-3 py-2">{it.description}</td>
//                         <td className="px-3 py-2 text-right">{it.quantity}</td>
//                         <td className="px-3 py-2 text-right">₹{money(it.unitPrice)}</td>
//                         <td className="px-3 py-2 text-right">₹{money(it.lineTotal)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>

//               <div className="mt-3 flex justify-end text-sm">
//                 <div className="w-full max-w-xs space-y-1">
//                   <div className="flex justify-between">
//                     <span className="text-slate-600">Subtotal</span>
//                     <span className="font-semibold">₹{money(quote.subtotal)}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-slate-600">Tax %</span>
//                     <span className="font-semibold">{Number(quote.taxPercent || 0)}%</span>
//                   </div>
//                   <div className="flex justify-between border-t pt-2">
//                     <span className="text-slate-800">Total</span>
//                     <span className="font-bold">₹{money(quote.totalAmount)}</span>
//                   </div>
//                 </div>
//               </div>

//               {quote.notes ? (
//                 <div className="mt-4">
//                   <div className="text-xs text-slate-500 mb-1">Notes</div>
//                   <div className="text-sm text-slate-700 whitespace-pre-wrap">{quote.notes}</div>
//                 </div>
//               ) : null}
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default QuoteDetailsModal;
