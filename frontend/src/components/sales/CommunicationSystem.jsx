// src/components/sales/CommunicationSystem.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FiMessageSquare,
  FiSend,
  FiClock,
  FiSearch,
  FiCopy,
  FiRefreshCcw,
  FiCheckCircle,
  FiAlertTriangle,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiX,
  FiPhone,
} from "react-icons/fi";
import Card from "./Card";
import axiosClient from "../../api/axiosClient";

/**
 * ✅ WHATSAPP-ONLY (Professional UI)
 * Allowed colors only:
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 */

const emptyWhatsapp = {
  toPhone: "",
  message: "",
  relatedTo: { name: "", company: "" },
};

const templatesSeed = [
  {
    id: "t1",
    title: "Follow-up after meeting",
    subject: "NA",
    message:
      "Hello {{name}},\n\nThank you for your time today. As discussed, we will share the proposal and next steps.\n\nRegards,\nOGCS CRM",
  },
  {
    id: "t2",
    title: "Quotation request",
    subject: "NA",
    message:
      "Hello {{name}},\n\nPlease share your requirement details. We will provide quotation and delivery schedule.\n\nRegards,\nOGCS CRM",
  },
  {
    id: "t3",
    title: "Payment reminder",
    subject: "NA",
    message:
      "Hello {{name}},\n\nGentle reminder regarding the pending payment. Please share the expected payment date.\n\nRegards,\nOGCS CRM",
  },
];

const cn = (...a) => a.filter(Boolean).join(" ");

