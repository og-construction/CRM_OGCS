// src/components/sales/QuotationSystem.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import Card from "./Card";

/* ✅ PDF (client-side) */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/* ================= helpers ================= */
const emptyItem = { description: "", quantity: 1, unitPrice: 0 };
const safe = (v) => String(v ?? "").trim();

const money = (n) => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  } catch {
    return v.toFixed(2);
  }
};

// ✅ Avoid ₹ with default jsPDF fonts
const currency = (n) => `INR ${money(n)}`;

const pdfWrap = (value, chunk = 18) => {
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

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("en-IN");
};

/* ✅ Professional Terms Templates (Quotation only) */
const TERMS_LIBRARY = [
  { id: "valid_7", text: "Quotation validity: 7 days from the date of issue." },
  { id: "valid_15", text: "Quotation validity: 15 days from the date of issue." },
  { id: "gst_extra", text: "GST will be charged as applicable." },
  { id: "freight_extra", text: "Freight/transportation charges are extra unless specified." },
  { id: "delivery_7", text: "Delivery: within 7 days from confirmed order & advance payment." },
  { id: "delivery_subject", text: "Delivery schedule subject to site readiness and availability." },
  { id: "advance_50", text: "Payment: 50% advance, balance before dispatch." },
  { id: "advance_100", text: "Payment: 100% advance before dispatch." },
  { id: "replacement", text: "Replacement subject to manufacturer policy and inspection." },
];

/* ✅ OGCS Company Header (PDF + UI) */
const OGCS = {
  name: "OGCS Private Limited",
  addressLines: [
    "No 03, C-6, 14, Rd Number 2",
    "Sector 18, New Panvel, Dist: Raigad",
    "Pin Code: 410206",
  ],
  mobile: "+91 9967610135",
  email: "support@ogcs.co.in",
};

