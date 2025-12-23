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
    return v.toLocaleString("en-IN", {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
    });
  } catch {
    return v.toFixed(2);
  }
};

const safe = (v) => String(v ?? "").trim();

// ✅ ONLY for TEXT fields (description / notes / customer fields)
const pdfWrap = (value, chunk = 14) => {
  const s = String(value ?? "").trim();
  const normalized = s.replace(/\s+/g, " ");
  return normalized
    .split(" ")
    .map((word) => {
      if (word.length <= chunk) return word;
      return word.match(new RegExp(`.{1,${chunk}}`, "g")).join("\u200B");
    })
    .join(" ");
};

// ✅ IMPORTANT: DO NOT use ₹ in jsPDF default fonts
const currency = (n) => `INR ${money(n)}`;


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

  // ✅ PDF VIEW STATES
  const [pdfViewOpen, setPdfViewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

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
      const res = await axiosClient.get("/quotes/my", { params: { type } });
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

  // ✅ cleanup blob url on unmount
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCustomerChange = (e) => {
    setCustomer((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!customer.customerName || !items.length) {
      setError("Customer name and at least one item are required.");
      return;
    }

    const hasValidItem = items.some(
      (it) => safe(it.description) && Number(it.quantity) > 0
    );
    if (!hasValidItem) {
      setError("Please add at least one valid item (description + qty).");
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        type,
        ...customer,
        items: items
          .filter((it) => safe(it.description))
          .map((it) => ({
            description: safe(it.description),
            quantity: Math.max(1, Number(it.quantity) || 1),
            unitPrice: Math.max(0, Number(it.unitPrice) || 0),
          })),
        taxPercent: Math.max(0, Number(taxPercent) || 0),
        notes: safe(notes),
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

  const statusPill = (st) => {
    if (st === "approved") return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (st === "rejected") return "bg-red-50 text-red-700 border-red-200";
    return "bg-amber-50 text-amber-700 border-amber-200";
  };

  /* =========================
     ✅ PDF BUILDER (NO OVERFLOW)
  ========================= */
 const buildPdf = (doc) => {
  const isQ = doc?.type === "quotation";
  const title = isQ ? "QUOTATION" : "INVOICE";

  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  pdf.setLineHeightFactor(1.2);

  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 40;

  const nowDate = doc?.createdAt ? new Date(doc.createdAt) : new Date();
  const status = safe(doc?.status);

  const header = () => {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(14);
    pdf.text(title, margin, 42);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(`Date: ${nowDate.toLocaleDateString("en-IN")}`, pageW - margin, 40, {
      align: "right",
    });

    if (status) {
      pdf.text(`Status: ${status}`, pageW - margin, 54, { align: "right" });
    }

    pdf.setDrawColor(226);
    pdf.setLineWidth(1);
    pdf.line(margin, 64, pageW - margin, 64);
  };

  const footer = () => {
    const totalPages = pdf.internal.getNumberOfPages();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(120);
    pdf.text(`Page ${totalPages}`, pageW - margin, pageH - 18, { align: "right" });
    pdf.setTextColor(0);
  };

  header();

  // 1) Customer details table
  const customerRows = [
    ["Customer Name", pdfWrap(safe(doc?.customerName) || "-", 22)],
    ["Company", pdfWrap(safe(doc?.companyName) || "-", 22)],
    ["Email", pdfWrap(safe(doc?.customerEmail) || "-", 22)],
    ["Phone", pdfWrap(safe(doc?.customerPhone) || "-", 22)],
    ["Project", pdfWrap(safe(doc?.projectName) || "-", 22)],
  ];

  autoTable(pdf, {
    startY: 78,
    theme: "grid",
    margin: { left: margin, right: margin, top: 78, bottom: 60 },
    tableWidth: pageW - margin * 2,
    body: customerRows,
    styles: {
      font: "helvetica",
      fontSize: 10,
      cellPadding: 6,
      overflow: "linebreak",
      valign: "top",
      cellWidth: "wrap",
    },
    columnStyles: {
      0: { cellWidth: 120, fontStyle: "bold" },
      1: { cellWidth: pageW - margin * 2 - 120 },
    },
    didDrawPage: () => {
      header();
      footer();
    },
  });

  // 2) Compute totals
  const computedSubtotal = (doc?.items || []).reduce((sum, it) => {
    const q = Math.max(0, Number(it.quantity || 0));
    const r = Math.max(0, Number(it.unitPrice || 0));
    return sum + q * r;
  }, 0);

  const _subtotal = Number(doc?.subtotal ?? computedSubtotal) || 0;
  const _taxPercent = Number(doc?.taxPercent ?? 0) || 0;
  const _taxAmount = Number(doc?.taxAmount ?? (_subtotal * _taxPercent) / 100) || 0;
  const _total = Number(doc?.totalAmount ?? (_subtotal + _taxAmount)) || 0;

  // 3) Item rows (wrap ONLY description)
  const itemRows = (doc?.items || []).map((it, idx) => {
    const qty = Math.max(0, Number(it.quantity || 0));
    const rate = Math.max(0, Number(it.unitPrice || 0));
    const amt = qty * rate;

    return [
      String(idx + 1),
      pdfWrap(safe(it.description) || "-", 14),
      String(qty),
      currency(rate), // ✅ INR instead of ₹
      currency(amt),  // ✅ INR instead of ₹
    ];
  });

  // 4) Items table (no overflow)
  const snW = 28;
  const qtyW = 48;
  const unitW = 110; // little wider for "INR "
  const amtW = 110;  // little wider for "INR "
  const descW = pageW - margin * 2 - (snW + qtyW + unitW + amtW);

  autoTable(pdf, {
    startY: (pdf.lastAutoTable?.finalY || 100) + 14,
    theme: "grid",
    margin: { left: margin, right: margin, top: 78, bottom: 60 },
    tableWidth: pageW - margin * 2,
    head: [["#", "Description", "Qty", "Unit Price", "Amount"]],
    body: itemRows.length ? itemRows : [["-", "No items", "-", "-", "-"]],
    styles: {
      font: "helvetica",
      fontSize: 9,
      cellPadding: 6,
      overflow: "linebreak",
      valign: "top",
      cellWidth: "wrap",
    },
    headStyles: {
      fontStyle: "bold",
      fillColor: [245, 246, 250],
      textColor: 20,
    },
    rowPageBreak: "auto",
    columnStyles: {
      0: { cellWidth: snW, halign: "center" },
      1: { cellWidth: descW, halign: "left" },
      2: { cellWidth: qtyW, halign: "right" },
      3: { cellWidth: unitW, halign: "right" },
      4: { cellWidth: amtW, halign: "right" },
    },
    didDrawPage: () => {
      header();
      footer();
    },
  });

  // 5) Totals table (stays inside page)
  autoTable(pdf, {
    startY: (pdf.lastAutoTable?.finalY || 120) + 12,
    theme: "grid",
    margin: { left: margin, right: margin, bottom: 60 },
    tableWidth: pageW - margin * 2,
    body: [
      ["Subtotal", currency(_subtotal)],
      [`Tax (${_taxPercent}%)`, currency(_taxAmount)],
      ["Total", currency(_total)],
    ],
    styles: {
      font: "helvetica",
      fontSize: 11,
      cellPadding: 6,
      overflow: "linebreak",
      cellWidth: "wrap",
      valign: "middle",
    },
    columnStyles: {
      0: { cellWidth: pageW - margin * 2 - 220, halign: "right", textColor: 60 },
      1: { cellWidth: 220, halign: "right", fontStyle: "bold", textColor: 10 },
    },
    didParseCell: (data) => {
      if (data.row.index === 2) {
        data.cell.styles.fontSize = 14;
        data.cell.styles.fontStyle = "bold";
      }
    },
    didDrawPage: () => {
      header();
      footer();
    },
  });

  // 6) Notes
  const noteText = safe(doc?.notes);
  if (noteText) {
    autoTable(pdf, {
      startY: (pdf.lastAutoTable?.finalY || 140) + 10,
      theme: "grid",
      margin: { left: margin, right: margin, bottom: 60 },
      tableWidth: pageW - margin * 2,
      head: [["Notes / Terms"]],
      body: [[pdfWrap(noteText, 18)]],
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 8,
        overflow: "linebreak",
        valign: "top",
        cellWidth: "wrap",
      },
      headStyles: {
        fontStyle: "bold",
        fillColor: [245, 246, 250],
        textColor: 20,
      },
      didDrawPage: () => {
        header();
        footer();
      },
    });
  }

  footer();
  return pdf;
};


  /* =========================
     ✅ PDF Download
  ========================= */
  const downloadPDF = (doc) => {
    if (!doc) return;
    const title = doc.type === "quotation" ? "QUOTATION" : "INVOICE";
    const pdf = buildPdf(doc);

    const nowDate = doc.createdAt ? new Date(doc.createdAt) : new Date();
    const fileSafeName = (safe(doc.customerName) || "Customer")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .slice(0, 30)
      .replace(/\s+/g, "_");

    pdf.save(`${title}_${fileSafeName}_${nowDate.toISOString().slice(0, 10)}.pdf`);
  };

  /* =========================
     ✅ PDF VIEW (Blob URL)
  ========================= */
  const viewPDF = (doc) => {
    if (!doc) return;

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }

    const pdf = buildPdf(doc);
    const blob = pdf.output("blob");
    const url = URL.createObjectURL(blob);

    setPdfUrl(url);
    setPdfViewOpen(true);
  };

  const closePdfView = () => {
    setPdfViewOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }
  };

  const handlePreview = (doc) => setPreviewDoc(doc);

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
              Create quotation/invoice, track approval, and view/download clean PDFs.
            </p>
          </div>

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

            {/* Mobile cards */}
            <div className="lg:hidden space-y-3">
              {items.map((item, index) => {
                const lineTotal =
                  (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);

                return (
                  <div key={index} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">Item {index + 1}</div>
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
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
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
                          onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
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
                          onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
                          className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 text-right"
                        />
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="text-xs text-slate-600">Line Total</div>
                      <div className="text-base font-bold text-slate-900">₹{money(lineTotal)}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
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
                        (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                      return (
                        <tr key={index} className="border-t border-slate-100">
                          <td className="px-3 py-2.5">
                            <input
                              value={item.description}
                              onChange={(e) => handleItemChange(index, "description", e.target.value)}
                              className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                              placeholder="Product / service"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                              className="w-24 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 text-right"
                            />
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, "unitPrice", e.target.value)}
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
                min={0}
                type="number"
                value={taxPercent}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setTaxPercent(value < 0 ? 0 : value);
                }}
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
              <p className="text-[11px] text-slate-500 mt-1">(Auto calculated from items)</p>
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
            {/* Mobile cards */}
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
                      onClick={() => viewPDF(doc)}
                      className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                    >
                      View PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadPDF(doc)}
                      className="w-full sm:w-auto rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black active:scale-[0.99]"
                    >
                      Download PDF
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(doc)}
                    className="mt-2 w-full rounded-2xl bg-sky-50 border border-sky-200 px-3 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
                  >
                    View Details (HTML)
                  </button>
                </div>
              ))}
            </div>

            {/* Desktop table */}
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
                          <div className="inline-flex gap-3">
                            <button
                              type="button"
                              onClick={() => viewPDF(doc)}
                              className="text-sm font-semibold text-sky-700 hover:underline"
                            >
                              View PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => downloadPDF(doc)}
                              className="text-sm font-semibold text-slate-900 hover:underline"
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="text-sm font-semibold text-emerald-700 hover:underline"
                            >
                              Details
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

      {/* HTML Preview */}
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
                    {previewDoc.items?.map((it, idx) => (
                      <tr key={idx} className="border-t border-slate-100">
                        <td className="px-3 py-2.5 break-words">{it.description}</td>
                        <td className="px-3 py-2.5 text-right">{it.quantity}</td>
                        <td className="px-3 py-2.5 text-right">₹{money(it.unitPrice || 0)}</td>
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

                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => viewPDF(previewDoc)}
                    className="w-full sm:w-auto rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    View PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => downloadPDF(previewDoc)}
                    className="w-full sm:w-auto rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-black active:scale-[0.99]"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ✅ PDF VIEW MODAL */}
      {pdfViewOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closePdfView} />
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">PDF Preview</div>
                <div className="text-xs text-slate-500 truncate">Generated with jsPDF + autoTable</div>
              </div>
              <div className="flex items-center gap-2">
                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Open in new tab
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={closePdfView}
                  className="rounded-2xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-black"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="h-[75vh] bg-slate-50">
              {pdfUrl ? (
                <iframe title="PDF Preview" src={pdfUrl} className="w-full h-full" />
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-600">
                  Preparing PDF...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationInvoice;
