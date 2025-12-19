// src/components/sales/QuotationInvoice.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import Card from "./Card";

/* ✅ PDF (client-side) */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const emptyItem = { description: "", quantity: 1, unitPrice: 0 };

const money = (n) => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString("en-IN", { maximumFractionDigits: 2, minimumFractionDigits: 2 });
  } catch {
    return v.toFixed(2);
  }
};

const safe = (v) => String(v ?? "").trim();
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const QuotationInvoice = () => {
  const [type, setType] = useState("quotation");
  const [customer, setCustomer] = useState({
    customerName: "",
    companyName: "",
    customerEmail: "",
    customerPhone: "",
    projectName: "",
  });
  const [items, setItems] = useState([{ ...emptyItem }]);
  const [taxPercent, setTaxPercent] = useState(18);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [myDocs, setMyDocs] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  const [previewDoc, setPreviewDoc] = useState(null);

  /* 👉 Calculate totals */
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0),
        0
      ),
    [items]
  );

  const taxAmount = useMemo(
    () => (subtotal * (Number(taxPercent) || 0)) / 100,
    [subtotal, taxPercent]
  );

  const totalAmount = subtotal + taxAmount;

  /* 👉 Load current user's docs from API */
  const fetchMyDocs = async () => {
    try {
      setLoadingList(true);
      const res = await axiosClient.get("/quotes/my", {
        params: { type },
      });
      setMyDocs(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchMyDocs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleCustomerChange = (e) => {
    setCustomer((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const addItem = () => {
    setItems((prev) => [...prev, { ...emptyItem }]);
  };

  const removeItem = (index) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!customer.customerName || !items.length) {
      setError("Customer name and at least one item are required.");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        type,
        ...customer,
        items: items.map((it) => ({
          description: it.description,
          quantity: Number(it.quantity) || 0,
          unitPrice: Number(it.unitPrice) || 0,
        })),
        taxPercent: Number(taxPercent) || 0,
        notes,
      };

      const res = await axiosClient.post("/quotes", payload);
      setMessage(
        `${type === "quotation" ? "Quotation" : "Invoice"} created successfully (status: ${
          res.data.data.status
        }).`
      );

      // reset form
      setCustomer({
        customerName: "",
        companyName: "",
        customerEmail: "",
        customerPhone: "",
        projectName: "",
      });
      setItems([{ ...emptyItem }]);
      setNotes("");

      // refresh list
      fetchMyDocs();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to create quotation/invoice. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = (doc) => setPreviewDoc(doc);

  /* =========================
     ✅ PDF Download (no cut)
  ========================= */
  const downloadPDF = (doc) => {
    if (!doc) return;

    const isQ = doc.type === "quotation";
    const title = isQ ? "QUOTATION" : "INVOICE";

    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 40;

    const nowDate = doc.createdAt ? new Date(doc.createdAt) : new Date();

    // Header
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(title, margin, 48);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);
    pdf.text(`Date: ${nowDate.toLocaleDateString("en-IN")}`, pageW - margin, 48, {
      align: "right",
    });

    pdf.setFontSize(10);
    const status = safe(doc.status);
    if (status) {
      pdf.text(`Status: ${status}`, pageW - margin, 64, { align: "right" });
    }

    // Customer block (wrap to avoid cut)
    const leftX = margin;
    const rightX = pageW - margin;
    let y = 80;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.text("Customer Details", leftX, y);
    y += 12;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    const lines = [
      `Name: ${safe(doc.customerName) || "-"}`,
      `Company: ${safe(doc.companyName) || "-"}`,
      `Email: ${safe(doc.customerEmail) || "-"}`,
      `Phone: ${safe(doc.customerPhone) || "-"}`,
      `Project: ${safe(doc.projectName) || "-"}`,
    ];

    const maxTextW = pageW - margin * 2;
    lines.forEach((ln) => {
      const wrapped = pdf.splitTextToSize(ln, maxTextW);
      pdf.text(wrapped, leftX, y);
      y += wrapped.length * 12;
    });

    y += 10;

    // Table rows
    const rows = (doc.items || []).map((it, idx) => {
      const qty = Number(it.quantity || 0);
      const rate = Number(it.unitPrice || 0);
      const amt = qty * rate;
      return [
        String(idx + 1),
        safe(it.description) || "-",
        String(qty),
        `₹ ${money(rate)}`,
        `₹ ${money(amt)}`,
      ];
    });

    // Totals (fallbacks)
    const _subtotal = Number(doc.subtotal ?? doc.totalBeforeTax ?? 0) || rows.reduce((s, r) => s + Number(String(r[4]).replace(/[^\d.]/g, "")) || 0, 0);
    const _taxPercent = Number(doc.taxPercent ?? 0);
    const _taxAmount = Number(doc.taxAmount ?? (_subtotal * _taxPercent) / 100);
    const _total = Number(doc.totalAmount ?? (_subtotal + _taxAmount));

    // autoTable (handles page breaks, wraps)
    autoTable(pdf, {
      startY: y,
      head: [["#", "Description", "Qty", "Unit Price", "Amount"]],
      body: rows.length ? rows : [["-", "No items", "-", "-", "-"]],
      theme: "grid",
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 6,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: { fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 28 },
        1: { cellWidth: pageW - margin * 2 - (28 + 44 + 90 + 90) }, // description auto
        2: { cellWidth: 44, halign: "right" },
        3: { cellWidth: 90, halign: "right" },
        4: { cellWidth: 90, halign: "right" },
      },
      margin: { left: margin, right: margin },
    });

    const afterTableY = pdf.lastAutoTable.finalY + 14;

    // Totals box (ensure not cut)
    let ty = afterTableY;
    const boxW = 220;
    const boxX = rightX - boxW;

    // if near bottom, push to next page
    if (ty + 110 > pageH - margin) {
      pdf.addPage();
      ty = margin;
    }

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    const linesTotals = [
      ["Subtotal", `₹ ${money(_subtotal)}`],
      [`Tax (${money(_taxPercent)}%)`, `₹ ${money(_taxAmount)}`],
      ["Total", `₹ ${money(_total)}`],
    ];

    // Draw totals box
    pdf.setDrawColor(220);
    pdf.roundedRect(boxX, ty - 10, boxW, 78, 8, 8);

    let ly = ty + 10;
    linesTotals.forEach(([k, v], i) => {
      if (i === 2) {
        pdf.setFont("helvetica", "bold");
      } else {
        pdf.setFont("helvetica", "normal");
      }
      pdf.text(String(k), boxX + 12, ly);
      pdf.text(String(v), boxX + boxW - 12, ly, { align: "right" });
      ly += 22;
    });

    // Notes (wrap + page break)
    const noteText = safe(doc.notes);
    let ny = ly + 10;

    if (noteText) {
      if (ny + 60 > pageH - margin) {
        pdf.addPage();
        ny = margin;
      }

      pdf.setFont("helvetica", "bold");
      pdf.text("Notes / Terms", margin, ny);
      ny += 14;

      pdf.setFont("helvetica", "normal");
      const wrappedNotes = pdf.splitTextToSize(noteText, pageW - margin * 2);
      pdf.text(wrappedNotes, margin, ny);
    }

    // Footer
    const fileSafeName = (safe(doc.customerName) || "Customer")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .slice(0, 30)
      .replace(/\s+/g, "_");

    const fileName = `${title}_${fileSafeName}_${nowDate
      .toISOString()
      .slice(0, 10)}.pdf`;

    pdf.save(fileName);
  };

  const statusPill = (st) => {
    if (st === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (st === "rejected") return "bg-red-50 text-red-700 border-red-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  return (
    <div className="space-y-4" style={{ background: "#EFF6FF", padding: 12, borderRadius: 16 }}>
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 whitespace-normal break-words">
              Quotation &amp; Invoice System
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 whitespace-normal break-words">
              Create quotation/invoice, track approval, and download clean PDFs without cutting.
            </p>
          </div>

          {/* Toggle (mobile scroll) */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            <button
              type="button"
              onClick={() => setType("quotation")}
              className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-2xl border transition active:scale-[0.99] ${
                type === "quotation"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Create Quotation
            </button>
            <button
              type="button"
              onClick={() => setType("invoice")}
              className={`shrink-0 px-4 py-2 text-sm font-semibold rounded-2xl border transition active:scale-[0.99] ${
                type === "invoice"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Create Invoice
            </button>
          </div>
        </div>

        {(error || message) && (
          <div
            className={`mt-3 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}
      </div>

      {/* Form */}
      <Card title={type === "quotation" ? "New Quotation Details" : "New Invoice Details"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer info */}
          <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Customer Name *
              </label>
              <input
                name="customerName"
                value={customer.customerName}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Site In-charge / Client name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Company / Contractor
              </label>
              <input
                name="companyName"
                value={customer.companyName}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Company / Project owner"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <input
                name="customerEmail"
                value={customer.customerEmail}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="client@mail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Phone
              </label>
              <input
                name="customerPhone"
                value={customer.customerPhone}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="+91-XXXXXXXXXX"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Project / Site Name
              </label>
              <input
                name="projectName"
                value={customer.projectName}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                placeholder="Project / Site details"
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-2 gap-2">
              <span className="text-xs font-semibold text-slate-700">Line Items *</span>
              <button
                type="button"
                onClick={addItem}
                className="shrink-0 text-xs font-semibold text-slate-900 border border-slate-200 rounded-2xl px-3 py-1.5 bg-white hover:bg-slate-50 active:scale-[0.99]"
              >
                + Add Item
              </button>
            </div>

            {/* ✅ Mobile: card items (no cutting). Desktop: table */}
            <div className="lg:hidden space-y-3">
              {items.map((item, index) => {
                const lineTotal =
                  (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

                return (
                  <div
                    key={index}
                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        Item {index + 1}
                      </div>
                      {items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-xs font-semibold text-red-600 border border-red-200 rounded-2xl px-3 py-1 bg-white hover:bg-red-50 active:scale-[0.99]"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                        Description
                      </label>
                      <input
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                        placeholder="Product / service"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Qty
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleItemChange(index, "quantity", e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 text-right"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleItemChange(index, "unitPrice", e.target.value)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 text-right"
                        />
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-xs text-slate-600">Line Total</div>
                      <div className="text-base font-bold text-slate-900">
                        ₹{money(lineTotal)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="hidden lg:block border border-slate-200 rounded-3xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-3 text-left">Description</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Unit Price</th>
                      <th className="px-3 py-3 text-right">Total</th>
                      <th className="px-3 py-3 text-center">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const lineTotal =
                        (Number(item.quantity) || 0) *
                        (Number(item.unitPrice) || 0);
                      return (
                        <tr key={index} className="border-t border-slate-100">
                          <td className="px-3 py-2.5">
                            <input
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(index, "description", e.target.value)
                              }
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                              placeholder="Product / service"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) =>
                                handleItemChange(index, "quantity", e.target.value)
                              }
                              className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 text-right"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) =>
                                handleItemChange(index, "unitPrice", e.target.value)
                              }
                              className="w-28 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 text-right"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                            ₹{money(lineTotal)}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(index)}
                                className="text-sm font-semibold text-red-600 hover:underline"
                              >
                                Remove
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Tax & totals */}
          <div className="grid gap-3 md:grid-cols-2 items-start">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Tax (%) – e.g. GST
              </label>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                className="w-32 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
              <p className="text-xs text-slate-600 mt-2 whitespace-normal break-words">
                Subtotal: <b className="text-slate-900">₹{money(subtotal)}</b> • Tax:{" "}
                <b className="text-slate-900">₹{money(taxAmount)}</b>
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-right">
              <p className="text-xs text-slate-500">Total Amount</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                ₹{money(totalAmount)}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                (Auto calculated from items)
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Notes / Terms
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-3xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              placeholder="Payment terms, validity, delivery conditions, etc."
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full sm:w-auto items-center justify-center px-4 py-2.5 text-sm font-semibold bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 active:scale-[0.99] transition disabled:opacity-60"
          >
            {submitting
              ? "Saving..."
              : type === "quotation"
              ? "Save Quotation (Waiting for Admin Approval)"
              : "Save Invoice (Waiting for Admin Approval)"}
          </button>
        </form>
      </Card>

      {/* List of own docs */}
      <Card title={`Your ${type === "quotation" ? "Quotations" : "Invoices"}`}>
        {loadingList ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : myDocs.length === 0 ? (
          <p className="text-sm text-slate-600">
            No {type === "quotation" ? "quotations" : "invoices"} created yet.
          </p>
        ) : (
          <>
            {/* ✅ Mobile cards (no cutting) */}
            <div className="grid gap-3 lg:hidden">
              {myDocs.map((doc) => (
                <div
                  key={doc._id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-900 break-words">
                        {doc.customerName}
                      </div>
                      <div className="mt-1 text-xs text-slate-600 break-words">
                        Project: {doc.projectName || "-"}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusPill(
                        doc.status
                      )}`}
                    >
                      {doc.status === "pending"
                        ? "Pending"
                        : doc.status === "approved"
                        ? "Approved"
                        : "Rejected"}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">Total</div>
                      <div className="mt-1 text-sm font-bold text-slate-900">
                        ₹{money(doc.totalAmount || 0)}
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">Type</div>
                      <div className="mt-1 text-sm font-bold text-slate-900 capitalize">
                        {doc.type}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={() => handlePreview(doc)}
                      className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                    >
                      View
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPDF(doc)}
                      className="w-full sm:w-auto rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black active:scale-[0.99]"
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ✅ Desktop table */}
            <div className="hidden lg:block border border-slate-100 rounded-3xl overflow-hidden bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left">Customer</th>
                      <th className="px-4 py-3 text-left">Project</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myDocs.map((doc) => (
                      <tr key={doc._id} className="border-t border-slate-100">
                        <td className="px-4 py-3 text-slate-900 font-semibold">
                          {doc.customerName}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {doc.projectName || "-"}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-900 font-semibold">
                          ₹{money(doc.totalAmount || 0)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusPill(
                              doc.status
                            )}`}
                          >
                            {doc.status === "pending"
                              ? "Pending Admin Approval"
                              : doc.status === "approved"
                              ? "Approved"
                              : "Rejected"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex gap-2">
                            <button
                              type="button"
                              onClick={() => handlePreview(doc)}
                              className="text-sm font-semibold text-sky-700 hover:underline"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadPDF(doc)}
                              className="text-sm font-semibold text-slate-900 hover:underline"
                            >
                              Download PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        <p className="mt-3 text-xs text-slate-500 whitespace-normal break-words">
          Note: Before admin approval, this acts as a <strong>copy</strong> for your reference.
          Once approved, it becomes the final quotation/invoice.
        </p>
      </Card>

      {/* Preview */}
      {previewDoc && (
        <Card title={`Preview – ${previewDoc.type === "quotation" ? "Quotation" : "Invoice"}`}>
          <div className="space-y-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-900 break-words">
                    {previewDoc.customerName}
                  </p>
                  {previewDoc.companyName ? (
                    <p className="text-sm text-slate-700 break-words">{previewDoc.companyName}</p>
                  ) : null}
                  {previewDoc.customerEmail ? (
                    <p className="text-sm text-slate-700 break-all">{previewDoc.customerEmail}</p>
                  ) : null}
                  {previewDoc.customerPhone ? (
                    <p className="text-sm text-slate-700 break-all">{previewDoc.customerPhone}</p>
                  ) : null}
                </div>

                <div className="sm:text-right">
                  <p className="text-sm font-bold text-slate-900">
                    {previewDoc.type === "quotation" ? "QUOTATION" : "INVOICE"}
                  </p>
                  <p className="text-xs text-slate-600">
                    Date: {new Date(previewDoc.createdAt).toLocaleDateString("en-IN")}
                  </p>
                  <p className="text-xs text-slate-600 capitalize">Status: {previewDoc.status}</p>
                </div>
              </div>

              {previewDoc.projectName ? (
                <p className="mt-3 text-sm text-slate-700 break-words">
                  <span className="font-semibold text-slate-900">Project:</span>{" "}
                  {previewDoc.projectName}
                </p>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700">
                    <tr>
                      <th className="px-3 py-3 text-left">Description</th>
                      <th className="px-3 py-3 text-right">Qty</th>
                      <th className="px-3 py-3 text-right">Unit Price</th>
                      <th className="px-3 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewDoc.items.map((it, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-3 py-2.5 break-words">{it.description}</td>
                        <td className="px-3 py-2.5 text-right">{it.quantity}</td>
                        <td className="px-3 py-2.5 text-right">
                          ₹{money(it.unitPrice || 0)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-900">
                          ₹{money((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex justify-end">
                <div className="text-right">
                  <p className="text-sm text-slate-700">
                    Subtotal: <b className="text-slate-900">₹{money(previewDoc.subtotal || 0)}</b>
                  </p>
                  <p className="text-sm text-slate-700">
                    Tax ({previewDoc.taxPercent || 0}%):{" "}
                    <b className="text-slate-900">₹{money(previewDoc.taxAmount || 0)}</b>
                  </p>
                  <p className="text-lg font-bold text-slate-900">
                    Total: ₹{money(previewDoc.totalAmount || 0)}
                  </p>
                </div>
              </div>

              {previewDoc.notes ? (
                <div className="mt-3 text-sm text-slate-700 break-words whitespace-pre-wrap">
                  <span className="font-semibold text-slate-900">Notes / Terms: </span>
                  {previewDoc.notes}
                </div>
              ) : null}

              <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-between">
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                >
                  Close
                </button>

                <button
                  type="button"
                  onClick={() => downloadPDF(previewDoc)}
                  className="w-full sm:w-auto rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black active:scale-[0.99]"
                >
                  Download PDF (No Cut)
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default QuotationInvoice;

 