/* ================= tiny ui atoms ================= */
const StatusBadge = ({ status }) => {
  const st = String(status || "pending");
  const cls =
    st === "approved"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : st === "rejected"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-amber-50 text-amber-700 border-amber-200";
  const label =
    st === "approved" ? "Approved" : st === "rejected" ? "Rejected" : "Pending";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${cls}`}
    >
      {label}
    </span>
  );
};

export default function QuotationSystem() {
  /* ================= state ================= */
  const [customer, setCustomer] = useState({
    customerName: "",
    companyName: "",
    customerEmail: "",
    customerPhone: "",
    projectName: "",
  });

  const [items, setItems] = useState([{ ...emptyItem }]);
  const [taxPercent, setTaxPercent] = useState(18);

  // Notes / Terms
  const [selectedTermIds, setSelectedTermIds] = useState([]);
  const [customTerms, setCustomTerms] = useState([]);
  const [customTermInput, setCustomTermInput] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  // API list
  const [myQuotes, setMyQuotes] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // submit & alerts
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // PDF viewer modal
  const [pdfViewOpen, setPdfViewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  /* ================= calculations ================= */
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, it) =>
        sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );
  }, [items]);

  const taxAmount = useMemo(
    () => (subtotal * (Number(taxPercent) || 0)) / 100,
    [subtotal, taxPercent]
  );
  const totalAmount = subtotal + taxAmount;

  const selectedTermsText = useMemo(() => {
    const fromLibrary = TERMS_LIBRARY.filter((t) =>
      selectedTermIds.includes(t.id)
    ).map((t) => t.text);
    const custom = customTerms.map((t) => safe(t)).filter(Boolean);
    return [...fromLibrary, ...custom]
      .map((t) => t.replace(/\s+/g, " ").trim())
      .filter(Boolean);
  }, [selectedTermIds, customTerms]);

  const finalNotesText = useMemo(() => {
    const lines = [];
    if (selectedTermsText.length) {
      lines.push("NOTES / TERMS:");
      selectedTermsText.forEach((t, i) => lines.push(`${i + 1}. ${t}`));
    }
    const extra = safe(extraNotes);
    if (extra) {
      if (lines.length) lines.push("");
      lines.push(extra);
    }
    return lines.join("\n");
  }, [selectedTermsText, extraNotes]);

  /* ================= api ================= */
  const fetchMyQuotesRaw = async () => {
    const res = await axiosClient.get("/quotes/my", {
      params: { type: "quotation", t: Date.now() },
      headers: { "Cache-Control": "no-cache" },
    });
    return res.data?.data || [];
  };

  const fetchMyQuotes = async () => {
    try {
      setLoadingList(true);
      const list = await fetchMyQuotesRaw();
      setMyQuotes(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchMyQuotes();

    const t = setInterval(() => fetchMyQuotes(), 10000);
    const onFocus = () => fetchMyQuotes();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= handlers ================= */
  const handleCustomerChange = (e) =>
    setCustomer((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it))
    );
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) =>
    setItems((prev) => prev.filter((_, i) => i !== index));

  const toggleTerm = (id) =>
    setSelectedTermIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const addCustomTerm = () => {
    const v = safe(customTermInput);
    if (!v) return;

    setCustomTerms((prev) => {
      const normalized = v.replace(/\s+/g, " ").trim();
      if (prev.some((x) => safe(x).toLowerCase() === normalized.toLowerCase()))
        return prev;
      return [...prev, normalized];
    });

    setCustomTermInput("");
  };

  const removeCustomTerm = (idx) =>
    setCustomTerms((prev) => prev.filter((_, i) => i !== idx));

  const clearTerms = () => {
    setSelectedTermIds([]);
    setCustomTerms([]);
    setCustomTermInput("");
    setExtraNotes("");
  };

  /* ================= ✅ CREATE QUOTATION ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!safe(customer.customerName)) {
      setError("Customer name is required.");
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

      const payloadItems = items
        .filter((it) => safe(it.description))
        .map((it) => {
          const qty = Math.max(1, Number(it.quantity) || 1);
          const rate = Math.max(0, Number(it.unitPrice) || 0);
          return {
            description: safe(it.description),
            quantity: qty,
            unitPrice: rate,
            lineTotal: qty * rate,
          };
        });

      const sub = payloadItems.reduce(
        (s, it) => s + (Number(it.lineTotal) || 0),
        0
      );
      const taxP = Math.max(0, Number(taxPercent) || 0);
      const taxA = (sub * taxP) / 100;
      const tot = sub + taxA;

      const payload = {
        type: "quotation",
        customerName: safe(customer.customerName),
        companyName: safe(customer.companyName),
        customerEmail: safe(customer.customerEmail),
        customerPhone: safe(customer.customerPhone),
        projectName: safe(customer.projectName),
        items: payloadItems,
        taxPercent: taxP,
        notes: safe(finalNotesText),
        subtotal: sub,
        totalAmount: tot,
      };

      const res = await axiosClient.post("/quotes", payload);
      const created = res.data?.data;

      setMessage(
        `Quotation created successfully (status: ${created?.status || "pending"}).`
      );

      // reset
      setCustomer({
        customerName: "",
        companyName: "",
        customerEmail: "",
        customerPhone: "",
        projectName: "",
      });
      setItems([{ ...emptyItem }]);
      setTaxPercent(18);
      setSelectedTermIds([]);
      setCustomTerms([]);
      setCustomTermInput("");
      setExtraNotes("");

      fetchMyQuotes();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Failed to create quotation. Please try again.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= PDF builder (COLORFUL + OGCS HEADER) ================= */
  const buildQuotationPdf = (doc) => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setLineHeightFactor(1.18);

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const margin = 40;

    const created = doc?.createdAt ? new Date(doc.createdAt) : new Date();
    const status = safe(doc?.status) || "pending";

    const C = {
      navy: [2, 32, 78],
      red: [139, 0, 0],
      gold: [244, 208, 63],
      slate: [71, 85, 105],
      light: [241, 246, 255],
      border: [226, 232, 240],
    };

    const drawHeader = () => {
      pdf.setFillColor(...C.navy);
      pdf.rect(0, 0, pageW, 92, "F");

      pdf.setFillColor(...C.gold);
      pdf.rect(0, 92, pageW, 4, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(18);
      pdf.text(OGCS.name, margin, 36);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);
      const addr = [
        ...OGCS.addressLines,
        `Mobile: ${OGCS.mobile}  |  Email: ${OGCS.email}`,
      ];
      pdf.text(addr, margin, 54, { maxWidth: pageW - margin * 2 });

      const badgeW = 150;
      const badgeH = 36;
      const badgeX = pageW - margin - badgeW;
      const badgeY = 26;

      pdf.setFillColor(...C.red);
      pdf.roundedRect(badgeX, badgeY, badgeW, badgeH, 10, 10, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(14);
      pdf.text("QUOTATION", badgeX + badgeW / 2, badgeY + 24, {
        align: "center",
      });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Date: ${created.toLocaleDateString("en-IN")}`, pageW - margin, 74, {
        align: "right",
      });
      pdf.text(`Status: ${status}`, pageW - margin, 86, { align: "right" });
    };

    const drawFooter = () => {
      const totalPages = pdf.internal.getNumberOfPages();
      pdf.setDrawColor(...C.border);
      pdf.setLineWidth(1);
      pdf.line(margin, pageH - 44, pageW - margin, pageH - 44);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(...C.slate);
      pdf.text(`Generated by ${OGCS.name}`, margin, pageH - 26);
      pdf.text(`Page ${totalPages}`, pageW - margin, pageH - 26, {
        align: "right",
      });

      pdf.setTextColor(0, 0, 0);
    };

    drawHeader();

    const customerRows = [
      ["Customer Name", pdfWrap(safe(doc?.customerName) || "-", 22)],
      ["Company", pdfWrap(safe(doc?.companyName) || "-", 22)],
      ["Email", pdfWrap(safe(doc?.customerEmail) || "-", 22)],
      ["Phone", pdfWrap(safe(doc?.customerPhone) || "-", 22)],
      [
        "Delivery Location / Address",
        pdfWrap(safe(doc?.projectName) || "-", 22),
      ],
    ];

    autoTable(pdf, {
      startY: 112,
      theme: "grid",
      margin: { left: margin, right: margin, top: 112, bottom: 64 },
      tableWidth: pageW - margin * 2,
      head: [["Customer Details", ""]],
      body: customerRows,
      styles: {
        font: "helvetica",
        fontSize: 10,
        cellPadding: 7,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: { fillColor: C.light, textColor: C.navy, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 170, fontStyle: "bold", textColor: C.slate },
        1: {
          cellWidth: pageW - margin * 2 - 170,
          textColor: [15, 23, 42],
        },
      },
      didDrawPage: () => {
        drawHeader();
        drawFooter();
      },
    });

    const snW = 28;
    const qtyW = 52;
    const unitW = 110;
    const amtW = 120;
    const descW = pageW - margin * 2 - (snW + qtyW + unitW + amtW);

    const itemRows = (doc?.items || []).map((it, idx) => {
      const qty = Math.max(0, Number(it.quantity || 0));
      const rate = Math.max(0, Number(it.unitPrice || 0));
      const amt = Number(it.lineTotal ?? qty * rate) || 0;
      return [
        String(idx + 1),
        pdfWrap(safe(it.description) || "-", 14),
        String(qty),
        currency(rate),
        currency(amt),
      ];
    });

    autoTable(pdf, {
      startY: (pdf.lastAutoTable?.finalY || 140) + 14,
      theme: "grid",
      margin: { left: margin, right: margin, bottom: 64 },
      tableWidth: pageW - margin * 2,
      head: [["#", "Description", "Qty", "Unit Price", "Amount"]],
      body: itemRows.length ? itemRows : [["-", "No items", "-", "-", "-"]],
      styles: {
        font: "helvetica",
        fontSize: 9.5,
        cellPadding: 7,
        overflow: "linebreak",
        valign: "top",
      },
      headStyles: {
        fillColor: C.navy,
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [250, 251, 255] },
      columnStyles: {
        0: { cellWidth: snW, halign: "center" },
        1: { cellWidth: descW, halign: "left" },
        2: { cellWidth: qtyW, halign: "right" },
        3: { cellWidth: unitW, halign: "right" },
        4: { cellWidth: amtW, halign: "right" },
      },
      didDrawPage: () => {
        drawHeader();
        drawFooter();
      },
    });

    const computedSubtotal = (doc?.items || []).reduce(
      (sum, it) => sum + (Number(it.lineTotal) || 0),
      0
    );
    const _subtotal = Number(doc?.subtotal ?? computedSubtotal) || 0;
    const _taxPercent = Number(doc?.taxPercent ?? 0) || 0;
    const _taxAmount = (_subtotal * _taxPercent) / 100;
    const _total = Number(doc?.totalAmount ?? (_subtotal + _taxAmount)) || 0;

    autoTable(pdf, {
      startY: (pdf.lastAutoTable?.finalY || 200) + 10,
      theme: "grid",
      margin: { left: margin, right: margin, bottom: 64 },
      tableWidth: pageW - margin * 2,
      body: [
        ["Subtotal", currency(_subtotal)],
        [`Tax (${_taxPercent}%)`, currency(_taxAmount)],
        ["Total", currency(_total)],
      ],
      styles: { font: "helvetica", fontSize: 11, cellPadding: 7, valign: "middle" },
      columnStyles: {
        0: {
          cellWidth: pageW - margin * 2 - 240,
          halign: "right",
          textColor: C.slate,
        },
        1: {
          cellWidth: 240,
          halign: "right",
          fontStyle: "bold",
          textColor: [15, 23, 42],
        },
      },
      didParseCell: (data) => {
        if (data.row.index === 2) {
          data.cell.styles.fillColor = C.red;
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fontSize = 14;
        }
      },
      didDrawPage: () => {
        drawHeader();
        drawFooter();
      },
    });

    const noteText = safe(doc?.notes);
    if (noteText) {
      autoTable(pdf, {
        startY: (pdf.lastAutoTable?.finalY || 240) + 10,
        theme: "grid",
        margin: { left: margin, right: margin, bottom: 64 },
        tableWidth: pageW - margin * 2,
        head: [["Notes / Terms"]],
        body: [[pdfWrap(noteText, 18)]],
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: 9,
          overflow: "linebreak",
          valign: "top",
        },
        headStyles: { fillColor: C.light, textColor: C.navy, fontStyle: "bold" },
        didDrawPage: () => {
          drawHeader();
          drawFooter();
        },
      });
    }

    drawFooter();
    return pdf;
  };

  /* ✅ IMPORTANT FIX:
     refresh /quotes/my and pick latest quote by _id.
  */
  const getLatestQuoteFromMyList = async (id) => {
    const list = await fetchMyQuotesRaw();
    setMyQuotes(list);
    return list.find((q) => String(q._id) === String(id)) || null;
  };

  const downloadPDF = async (doc) => {
    if (!doc?._id) return;
    setError("");

    try {
      const latest = await getLatestQuoteFromMyList(doc._id);
      if (!latest) {
        setError("Quotation not found. Please refresh list.");
        return;
      }

      const pdf = buildQuotationPdf(latest);
      const nowDate = latest?.createdAt ? new Date(latest.createdAt) : new Date();

      const fileSafeName = (safe(latest.customerName) || "Customer")
        .replace(/[^\w\s-]/g, "")
        .trim()
        .slice(0, 30)
        .replace(/\s+/g, "_");

      pdf.save(`Quotation_${fileSafeName}_${nowDate.toISOString().slice(0, 10)}.pdf`);
    } catch (e) {
      console.error(e);
      setError("Unable to download quotation PDF. Please try again.");
    }
  };

  const viewPDF = async (doc) => {
    if (!doc?._id) return;
    setError("");

    try {
      const latest = await getLatestQuoteFromMyList(doc._id);
      if (!latest) {
        setError("Quotation not found. Please refresh list.");
        return;
      }

      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
        setPdfUrl("");
      }

      const pdf = buildQuotationPdf(latest);
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);

      setPdfUrl(url);
      setPdfViewOpen(true);
    } catch (e) {
      console.error(e);
      setError("Unable to open quotation PDF. Please try again.");
    }
  };

  const closePdfView = () => {
    setPdfViewOpen(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl("");
    }
  };

  /* ================= UI ================= */
  return (
    <div
      className="space-y-4"
      style={{ background: "#EFF6FF", padding: 12, borderRadius: 16 }}
    >
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm overflow-hidden">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#8B0000] via-[#F4D03F] to-[#00204E] -mt-5 mb-4" />

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Quotation Module
            </div>

            <h1 className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900 whitespace-normal break-words">
              Quotation System
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 whitespace-normal break-words">
              Create quotation, track admin approval, and view/download colorful OGCS PDF.
            </p>

            <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/40 px-3 py-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900">{OGCS.name}</div>
              <div className="text-slate-700">
                {OGCS.addressLines.join(", ")}
              </div>
              <div className="mt-1 text-slate-700">
                Mobile: <b>{OGCS.mobile}</b> • Email: <b>{OGCS.email}</b>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchMyQuotes}
            className="shrink-0 px-4 py-2 text-sm font-semibold rounded-2xl border transition active:scale-[0.99] bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
          >
            Refresh List
          </button>
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

      {/* ✅ CREATE QUOTATION FORM */}
      <Card title="New Quotation Details">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer */}
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Name <span className="text-red-600">*</span>
              </label>
              <input
                name="customerName"
                value={customer.customerName}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                placeholder="Enter customer name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company Name
              </label>
              <input
                name="companyName"
                value={customer.companyName}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                placeholder="Enter company name"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Email
              </label>
              <input
                name="customerEmail"
                value={customer.customerEmail}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                placeholder="Enter email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Customer Phone
              </label>
              <input
                name="customerPhone"
                value={customer.customerPhone}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                placeholder="Enter phone number"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Delivery Location / Address
              </label>
              <input
                name="projectName"
                value={customer.projectName}
                onChange={handleCustomerChange}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                placeholder="Enter delivery location/address"
              />
            </div>
          </div>

          {/* Items */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-bold text-slate-900">Items</div>
              <button
                type="button"
                onClick={addItem}
                className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-100"
              >
                + Add Item
              </button>
            </div>

            <div className="mt-3 space-y-3">
              {items.map((it, idx) => (
                <div
                  key={idx}
                  className="rounded-3xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="grid gap-2 md:grid-cols-12">
                    <div className="md:col-span-6">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Description <span className="text-red-600">*</span>
                      </label>
                      <input
                        value={it.description}
                        onChange={(e) =>
                          handleItemChange(idx, "description", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                        placeholder="Material / service description"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Qty
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={it.quantity}
                        onChange={(e) =>
                          handleItemChange(idx, "quantity", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none text-right focus:border-red-300 focus:ring-4 focus:ring-red-50"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={it.unitPrice}
                        onChange={(e) =>
                          handleItemChange(idx, "unitPrice", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none text-right focus:border-red-300 focus:ring-4 focus:ring-red-50"
                      />
                    </div>

                    <div className="md:col-span-2 flex items-end justify-between gap-2">
                      <div className="w-full">
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Line Total
                        </label>
                        <div className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 text-right">
                          ₹{money((Number(it.quantity) || 0) * (Number(it.unitPrice) || 0))}
                        </div>
                      </div>

                      {items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeItem(idx)}
                          className="shrink-0 rounded-2xl bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tax + Totals */}
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tax Percent (GST)
              </label>
              <input
                type="number"
                min="0"
                value={taxPercent}
                onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                className="w-40 rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
              />
              <div className="mt-3 text-xs text-slate-600">
                Subtotal: <b className="text-slate-900">₹{money(subtotal)}</b>{" "}
                • Tax: <b className="text-slate-900">₹{money(taxAmount)}</b>
              </div>
            </div>

            <div className="rounded-3xl border border-red-100 bg-gradient-to-b from-white to-red-50 p-4 text-right">
              <div className="text-xs text-slate-500">Total Amount</div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                ₹{money(totalAmount)}
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-slate-900">Notes / Terms</div>
                <div className="text-xs text-slate-600">
                  Select from library or add custom terms (saved to PDF).
                </div>
              </div>
              <button
                type="button"
                onClick={clearTerms}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Clear
              </button>
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3 max-h-[260px] overflow-auto">
                <div className="text-xs font-bold text-slate-900 mb-2">Terms Library</div>
                <div className="space-y-2">
                  {TERMS_LIBRARY.map((t) => {
                    const checked = selectedTermIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className={`flex items-start gap-3 rounded-2xl border px-3 py-2 cursor-pointer ${
                          checked ? "border-red-200 bg-red-50" : "border-slate-200 bg-white"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleTerm(t.id)}
                          className="mt-0.5 h-4 w-4 accent-red-600"
                        />
                        <span className="text-sm text-slate-800 leading-snug">{t.text}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-xs font-bold text-slate-900 mb-2">Custom Term</div>
                <div className="flex gap-2">
                  <input
                    value={customTermInput}
                    onChange={(e) => setCustomTermInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomTerm();
                      }
                    }}
                    className="flex-1 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    placeholder="Type custom term..."
                  />
                  <button
                    type="button"
                    onClick={addCustomTerm}
                    className="rounded-2xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
                  >
                    Add
                  </button>
                </div>

                {customTerms.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {customTerms.map((ct, idx) => (
                      <div
                        key={`${ct}-${idx}`}
                        className="flex items-start justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"
                      >
                        <div className="text-sm text-slate-800">{ct}</div>
                        <button
                          type="button"
                          onClick={() => removeCustomTerm(idx)}
                          className="text-xs font-semibold text-red-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    Extra Notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={extraNotes}
                    onChange={(e) => setExtraNotes(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-red-300 focus:ring-4 focus:ring-red-50"
                    placeholder="Any extra note to print in PDF..."
                  />
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-2">
                  <div className="text-[11px] font-semibold text-slate-600 mb-1">
                    Final Notes Text (Saved)
                  </div>
                  <pre className="whitespace-pre-wrap break-words text-xs text-slate-800">
                    {finalNotesText || "-"}
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto rounded-2xl bg-red-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60"
          >
            {submitting ? "Creating..." : "Create Quotation"}
          </button>
        </form>
      </Card>

      {/* List */}
      <Card title="Your Quotations">
        {loadingList ? (
          <p className="text-sm text-slate-600">Loading...</p>
        ) : myQuotes.length === 0 ? (
          <p className="text-sm text-slate-600">No quotations created yet.</p>
        ) : (
          <div className="grid gap-3">
            {myQuotes.map((doc) => (
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
                      Delivery: {safe(doc.projectName) || "-"}
                    </div>
                    <div className="mt-1 text-[11px] font-semibold text-slate-700">
                      QUOTATION • {fmtDate(doc.createdAt)}
                    </div>
                  </div>
                  <StatusBadge status={doc.status} />
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
                    className="w-full sm:w-auto rounded-2xl bg-red-700 px-3 py-2 text-sm font-semibold text-white hover:bg-red-800 active:scale-[0.99]"
                  >
                    Download PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* PDF VIEW MODAL */}
      {pdfViewOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 sm:p-6">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={closePdfView}
          />
          <div className="relative w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-slate-100">
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 truncate">
                  Quotation PDF Preview
                </div>
                <div className="text-xs text-slate-500 truncate">
                  OGCS header + colorful layout
                </div>
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
                  className="rounded-2xl bg-red-700 px-3 py-2 text-xs font-semibold text-white hover:bg-red-800"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="h-[75vh] bg-slate-50">
              {pdfUrl ? (
                <iframe
                  title="Quotation PDF Preview"
                  src={pdfUrl}
                  className="w-full h-full"
                />
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
}