function safeParse(json, fallback) {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

/** ✅ Normalize phone for WhatsApp
 * - keeps digits only
 * - if 10 digits -> assumes India (+91) by default
 */
function normalizePhoneToE164(raw, defaultCountryCode = "91") {
  const digits = String(raw || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  if (digits.length === 10) return `${defaultCountryCode}${digits}`;
  return digits;
}

/** ✅ Open WhatsApp (mobile app or desktop web) */
function openWhatsApp({ phone, text }) {
  const e164 = normalizePhoneToE164(phone);
  if (!e164) return;
  const encoded = encodeURIComponent(text || "");
  const url = `https://wa.me/${e164}?text=${encoded}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** ✅ Small WhatsApp SVG icon (no extra packages) */
function WhatsAppIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M19.11 17.27c-.29-.14-1.7-.83-1.97-.93-.26-.1-.46-.14-.66.14-.19.29-.76.93-.93 1.12-.17.19-.34.22-.63.08-.29-.14-1.23-.45-2.34-1.44-.86-.77-1.44-1.72-1.61-2.01-.17-.29-.02-.45.12-.59.12-.12.29-.34.43-.51.14-.17.19-.29.29-.48.1-.19.05-.36-.02-.5-.07-.14-.66-1.58-.9-2.17-.24-.58-.48-.5-.66-.51h-.56c-.19 0-.5.07-.76.36-.26.29-1 1-1 2.43 0 1.44 1.03 2.83 1.17 3.02.14.19 2.03 3.1 4.93 4.35.69.29 1.23.46 1.65.59.69.22 1.32.19 1.82.12.55-.08 1.7-.69 1.94-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33zM16.06 26.85h-.01c-1.82 0-3.6-.49-5.15-1.42l-.37-.22-3.83 1.01 1.03-3.73-.24-.39a10.71 10.71 0 0 1-1.63-5.69c0-5.9 4.8-10.71 10.71-10.71 2.86 0 5.55 1.11 7.57 3.13a10.63 10.63 0 0 1 3.14 7.57c0 5.9-4.8 10.71-10.72 10.71zm9.11-20.09A12.83 12.83 0 0 0 16.07 3C8.98 3 3.2 8.77 3.2 15.86c0 2.26.6 4.47 1.74 6.42L3 29l6.85-1.8a12.81 12.81 0 0 0 6.2 1.59h.01c7.09 0 12.87-5.77 12.87-12.86 0-3.44-1.34-6.67-3.76-9.17z"
      />
    </svg>
  );
}

export default function CommunicationSystem() {
  const [tab, setTab] = useState("whatsapp"); // whatsapp | timeline | templates
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [waForm, setWaForm] = useState(emptyWhatsapp);

  const [msg, setMsg] = useState({ type: "", text: "" });
  const [search, setSearch] = useState("");

  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("ogcs_wa_templates_v1");
    const parsed = saved ? safeParse(saved, null) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : templatesSeed;
  });

  // Template editor modal
  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [tplDraft, setTplDraft] = useState({ id: "", title: "", subject: "NA", message: "" });
  const [tplMode, setTplMode] = useState("create"); // create | edit

  /* ================= FILTER ================= */

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((l) =>
      [
        l.type,
        l.toPhone,
        l.message,
        l?.relatedTo?.name,
        l?.relatedTo?.company,
        l.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [logs, search]);

  /* ================= API ================= */

  const fetchLogs = async () => {
    try {
      setMsg({ type: "", text: "" });
      setLoading(true);
      const res = await axiosClient.get("/communications/logs?limit=60");
      const all = Array.isArray(res.data?.data) ? res.data.data : [];
      // show only WhatsApp logs
      const onlyWa = all.filter((x) => String(x.type || "").toLowerCase() === "whatsapp");
      setLogs(onlyWa);
    } catch (e) {
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to load logs",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    localStorage.setItem("ogcs_wa_templates_v1", JSON.stringify(templates));
  }, [templates]);

  // keyboard: ESC closes template modal
  useEffect(() => {
    if (!tplModalOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setTplModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tplModalOpen]);

  /* ================= HANDLERS ================= */

  const handleWaChange = (e) => {
    setMsg({ type: "", text: "" });
    const { name, value } = e.target;

    if (name.startsWith("relatedTo.")) {
      const key = name.split(".")[1];
      setWaForm((p) => ({
        ...p,
        relatedTo: { ...p.relatedTo, [key]: value },
      }));
    } else {
      setWaForm((p) => ({ ...p, [name]: value }));
    }
  };

  const applyTemplate = (t) => {
    const nameForWa = waForm.relatedTo.name || "Customer";
    const filledMessage = (t.message || "").replaceAll("{{name}}", nameForWa);

    setWaForm((p) => ({ ...p, message: filledMessage }));
    setTab("whatsapp");
    setMsg({ type: "success", text: `Template applied: ${t.title}` });
  };

  const openWhatsAppAndLog = async () => {
    setMsg({ type: "", text: "" });

    if (!waForm.toPhone || !waForm.message) {
      setMsg({ type: "error", text: "Phone and Message are required for WhatsApp." });
      return;
    }

    const name = waForm.relatedTo.name || "Customer";
    const finalText = String(waForm.message || "").replaceAll("{{name}}", name);

    // ✅ open WhatsApp (mobile app on mobile, web on desktop)
    openWhatsApp({ phone: waForm.toPhone, text: finalText });

    // ✅ OPTIONAL: if you have backend endpoint to log WhatsApp, call it here
    // If your backend already logs from another endpoint, keep it off to avoid errors.
    // try { await axiosClient.post("/communications/whatsapp", { ...waForm, message: finalText }); } catch {}

    setMsg({ type: "success", text: "Opened WhatsApp ✅" });
    setTab("timeline");
    setWaForm((p) => ({ ...p, message: "" }));
  };

  const copyText = async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      setMsg({ type: "success", text: "Copied to clipboard ✅" });
      setTimeout(() => setMsg({ type: "", text: "" }), 1200);
    } catch {
      setMsg({ type: "error", text: "Copy failed" });
    }
  };

  const openCreateTemplate = () => {
    setTplMode("create");
    setTplDraft({ id: "", title: "", subject: "NA", message: "" });
    setTplModalOpen(true);
  };

  const openEditTemplate = (t) => {
    setTplMode("edit");
    setTplDraft({
      id: t.id || String(Date.now()),
      title: t.title || "",
      subject: "NA",
      message: t.message || "",
    });
    setTplModalOpen(true);
  };

  const saveTemplate = () => {
    setMsg({ type: "", text: "" });

    if (!tplDraft.title || !tplDraft.message) {
      setMsg({ type: "error", text: "Template Title and Message are required." });
      return;
    }

    if (tplMode === "create") {
      const newTpl = { ...tplDraft, id: `t_${Date.now()}` };
      setTemplates((p) => [newTpl, ...p]);
      setMsg({ type: "success", text: "Template created ✅" });
    } else {
      setTemplates((p) => p.map((x) => (x.id === tplDraft.id ? { ...x, ...tplDraft } : x)));
      setMsg({ type: "success", text: "Template updated ✅" });
    }

    setTplModalOpen(false);
  };

  const deleteTemplate = (id) => {
    setTemplates((p) => p.filter((x) => x.id !== id));
    setMsg({ type: "success", text: "Template deleted ✅" });
  };

  /* ================= Floating WhatsApp LOGO =================
     - uses current form phone first, then last log phone
  */
  const floatingWaPhone = useMemo(() => {
    const fromForm = normalizePhoneToE164(waForm.toPhone);
    if (fromForm) return fromForm;

    const lastWithPhone = [...logs].reverse().find((l) => l?.toPhone);
    return lastWithPhone ? normalizePhoneToE164(lastWithPhone.toPhone) : "";
  }, [logs, waForm.toPhone]);

  const floatingWaText = useMemo(() => {
    const base =
      String(waForm.message || "").trim() ||
      "Hello {{name}},\n\nThank you for connecting with OGCS.\n\nRegards,\nOGCS CRM";
    const name = waForm.relatedTo.name || "Customer";
    return base.replaceAll("{{name}}", name);
  }, [waForm.message, waForm.relatedTo.name]);

  /* ================= UI (PRO) ================= */

  const tabDesc =
    tab === "whatsapp"
      ? "Open WhatsApp directly with a pre-filled message."
      : tab === "timeline"
      ? "Track all WhatsApp communications."
      : "Create reusable WhatsApp templates for faster outreach.";

  const stats = useMemo(() => {
    const total = logs.length;
    const sent = logs.filter((x) => String(x.status || "").toLowerCase() === "sent").length;
    const failed = logs.filter((x) => String(x.status || "").toLowerCase() === "failed").length;
    return { total, sent, failed };
  }, [logs]);

  return (
    <div className="min-h-[70vh] space-y-4 rounded-2xl bg-slate-50 p-2 sm:p-4 lg:p-6 relative">
      {/* ================= HEADER ================= */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="h-1 bg-green-600" />
        <div className="p-3 sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg lg:text-xl font-extrabold text-slate-900 truncate">
                WhatsApp Communication
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-600">{tabDesc}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                <StatPill label="Total" value={stats.total} />
                <StatPill label="Sent" value={stats.sent} tone="green" />
                <StatPill label="Failed" value={stats.failed} tone="red" />
                <StatPill label="Templates" value={templates.length} />
                <StatPill label="Ready Phone" value={floatingWaPhone ? "Yes" : "No"} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <TabButton
                active={tab === "whatsapp"}
                onClick={() => setTab("whatsapp")}
                icon={<FiPhone />}
              >
                WhatsApp
              </TabButton>

              <TabButton
                active={tab === "timeline"}
                onClick={() => setTab("timeline")}
                icon={<FiClock />}
              >
                Timeline
              </TabButton>

              <TabButton
                active={tab === "templates"}
                onClick={() => setTab("templates")}
                icon={<FiMessageSquare />}
              >
                Templates
              </TabButton>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ALERT ================= */}
      {msg.text ? (
        <div
          className={cn(
            "rounded-2xl border border-slate-200 bg-white px-3 sm:px-4 py-3 text-sm",
            "flex items-start gap-2"
          )}
          role={msg.type === "error" ? "alert" : "status"}
          aria-live="polite"
        >
          <span
            className={cn(
              "mt-0.5 shrink-0",
              msg.type === "error" ? "text-red-500" : "text-green-600"
            )}
            aria-hidden="true"
          >
            {msg.type === "error" ? <FiAlertTriangle /> : <FiCheckCircle />}
          </span>
          <div className="text-slate-900 break-words">{msg.text}</div>
        </div>
      ) : null}

      {/* ================= WHATSAPP ================= */}
      {tab === "whatsapp" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-8">
            <Card title="Compose WhatsApp" subtitle="Opens WhatsApp app / WhatsApp Web" tone="green">
              <Section title="Recipient">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  <Input
                    label="Phone (WhatsApp)"
                    name="toPhone"
                    value={waForm.toPhone}
                    onChange={handleWaChange}
                    icon={<FiPhone />}
                    placeholder="e.g., 9876543210 or +919876543210"
                    inputMode="tel"
                    autoComplete="tel"
                  />
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                    <div className="text-xs font-semibold text-slate-600">Normalized</div>
                    <div className="mt-0.5 text-sm font-extrabold text-slate-900">
                      {normalizePhoneToE164(waForm.toPhone) || "-"}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-400">Auto: 10 digits → +91</div>
                  </div>
                </div>
              </Section>

              <Section title="Contact">
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4">
                  <Input
                    label="Contact Name"
                    name="relatedTo.name"
                    value={waForm.relatedTo.name}
                    onChange={handleWaChange}
                    placeholder="Customer Name"
                    autoComplete="name"
                  />
                  <Input
                    label="Company"
                    name="relatedTo.company"
                    value={waForm.relatedTo.company}
                    onChange={handleWaChange}
                    placeholder="Company Name"
                  />
                </div>
              </Section>

              <Section title="Message">
                <label className="text-sm font-semibold text-slate-900">Message</label>
                <textarea
                  rows={10}
                  name="message"
                  value={waForm.message}
                  onChange={handleWaChange}
                  placeholder="Write WhatsApp message..."
                  className={cn(
                    "mt-1 w-full min-h-[220px] rounded-2xl border border-slate-200 bg-white px-3 py-3",
                    "text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                  )}
                />
                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-xs text-slate-600">
                    Tip: Use templates and <span className="font-semibold">{"{{name}}"}</span>.
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaForm(emptyWhatsapp)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                      "px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50",
                      "focus:outline-none focus:ring-4 focus:ring-slate-100"
                    )}
                  >
                    <FiRefreshCcw />
                    Reset
                  </button>
                </div>
              </Section>

              <div className="mt-4 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
                <button
                  type="button"
                  onClick={() => setTab("templates")}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                    "px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50",
                    "focus:outline-none focus:ring-4 focus:ring-slate-100"
                  )}
                >
                  <FiMessageSquare />
                  Browse Templates
                </button>

                <button
                  type="button"
                  onClick={openWhatsAppAndLog}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200",
                    "bg-green-600 px-5 py-2.5 text-sm font-semibold text-white",
                    "focus:outline-none focus:ring-4 focus:ring-slate-100"
                  )}
                >
                  <FiSend />
                  Open WhatsApp
                </button>
              </div>
            </Card>
          </div>

          <div className="xl:col-span-4">
            <Card title="Quick Templates" subtitle="One-click apply" tone="orange">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-xs text-slate-600">Saved in browser</div>
                <button
                  type="button"
                  onClick={openCreateTemplate}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white",
                    "px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50",
                    "focus:outline-none focus:ring-4 focus:ring-slate-100"
                  )}
                >
                  <FiPlus />
                  New
                </button>
              </div>

              <div className="space-y-2">
                {templates.slice(0, 6).map((t) => (
                  <TemplateTile
                    key={t.id}
                    tpl={t}
                    onApply={() => applyTemplate(t)}
                    onEdit={() => openEditTemplate(t)}
                    onDelete={() => deleteTemplate(t.id)}
                  />
                ))}

                {templates.length > 6 ? (
                  <button
                    type="button"
                    onClick={() => setTab("templates")}
                    className={cn(
                      "w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2",
                      "text-sm font-semibold text-slate-900 hover:bg-white",
                      "focus:outline-none focus:ring-4 focus:ring-slate-100"
                    )}
                  >
                    View all templates ({templates.length})
                  </button>
                ) : null}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* ================= TIMELINE ================= */}
      {tab === "timeline" ? (
        <Card title="WhatsApp Timeline" subtitle="Search and reuse previous WhatsApp messages" tone="green">
          <div className="mb-3 flex flex-col gap-2 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-md">
              <FiSearch
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                aria-hidden="true"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className={cn(
                  "w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 outline-none",
                  "focus:ring-4 focus:ring-slate-100"
                )}
              />
            </div>

            <div className="flex gap-2 lg:ml-auto">
              <button
                type="button"
                onClick={fetchLogs}
                className={cn(
                  "w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                  "px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50",
                  "focus:outline-none focus:ring-4 focus:ring-slate-100"
                )}
              >
                <FiRefreshCcw className={loading ? "animate-spin" : ""} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <TimelineSkeleton />
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No WhatsApp logs found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((l) => (
                <TimelineItem
                  key={l._id}
                  item={l}
                  onCopy={() => copyText(l.message || "")}
                  onWhatsApp={() => openWhatsApp({ phone: l.toPhone, text: l.message || "" })}
                  onReuse={() => {
                    setWaForm((p) => ({
                      ...p,
                      toPhone: l.toPhone || p.toPhone,
                      message: l.message || p.message,
                      relatedTo: {
                        name: l?.relatedTo?.name || p.relatedTo.name,
                        company: l?.relatedTo?.company || p.relatedTo.company,
                      },
                    }));
                    setTab("whatsapp");
                    setMsg({ type: "success", text: "Loaded into WhatsApp Compose ✅" });
                  }}
                />
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* ================= TEMPLATES ================= */}
      {tab === "templates" ? (
        <Card title="WhatsApp Templates" subtitle="Create / edit templates for WhatsApp" tone="orange">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-600">
              Use <span className="font-semibold text-slate-900">{"{{name}}"}</span> placeholder.
            </div>
            <button
              type="button"
              onClick={openCreateTemplate}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                "px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50",
                "focus:outline-none focus:ring-4 focus:ring-slate-100"
              )}
            >
              <FiPlus />
              New Template
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-slate-900 break-words">{t.title}</div>
                    <div className="mt-1 text-xs text-slate-600 break-words">WhatsApp Template</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditTemplate(t)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                        "px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50",
                        "focus:outline-none focus:ring-4 focus:ring-slate-100"
                      )}
                      title="Edit"
                    >
                      <FiEdit3 />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteTemplate(t.id)}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                        "px-3 py-2 text-xs font-semibold text-red-500 hover:bg-slate-50",
                        "focus:outline-none focus:ring-4 focus:ring-slate-100"
                      )}
                      title="Delete"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 whitespace-pre-wrap break-words">
                  {t.message}
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => copyText(t.message || "")}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                      "px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50",
                      "focus:outline-none focus:ring-4 focus:ring-slate-100"
                    )}
                  >
                    <FiCopy />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className={cn(
                      "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                      "px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50",
                      "focus:outline-none focus:ring-4 focus:ring-slate-100"
                    )}
                  >
                    <FiSend />
                    Use
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : null}

      {/* ================= TEMPLATE MODAL ================= */}
      {tplModalOpen ? (
        <Modal
          onClose={() => setTplModalOpen(false)}
          title={tplMode === "create" ? "New WhatsApp Template" : "Edit WhatsApp Template"}
        >
          <div className="space-y-3">
            <Input
              label="Template Title"
              value={tplDraft.title}
              onChange={(e) => setTplDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Delivery Update"
            />

            <div>
              <label className="text-sm font-semibold text-slate-900">Message</label>
              <textarea
                rows={10}
                value={tplDraft.message}
                onChange={(e) => setTplDraft((p) => ({ ...p, message: e.target.value }))}
                placeholder={"Hello {{name}},\n\n..."}
                className={cn(
                  "mt-1 w-full min-h-[220px] rounded-2xl border border-slate-200 bg-white px-3 py-3",
                  "text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                )}
              />
              <div className="mt-1 text-xs text-slate-600">
                Tip: Use <span className="font-semibold text-slate-900">{"{{name}}"}</span> placeholder.
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:flex sm:justify-end">
              <button
                type="button"
                onClick={() => setTplModalOpen(false)}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white",
                  "px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50",
                  "focus:outline-none focus:ring-4 focus:ring-slate-100"
                )}
              >
                <FiX />
                Cancel
              </button>

              <button
                type="button"
                onClick={saveTemplate}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-green-600",
                  "px-4 py-2.5 text-sm font-semibold text-white",
                  "focus:outline-none focus:ring-4 focus:ring-slate-100"
                )}
              >
                <FiCheckCircle />
                Save
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {/* ================= FLOATING WHATSAPP LOGO BUTTON ================= */}
      {floatingWaPhone ? (
        <button
          type="button"
          onClick={() => openWhatsApp({ phone: floatingWaPhone, text: floatingWaText })}
          className={cn(
            "fixed z-50 right-4 bottom-4 sm:right-6 sm:bottom-6",
            "h-14 w-14 rounded-full border border-slate-200",
            "bg-green-600 text-white shadow-sm",
            "flex items-center justify-center",
            "active:scale-[0.98] transition",
            "focus:outline-none focus:ring-4 focus:ring-slate-100"
          )}
          title="Open WhatsApp"
          aria-label="Open WhatsApp"
        >
          <WhatsAppIcon className="h-7 w-7" />
        </button>
      ) : null}
    </div>
  );
}

/* ================= SMALL UI ================= */

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200",
        "px-3 py-2 text-sm font-semibold",
        "focus:outline-none focus:ring-4 focus:ring-slate-100",
        active ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
      )}
      aria-pressed={active}
    >
      <span className={cn("shrink-0", active ? "text-white" : "text-slate-400")} aria-hidden="true">
        {icon}
      </span>
      <span className={active ? "text-white" : "text-slate-900"}>{children}</span>
    </button>
  );
}

function Input({ label, icon, className, ...props }) {
  return (
    <div className={className}>
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <div className="relative mt-1">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <input
          {...props}
          className={cn(
            "w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none",
            "focus:ring-4 focus:ring-slate-100",
            icon ? "pl-10" : ""
          )}
        />
      </div>
    </div>
  );
}

function Badge({ type, children }) {
  const s = String(type || "").toLowerCase();
  const cls = s === "sent" ? "text-green-600" : s === "failed" ? "text-red-500" : "text-orange-500";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50",
        "px-2.5 py-1 text-xs font-semibold",
        cls
      )}
    >
      {children}
    </span>
  );
}

function MiniPill({ children }) {
  return (
    <span className="inline-flex items-center max-w-full break-words rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-900">
      {children}
    </span>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 sm:h-20 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
      ))}
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-slate-900/20" />

      <div className="absolute inset-x-0 bottom-0 p-2 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="w-full sm:max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="h-1 bg-green-600" />
          <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-extrabold text-slate-900 truncate">{title}</div>
              <div className="text-sm text-slate-600">Create a reusable WhatsApp template.</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "shrink-0 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white",
                "px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50",
                "focus:outline-none focus:ring-4 focus:ring-slate-100"
              )}
              title="Close"
            >
              <FiX />
            </button>
          </div>

          <div className="px-4 sm:px-5 pb-4 sm:pb-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

/* ================= PRO SUB COMPONENTS ================= */

function Section({ title, children }) {
  return (
    <div className="mt-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-extrabold text-slate-900">{title}</div>
        <div className="h-px flex-1 bg-slate-100" />
      </div>
      {children}
    </div>
  );
}

function StatPill({ label, value, tone }) {
  const toneCls = tone === "green" ? "text-green-600" : tone === "red" ? "text-red-500" : "text-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="text-[11px] font-semibold text-slate-600">{label}</div>
      <div className={cn("mt-0.5 text-sm font-extrabold", toneCls)}>{value}</div>
    </div>
  );
}

function TemplateTile({ tpl, onApply, onEdit, onDelete }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <button
        type="button"
        onClick={onApply}
        className={cn("w-full text-left rounded-2xl", "focus:outline-none focus:ring-4 focus:ring-slate-100")}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-sm font-extrabold text-slate-900 break-words">{tpl.title}</div>
            <div className="mt-1 text-xs text-slate-600 break-words">WhatsApp Template</div>
          </div>
          <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-900">
            Use
          </span>
        </div>

        <div className="mt-2 line-clamp-2 whitespace-pre-wrap text-xs text-slate-600">{tpl.message}</div>
      </button>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={onEdit}
          className={cn(
            "inline-flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white",
            "px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50",
            "focus:outline-none focus:ring-4 focus:ring-slate-100"
          )}
        >
          <FiEdit3 />
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            "inline-flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white",
            "px-3 py-2 text-xs font-semibold text-red-500 hover:bg-slate-50",
            "focus:outline-none focus:ring-4 focus:ring-slate-100"
          )}
        >
          <FiTrash2 />
          Delete
        </button>
      </div>
    </div>
  );
}

function TimelineItem({ item, onCopy, onReuse, onWhatsApp }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge type={item.status}>{item.status || "status"}</Badge>
            {item.toPhone ? <MiniPill>{item.toPhone}</MiniPill> : null}
            <MiniPill>WHATSAPP</MiniPill>
          </div>

          <div className="mt-2 text-sm font-extrabold text-slate-900 break-words">
            {item.subject || "WhatsApp Message"}
          </div>

          <div className="mt-1 text-xs text-slate-600">
            {item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "-"}
          </div>

          {item?.relatedTo?.name || item?.relatedTo?.company ? (
            <div className="mt-1 text-xs text-slate-400 break-words">
              {item?.relatedTo?.name ? `Name: ${item.relatedTo.name}` : ""}
              {item?.relatedTo?.name && item?.relatedTo?.company ? " • " : ""}
              {item?.relatedTo?.company ? `Company: ${item.relatedTo.company}` : ""}
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row lg:justify-end">
          {item.toPhone ? (
            <button
              type="button"
              onClick={onWhatsApp}
              className={cn(
                "inline-flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-green-600",
                "px-3 py-2 text-xs font-semibold text-white",
                "focus:outline-none focus:ring-4 focus:ring-slate-100"
              )}
              title="Open WhatsApp"
            >
              <FiPhone />
              WhatsApp
            </button>
          ) : null}

          <button
            type="button"
            onClick={onCopy}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white",
              "px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50",
              "focus:outline-none focus:ring-4 focus:ring-slate-100"
            )}
            title="Copy message"
          >
            <FiCopy /> Copy
          </button>

          <button
            type="button"
            onClick={onReuse}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-2xl border border-slate-200 bg-white",
              "px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50",
              "focus:outline-none focus:ring-4 focus:ring-slate-100"
            )}
            title="Reuse"
          >
            <FiEdit3 /> Reuse
          </button>
        </div>
      </div>

      {item.message ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 whitespace-pre-wrap break-words">
          {item.message}
        </div>
      ) : null}
    </div>
  );
}