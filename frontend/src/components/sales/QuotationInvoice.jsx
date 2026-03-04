// ✅ src/components/sales/QuotationSystem.jsx
// UI polish + fully responsive (mobile/tablet/desktop) — ✅ NO logic changes

import React, { useEffect, useMemo, useState, useCallback } from "react";
import axiosClient from "../../api/axiosClient";
import Card from "./Card";

/* ✅ PDF (client-side) */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * ✅ UI palette (KEEP like your project):
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 */

const cn = (...a) => a.filter(Boolean).join(" ");

/* ================= helpers ================= */
const emptyItem = { description: "", quantity: 1, unitPrice: 0 };
const safe = (v) => String(v ?? "").trim();

const money = (n) => {
  const v = Number(n || 0);
  try {
    return v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm " +
  "text-slate-900 placeholder:text-slate-400 outline-none " +
  "focus:ring-4 focus:ring-slate-100 transition";

const btnBase =
  "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-semibold " +
  "transition active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed";

const StatusBadge = ({ status }) => {
  const st = String(status || "pending");
  const cls =
    st === "approved"
      ? "bg-green-600 text-white"
      : st === "rejected"
      ? "bg-red-500 text-white"
      : "bg-orange-500 text-white";
  const label = st === "approved" ? "Approved" : st === "rejected" ? "Rejected" : "Pending";

  return <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold", cls)}>{label}</span>;
};

function Field({ label, required, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <label className="text-xs font-semibold text-slate-600">
          {label} {required ? <span className="text-red-500">*</span> : null}
        </label>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      {children}
    </div>
  );
}

function StatPill({ label, value, tone = "slate" }) {
  const cls =
    tone === "blue"
      ? "bg-blue-600 text-white"
      : tone === "green"
      ? "bg-green-600 text-white"
      : tone === "orange"
      ? "bg-orange-500 text-white"
      : tone === "red"
      ? "bg-red-500 text-white"
      : "bg-slate-100 text-slate-900 border border-slate-200";

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold", cls)}>
      <span className="opacity-90">{label}</span>
      <span className="bg-white/20 px-2 py-0.5 rounded-full">{value}</span>
    </div>
  );
}

function Toast({ show, type, msg, onClose }) {
  if (!show) return null;
  const tone =
    type === "success" ? "text-green-600" : type === "error" ? "text-red-500" : "text-slate-600";

  return (
    <div className="fixed bottom-4 sm:bottom-5 right-3 sm:right-5 z-[1000] max-w-[calc(100vw-24px)] sm:max-w-sm">
      <div className={cn("px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold bg-white shadow-sm", tone)}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 break-words">{msg}</div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 shrink-0">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

/* ✅ Modal improved: mobile bottom-sheet feel + lock scroll */
function Modal({ open, title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999]">
      <button type="button" className="absolute inset-0 bg-black/50" onClick={onClose} aria-label="Close modal" />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-2 sm:p-4">
        <div
          className={cn(
            "w-full max-w-5xl bg-white rounded-2xl border border-slate-200 overflow-hidden",
            "flex flex-col h-[92dvh] sm:h-auto sm:max-h-[92dvh]"
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="h-1 bg-red-500" />
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200 bg-white flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-extrabold text-slate-900 truncate">{title}</div>
              {subtitle ? <div className="text-xs text-slate-600 mt-0.5 truncate">{subtitle}</div> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(btnBase, "px-3 py-2 border border-slate-200 bg-white text-slate-600 hover:bg-slate-50")}
            >
              Close
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 sm:p-5 bg-slate-50">{children}</div>

          {footer ? (
            <div className="border-t border-slate-200 bg-white px-4 sm:px-5 py-3 sm:py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

/* ✅ Small responsive “mini card” */
function MiniCard({ label, value, tone = "slate" }) {
  const bar =
    tone === "red"
      ? "bg-red-500"
      : tone === "blue"
      ? "bg-blue-600"
      : tone === "green"
      ? "bg-green-600"
      : tone === "orange"
      ? "bg-orange-500"
      : "bg-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className={cn("h-1", bar)} />
      <div className="p-3">
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="mt-1 text-sm font-extrabold text-slate-900 break-words">{value}</div>
      </div>
    </div>
  );
}

/* ================= Component ================= */
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

  // toast
  const [toast, setToast] = useState({ show: false, type: "info", msg: "" });

  // PDF viewer modal
  const [pdfViewOpen, setPdfViewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  const showToast = useCallback((type, msg) => {
    setToast({ show: true, type, msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, type: "info", msg: "" }), 2200);
  }, []);

  /* ================= calculations ================= */
  const subtotal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  }, [items]);

  const taxAmount = useMemo(() => (subtotal * (Number(taxPercent) || 0)) / 100, [subtotal, taxPercent]);
  const totalAmount = subtotal + taxAmount;

  const selectedTermsText = useMemo(() => {
    const fromLibrary = TERMS_LIBRARY.filter((t) => selectedTermIds.includes(t.id)).map((t) => t.text);
    const custom = customTerms.map((t) => safe(t)).filter(Boolean);
    return [...fromLibrary, ...custom].map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
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

  const fetchMyQuotes = useCallback(async () => {
    try {
      setLoadingList(true);
      const list = await fetchMyQuotesRaw();
      setMyQuotes(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchMyQuotes();

    const t = setInterval(() => fetchMyQuotes(), 10000);
    const onFocus = () => fetchMyQuotes();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchMyQuotes]);

  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ================= handlers ================= */
  const handleCustomerChange = (e) => setCustomer((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleItemChange = (index, field, value) => {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)));
  };

  const addItem = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  const toggleTerm = (id) =>
    setSelectedTermIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const addCustomTerm = () => {
    const v = safe(customTermInput);
    if (!v) return;

    setCustomTerms((prev) => {
      const normalized = v.replace(/\s+/g, " ").trim();
      if (prev.some((x) => safe(x).toLowerCase() === normalized.toLowerCase())) return prev;
      return [...prev, normalized];
    });

    setCustomTermInput("");
  };

  const removeCustomTerm = (idx) => setCustomTerms((prev) => prev.filter((_, i) => i !== idx));

  const clearTerms = () => {
    setSelectedTermIds([]);
    setCustomTerms([]);
    setCustomTermInput("");
    setExtraNotes("");
  };

  const resetFormAll = () => {
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
  };

  /* ================= ✅ CREATE QUOTATION ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!safe(customer.customerName)) {
      setError("Customer name is required.");
      showToast("error", "Customer name is required");
      return;
    }

    const hasValidItem = items.some((it) => safe(it.description) && Number(it.quantity) > 0);
    if (!hasValidItem) {
      setError("Please add at least one valid item (description + qty).");
      showToast("error", "Add at least one valid item");
      return;
    }

    try {
      setSubmitting(true);

      const payloadItems = items
        .filter((it) => safe(it.description))
        .map((it) => {
          const qty = Math.max(1, Number(it.quantity) || 1);
          const rate = Math.max(0, Number(it.unitPrice) || 0);
          return { description: safe(it.description), quantity: qty, unitPrice: rate, lineTotal: qty * rate };
        });

      const sub = payloadItems.reduce((s, it) => s + (Number(it.lineTotal) || 0), 0);
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

      setMessage(`Quotation created successfully (status: ${created?.status || "pending"}).`);
      showToast("success", "Quotation created");
      resetFormAll();
      fetchMyQuotes();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to create quotation. Please try again.";
      setError(msg);
      showToast("error", msg);
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
      const addr = [...OGCS.addressLines, `Mobile: ${OGCS.mobile}  |  Email: ${OGCS.email}`];
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
      pdf.text("QUOTATION", badgeX + badgeW / 2, badgeY + 24, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`Date: ${created.toLocaleDateString("en-IN")}`, pageW - margin, 74, { align: "right" });
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
      pdf.text(`Page ${totalPages}`, pageW - margin, pageH - 26, { align: "right" });

      pdf.setTextColor(0, 0, 0);
    };

    drawHeader();

    const customerRows = [
      ["Customer Name", pdfWrap(safe(doc?.customerName) || "-", 22)],
      ["Company", pdfWrap(safe(doc?.companyName) || "-", 22)],
      ["Email", pdfWrap(safe(doc?.customerEmail) || "-", 22)],
      ["Phone", pdfWrap(safe(doc?.customerPhone) || "-", 22)],
      ["Delivery Location / Address", pdfWrap(safe(doc?.projectName) || "-", 22)],
    ];

    autoTable(pdf, {
      startY: 112,
      theme: "grid",
      margin: { left: margin, right: margin, top: 112, bottom: 64 },
      tableWidth: pageW - margin * 2,
      head: [["Customer Details", ""]],
      body: customerRows,
      styles: { font: "helvetica", fontSize: 10, cellPadding: 7, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: C.light, textColor: C.navy, fontStyle: "bold" },
      columnStyles: {
        0: { cellWidth: 170, fontStyle: "bold", textColor: C.slate },
        1: { cellWidth: pageW - margin * 2 - 170, textColor: [15, 23, 42] },
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
      return [String(idx + 1), pdfWrap(safe(it.description) || "-", 14), String(qty), currency(rate), currency(amt)];
    });

    autoTable(pdf, {
      startY: (pdf.lastAutoTable?.finalY || 140) + 14,
      theme: "grid",
      margin: { left: margin, right: margin, bottom: 64 },
      tableWidth: pageW - margin * 2,
      head: [["#", "Description", "Qty", "Unit Price", "Amount"]],
      body: itemRows.length ? itemRows : [["-", "No items", "-", "-", "-"]],
      styles: { font: "helvetica", fontSize: 9.5, cellPadding: 7, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: C.navy, textColor: [255, 255, 255], fontStyle: "bold" },
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

    const computedSubtotal = (doc?.items || []).reduce((sum, it) => sum + (Number(it.lineTotal) || 0), 0);
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
        0: { cellWidth: pageW - margin * 2 - 240, halign: "right", textColor: C.slate },
        1: { cellWidth: 240, halign: "right", fontStyle: "bold", textColor: [15, 23, 42] },
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
        styles: { font: "helvetica", fontSize: 10, cellPadding: 9, overflow: "linebreak", valign: "top" },
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
        showToast("error", "Quotation not found");
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
      showToast("success", "PDF downloaded");
    } catch (e) {
      console.error(e);
      setError("Unable to download quotation PDF. Please try again.");
      showToast("error", "PDF download failed");
    }
  };

  const viewPDF = async (doc) => {
    if (!doc?._id) return;
    setError("");

    try {
      const latest = await getLatestQuoteFromMyList(doc._id);
      if (!latest) {
        setError("Quotation not found. Please refresh list.");
        showToast("error", "Quotation not found");
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
      showToast("error", "Unable to open PDF");
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
    <div className="bg-slate-50 min-h-[100dvh]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 md:py-6 space-y-5">
        {/* Header (more CRM feel) */}
        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-sm">
          <div className="h-1 bg-red-500" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Sales • Quotation
                </div>

                <h1 className="mt-2 text-lg sm:text-xl font-extrabold text-slate-900">Quotation System</h1>
                <p className="mt-1 text-sm text-slate-600">
                  Create quotations, track status, and view/download OGCS PDF.
                </p>

                {/* OGCS info: grid on desktop, stacked on mobile */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <MiniCard label="Company" value={OGCS.name} tone="red" />
                  <MiniCard label="Address" value={OGCS.addressLines.join(", ")} tone="slate" />
                  <MiniCard label="Mobile" value={OGCS.mobile} tone="blue" />
                  <MiniCard label="Email" value={OGCS.email} tone="green" />
                </div>

                {(error || message) ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                    {error ? (
                      <span className="text-red-500 font-semibold">Error: </span>
                    ) : (
                      <span className="text-green-600 font-semibold">Success: </span>
                    )}
                    <span className="text-slate-900 break-words">{error || message}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full xl:w-auto">
                <button
                  type="button"
                  onClick={fetchMyQuotes}
                  className={cn(
                    btnBase,
                    "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto"
                  )}
                >
                  Refresh List
                </button>

                <button
                  type="button"
                  onClick={resetFormAll}
                  className={cn(btnBase, "bg-slate-900 text-white w-full sm:w-auto")}
                >
                  Reset Form
                </button>
              </div>
            </div>

            {/* Quick totals (UI only) */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <MiniCard label="Subtotal" value={`₹${money(subtotal)}`} tone="slate" />
              <MiniCard label={`GST (${Number(taxPercent) || 0}%)`} value={`₹${money(taxAmount)}`} tone="orange" />
              <MiniCard label="Grand Total" value={`₹${money(totalAmount)}`} tone="red" />
            </div>
          </div>
        </div>

        {/* Content grid: form + list */}
        <div className="grid xl:grid-cols-12 gap-5">
          {/* Create Quotation (sticky on desktop) */}
          <div className="xl:col-span-7 space-y-5">
            <div className="xl:sticky xl:top-4">
              <Card title="New Quotation Details">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Customer */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <div className="text-sm font-extrabold text-slate-900 mb-3">Customer</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Field label="Customer Name" required hint="required">
                        <input
                          name="customerName"
                          value={customer.customerName}
                          onChange={handleCustomerChange}
                          className={inputClass}
                          placeholder="Enter customer name"
                        />
                      </Field>

                      <Field label="Company Name" hint="optional">
                        <input
                          name="companyName"
                          value={customer.companyName}
                          onChange={handleCustomerChange}
                          className={inputClass}
                          placeholder="Enter company name"
                        />
                      </Field>

                      <Field label="Customer Email" hint="optional">
                        <input
                          name="customerEmail"
                          value={customer.customerEmail}
                          onChange={handleCustomerChange}
                          className={inputClass}
                          placeholder="Enter email"
                        />
                      </Field>

                      <Field label="Customer Phone" hint="optional">
                        <input
                          name="customerPhone"
                          value={customer.customerPhone}
                          onChange={handleCustomerChange}
                          className={inputClass}
                          placeholder="Enter phone number"
                          inputMode="numeric"
                        />
                      </Field>

                      <div className="md:col-span-2">
                        <Field label="Delivery Location / Address" hint="optional">
                          <input
                            name="projectName"
                            value={customer.projectName}
                            onChange={handleCustomerChange}
                            className={inputClass}
                            placeholder="Enter delivery location/address"
                          />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="text-sm font-extrabold text-slate-900">Items</div>
                      <button type="button" onClick={addItem} className={cn(btnBase, "px-3 py-2 bg-blue-600 text-white w-full sm:w-auto")}>
                        + Add Item
                      </button>
                    </div>

                    <div className="p-4 space-y-3">
                      {items.map((it, idx) => {
                        const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);

                        return (
                          <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                            {/* Mobile first layout */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                              <div className="lg:col-span-6">
                                <Field label="Description" required hint="material/service">
                                  <input
                                    value={it.description}
                                    onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                                    className={inputClass}
                                    placeholder="Material / service description"
                                  />
                                </Field>
                              </div>

                              <div className="grid grid-cols-2 gap-3 lg:col-span-4 lg:grid-cols-2">
                                <Field label="Qty" hint="min 1">
                                  <input
                                    type="number"
                                    min="1"
                                    value={it.quantity}
                                    onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                                    className={cn(inputClass, "text-right")}
                                  />
                                </Field>

                                <Field label="Unit Price" hint="INR">
                                  <input
                                    type="number"
                                    min="0"
                                    value={it.unitPrice}
                                    onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                                    className={cn(inputClass, "text-right")}
                                  />
                                </Field>
                              </div>

                              <div className="lg:col-span-2 flex flex-col gap-2">
                                <Field label="Line Total" hint="auto">
                                  <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-900 text-right">
                                    ₹{money(lineTotal)}
                                  </div>
                                </Field>

                                {items.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() => removeItem(idx)}
                                    className={cn(btnBase, "px-3 py-2 bg-white border border-slate-200 text-red-500 hover:bg-slate-50")}
                                  >
                                    Remove
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tax + totals */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-extrabold text-slate-900">Tax</div>
                      <div className="mt-3">
                        <Field label="Tax Percent (GST)" hint="0+">
                          <input
                            type="number"
                            min="0"
                            value={taxPercent}
                            onChange={(e) => setTaxPercent(Math.max(0, Number(e.target.value) || 0))}
                            className={cn(inputClass, "max-w-[200px]")}
                          />
                        </Field>
                      </div>

                      <div className="mt-3 text-sm text-slate-600 space-y-1">
                        <div className="flex items-center justify-between">
                          <span>Subtotal</span>
                          <b className="text-slate-900">₹{money(subtotal)}</b>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Tax</span>
                          <b className="text-slate-900">₹{money(taxAmount)}</b>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="text-sm font-extrabold text-slate-900">Total Amount</div>
                      <div className="mt-2 text-3xl font-extrabold text-slate-900">₹{money(totalAmount)}</div>
                      <div className="mt-1 text-xs text-slate-400">Auto calculated from items + GST.</div>
                    </div>
                  </div>

                  {/* Terms */}
                  <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <div className="text-sm font-extrabold text-slate-900">Notes / Terms</div>
                        <div className="text-xs text-slate-600">Select from library or add custom terms (saved to PDF).</div>
                      </div>
                      <button
                        type="button"
                        onClick={clearTerms}
                        className={cn(btnBase, "px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto")}
                      >
                        Clear
                      </button>
                    </div>

                    <div className="p-4 grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {/* Library */}
                      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-900">
                          Terms Library
                        </div>
                        <div className="p-3 max-h-[320px] overflow-auto space-y-2">
                          {TERMS_LIBRARY.map((t) => {
                            const checked = selectedTermIds.includes(t.id);
                            return (
                              <label
                                key={t.id}
                                className={cn(
                                  "flex items-start gap-3 rounded-2xl border px-3 py-2 cursor-pointer",
                                  checked ? "border-slate-200 bg-slate-50" : "border-slate-200 bg-white"
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleTerm(t.id)}
                                  className="mt-0.5 h-4 w-4 accent-blue-600"
                                />
                                <span className="text-sm text-slate-900 leading-snug">{t.text}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom */}
                      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-200 bg-slate-50 text-xs font-extrabold text-slate-900">
                          Custom Terms
                        </div>
                        <div className="p-3 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              value={customTermInput}
                              onChange={(e) => setCustomTermInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomTerm();
                                }
                              }}
                              className={inputClass}
                              placeholder="Type custom term..."
                            />
                            <button
                              type="button"
                              onClick={addCustomTerm}
                              className={cn(btnBase, "bg-blue-600 text-white w-full sm:w-auto")}
                            >
                              Add
                            </button>
                          </div>

                          {customTerms.length ? (
                            <div className="space-y-2">
                              {customTerms.map((ct, idx) => (
                                <div
                                  key={`${ct}-${idx}`}
                                  className="flex items-start justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2"
                                >
                                  <div className="text-sm text-slate-900 break-words">{ct}</div>
                                  <button
                                    type="button"
                                    onClick={() => removeCustomTerm(idx)}
                                    className="text-xs font-semibold text-red-500 hover:underline shrink-0"
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400">No custom terms added yet.</div>
                          )}

                          <Field label="Extra Notes" hint="optional">
                            <textarea
                              rows={3}
                              value={extraNotes}
                              onChange={(e) => setExtraNotes(e.target.value)}
                              className={inputClass}
                              placeholder="Any extra note to print in PDF..."
                            />
                          </Field>

                          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                            <div className="text-[11px] font-semibold text-slate-600 mb-1">Final Notes Text (Saved)</div>
                            <pre className="whitespace-pre-wrap break-words text-xs text-slate-900">
                              {finalNotesText || "-"}
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button type="submit" disabled={submitting} className={cn(btnBase, "bg-slate-900 text-white w-full sm:w-auto")}>
                      {submitting ? "Creating..." : "Create Quotation"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        resetFormAll();
                        showToast("success", "Form reset");
                        setError("");
                        setMessage("");
                      }}
                      className={cn(btnBase, "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto")}
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          </div>

          {/* List (sticky on desktop) */}
          <div className="xl:col-span-5 space-y-5">
            <div className="xl:sticky xl:top-4">
              <Card title="Your Quotations">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="text-xs text-slate-600">
                    {loadingList ? "Loading..." : `Showing ${myQuotes.length} quotation(s)`}
                  </div>
                  <button
                    type="button"
                    onClick={fetchMyQuotes}
                    className={cn(btnBase, "px-3 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto")}
                  >
                    Refresh
                  </button>
                </div>

                {loadingList ? (
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 text-sm text-slate-600">
                    Loading quotations...
                  </div>
                ) : myQuotes.length === 0 ? (
                  <div className="p-6 rounded-2xl border border-slate-200 bg-white text-center">
                    <div className="text-slate-900 font-semibold">No quotations created yet</div>
                    <div className="text-sm text-slate-600 mt-1">Create your first quotation using the form.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {myQuotes.map((doc) => (
                      <div key={doc._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-extrabold text-slate-900 break-words">
                              {doc.customerName}
                            </div>
                            <div className="mt-1 text-xs text-slate-600 break-words">
                              Delivery: {safe(doc.projectName) || "-"}
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-slate-400">
                              QUOTATION • {fmtDate(doc.createdAt)}
                            </div>
                          </div>
                          <StatusBadge status={doc.status} />
                        </div>

                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => viewPDF(doc)}
                            className={cn(btnBase, "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}
                          >
                            View PDF
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadPDF(doc)}
                            className={cn(btnBase, "bg-blue-600 text-white")}
                          >
                            Download PDF
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </div>
        </div>

        {/* PDF VIEW MODAL */}
        <Modal
          open={pdfViewOpen}
          title="Quotation PDF Preview"
          subtitle="OGCS header + colorful layout"
          onClose={closePdfView}
          footer={
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-slate-600">Tip: Open in new tab for full screen view.</div>
              <div className="flex flex-col sm:flex-row gap-2">
                {pdfUrl ? (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={cn(btnBase, "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}
                  >
                    Open in new tab
                  </a>
                ) : null}
                <button onClick={closePdfView} type="button" className={cn(btnBase, "bg-slate-900 text-white")}>
                  Close
                </button>
              </div>
            </div>
          }
        >
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden h-[78dvh]">
            {pdfUrl ? (
              <iframe title="Quotation PDF Preview" src={pdfUrl} className="w-full h-full" />
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-slate-600">Preparing PDF...</div>
            )}
          </div>
        </Modal>

        <Toast show={toast.show} type={toast.type} msg={toast.msg} onClose={() => setToast({ show: false, type: "info", msg: "" })} />
      </div>
    </div>
  );
}