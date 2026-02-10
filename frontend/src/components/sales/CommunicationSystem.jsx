// src/components/sales/CommunicationSystem.jsx
import React, { useEffect, useMemo, useState } from "react";
import {
  FiMail,
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
} from "react-icons/fi";
import Card from "./Card";
import axiosClient from "../../api/axiosClient";

/**
 * ✅ PROFESSIONAL UI (Restricted palette only)
 * Allowed colors only:
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 */

const emptyEmail = {
  toEmail: "",
  subject: "",
  message: "",
  relatedTo: { name: "", company: "" },
};

const templatesSeed = [
  {
    id: "t1",
    title: "Follow-up after meeting",
    subject: "Follow-up — Next steps",
    message:
      "Hello {{name}},\n\nThank you for your time today. As discussed, we will share the proposal and next steps.\n\nRegards,\nOGCS CRM",
  },
  {
    id: "t2",
    title: "Quotation request",
    subject: "Quotation / Requirements",
    message:
      "Hello {{name}},\n\nPlease share your requirement details. We will provide quotation and delivery schedule.\n\nRegards,\nOGCS CRM",
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

export default function CommunicationSystem() {
  const [tab, setTab] = useState("email"); // email | timeline | templates
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [emailForm, setEmailForm] = useState(emptyEmail);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [search, setSearch] = useState("");

  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("ogcs_comm_templates_v2");
    const parsed = saved ? safeParse(saved, null) : null;
    return Array.isArray(parsed) && parsed.length ? parsed : templatesSeed;
  });

  // Template editor (responsive drawer modal)
  const [tplModalOpen, setTplModalOpen] = useState(false);
  const [tplDraft, setTplDraft] = useState({ id: "", title: "", subject: "", message: "" });
  const [tplMode, setTplMode] = useState("create"); // create | edit

  /* ================= FILTER ================= */

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;

    return logs.filter((l) =>
      [
        l.type,
        l.toEmail,
        l.subject,
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
      setLogs(res.data?.data || []);
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
    localStorage.setItem("ogcs_comm_templates_v2", JSON.stringify(templates));
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

  const handleEmailChange = (e) => {
    setMsg({ type: "", text: "" });
    const { name, value } = e.target;

    if (name.startsWith("relatedTo.")) {
      const key = name.split(".")[1];
      setEmailForm((p) => ({
        ...p,
        relatedTo: { ...p.relatedTo, [key]: value },
      }));
    } else {
      setEmailForm((p) => ({ ...p, [name]: value }));
    }
  };

  const applyTemplate = (t) => {
    const name = emailForm.relatedTo.name || "Customer";
    setEmailForm((p) => ({
      ...p,
      subject: t.subject || "",
      message: (t.message || "").replaceAll("{{name}}", name),
    }));
    setTab("email");
    setMsg({ type: "success", text: `Template applied: ${t.title}` });
  };

  const sendEmail = async () => {
    setMsg({ type: "", text: "" });

    if (!emailForm.toEmail || !emailForm.subject || !emailForm.message) {
      setMsg({ type: "error", text: "To Email, Subject and Message are required." });
      return;
    }

    try {
      setSending(true);
      const res = await axiosClient.post("/communications/email", emailForm);
      setMsg({ type: "success", text: res.data?.message || "Email sent ✅" });
      setEmailForm(emptyEmail);
      await fetchLogs();
      setTab("timeline");
    } catch (e) {
      setMsg({
        type: "error",
        text: e.response?.data?.message || "Failed to send email",
      });
    } finally {
      setSending(false);
    }
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
    setTplDraft({ id: "", title: "", subject: "", message: "" });
    setTplModalOpen(true);
  };

  const openEditTemplate = (t) => {
    setTplMode("edit");
    setTplDraft({
      id: t.id || String(Date.now()),
      title: t.title || "",
      subject: t.subject || "",
      message: t.message || "",
    });
    setTplModalOpen(true);
  };

  const saveTemplate = () => {
    setMsg({ type: "", text: "" });

    if (!tplDraft.title || !tplDraft.subject || !tplDraft.message) {
      setMsg({ type: "error", text: "Template Title, Subject and Message are required." });
      return;
    }

    if (tplMode === "create") {
      const newTpl = {
        ...tplDraft,
        id: `t_${Date.now()}`,
      };
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

  /* ================= UI ================= */

  return (
    <div className="bg-slate-50 p-3 sm:p-4 lg:p-6 rounded-2xl space-y-4">
      {/* ================= HEADER ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="h-1 bg-blue-600" />
        <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 truncate">
              Communication System
            </h1>
            <p className="text-sm text-slate-600">
              Email • Templates • Communication Timeline
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <TabButton active={tab === "email"} onClick={() => setTab("email")} icon={<FiMail />}>
              Email
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

      {/* ================= ALERT ================= */}
      {msg.text ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm flex items-start gap-2">
          <span className={cn("mt-0.5 shrink-0", msg.type === "error" ? "text-red-500" : "text-green-600")}>
            {msg.type === "error" ? <FiAlertTriangle /> : <FiCheckCircle />}
          </span>
          <div className="text-slate-900 break-words">{msg.text}</div>
        </div>
      ) : null}

      {/* ================= EMAIL ================= */}
      {tab === "email" ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Compose */}
          <div className="lg:col-span-7 xl:col-span-8">
            <Card title="Compose Email" tone="blue">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Input
                  label="To Email"
                  name="toEmail"
                  value={emailForm.toEmail}
                  onChange={handleEmailChange}
                  icon={<FiMail />}
                  placeholder="customer@email.com"
                  inputMode="email"
                />
                <Input
                  label="Subject"
                  name="subject"
                  value={emailForm.subject}
                  onChange={handleEmailChange}
                  placeholder="Subject"
                />
                <Input
                  label="Contact Name"
                  name="relatedTo.name"
                  value={emailForm.relatedTo.name}
                  onChange={handleEmailChange}
                  placeholder="Customer Name"
                />
                <Input
                  label="Company"
                  name="relatedTo.company"
                  value={emailForm.relatedTo.company}
                  onChange={handleEmailChange}
                  placeholder="Company Name"
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-900">Message</label>
                <textarea
                  rows={9}
                  name="message"
                  value={emailForm.message}
                  onChange={handleEmailChange}
                  placeholder="Write email message..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                />
                <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-xs text-slate-600">
                    Tip: Use templates for faster writing. Use <span className="font-semibold">{"{{name}}"}</span>{" "}
                    placeholder.
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailForm(emptyEmail)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    <FiRefreshCcw />
                    Reset
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setTab("templates")}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  <FiMessageSquare />
                  Browse Templates
                </button>

                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={sending}
                  className={cn(
                    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold border border-slate-200",
                    "bg-blue-600 text-white disabled:opacity-60"
                  )}
                >
                  {sending ? "Sending..." : <FiSend />}
                  Send Email
                </button>
              </div>
            </Card>
          </div>

          {/* Quick Templates */}
          <div className="lg:col-span-5 xl:col-span-4">
            <Card title="Quick Templates" subtitle="Tap to apply" tone="orange">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-xs text-slate-600">
                  Stored in browser (localStorage)
                </div>
                <button
                  type="button"
                  onClick={openCreateTemplate}
                  className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-slate-900 hover:bg-slate-50"
                >
                  <FiPlus />
                  New
                </button>
              </div>

              <div className="space-y-2">
                {templates.slice(0, 6).map((t) => (
                  <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <button
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className="w-full text-left"
                    >
                      <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                      <div className="text-xs text-slate-600 mt-1 line-clamp-2 whitespace-pre-wrap">
                        {t.message}
                      </div>
                    </button>

                    <div className="mt-2 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditTemplate(t)}
                        className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                        title="Edit template"
                      >
                        <FiEdit3 />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTemplate(t.id)}
                        className="inline-flex items-center gap-1 rounded-2xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-slate-50"
                        title="Delete template"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {templates.length > 6 ? (
                  <button
                    type="button"
                    onClick={() => setTab("templates")}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-white"
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
        <Card title="Communication Timeline" subtitle="Latest activity" tone="green">
          <div className="flex flex-col lg:flex-row lg:items-center gap-2 mb-3">
            <div className="relative w-full lg:max-w-md">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div className="flex gap-2 lg:ml-auto">
              <button
                type="button"
                onClick={fetchLogs}
                className="w-full lg:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <FiRefreshCcw className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
            </div>
          </div>

          {loading ? (
            <TimelineSkeleton />
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              No logs found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((l) => (
                <div key={l._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge type={l.status}>{l.status || "status"}</Badge>
                        {l.type ? <MiniPill>{String(l.type).toUpperCase()}</MiniPill> : null}
                        {l.toEmail ? <MiniPill>{l.toEmail}</MiniPill> : null}
                      </div>

                      <div className="text-sm font-semibold text-slate-900 mt-2 break-words">
                        {l.subject || "No Subject"}
                      </div>

                      <div className="text-xs text-slate-600 mt-1">
                        {l.createdAt ? new Date(l.createdAt).toLocaleString() : "-"}
                      </div>

                      {(l?.relatedTo?.name || l?.relatedTo?.company) ? (
                        <div className="text-xs text-slate-400 mt-1 break-words">
                          {l?.relatedTo?.name ? `Name: ${l.relatedTo.name}` : ""}
                          {l?.relatedTo?.name && l?.relatedTo?.company ? " • " : ""}
                          {l?.relatedTo?.company ? `Company: ${l.relatedTo.company}` : ""}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex gap-2 sm:justify-end">
                      <button
                        type="button"
                        onClick={() => copyText(l.message || "")}
                        className="w-full sm:w-auto text-xs font-semibold inline-flex items-center justify-center gap-1 border border-slate-200 bg-white px-3 py-2 rounded-2xl text-slate-900 hover:bg-slate-50"
                        title="Copy message"
                      >
                        <FiCopy /> Copy
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          // quick reuse: populate compose form
                          setEmailForm((p) => ({
                            ...p,
                            toEmail: l.toEmail || p.toEmail,
                            subject: l.subject || p.subject,
                            message: l.message || p.message,
                            relatedTo: {
                              name: l?.relatedTo?.name || p.relatedTo.name,
                              company: l?.relatedTo?.company || p.relatedTo.company,
                            },
                          }));
                          setTab("email");
                          setMsg({ type: "success", text: "Loaded this log into Compose ✅" });
                        }}
                        className="w-full sm:w-auto text-xs font-semibold inline-flex items-center justify-center gap-1 border border-slate-200 bg-white px-3 py-2 rounded-2xl text-slate-900 hover:bg-slate-50"
                        title="Reuse in Compose"
                      >
                        <FiEdit3 /> Reuse
                      </button>
                    </div>
                  </div>

                  {l.message ? (
                    <div className="mt-3 bg-slate-50 rounded-2xl p-3 text-sm text-slate-900 whitespace-pre-wrap break-words">
                      {l.message}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : null}

      {/* ================= TEMPLATES ================= */}
      {tab === "templates" ? (
        <Card title="Templates" subtitle="Create / edit templates" tone="orange">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
            <div className="text-sm text-slate-600">
              Use <span className="font-semibold text-slate-900">{"{{name}}"}</span> placeholder.
            </div>
            <button
              type="button"
              onClick={openCreateTemplate}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              <FiPlus />
              New Template
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((t) => (
              <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900 break-words">{t.title}</div>
                    <div className="text-xs text-slate-600 mt-1 break-words">{t.subject}</div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditTemplate(t)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                      title="Edit"
                    >
                      <FiEdit3 />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(t.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-red-500 hover:bg-slate-50"
                      title="Delete"
                    >
                      <FiTrash2 />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-3 text-sm bg-slate-50 rounded-2xl p-3 text-slate-900 whitespace-pre-wrap break-words">
                  {t.message}
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2 sm:justify-end">
                  <button
                    type="button"
                    onClick={() => copyText(t.message || "")}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    <FiCopy />
                    Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
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

      {/* ================= TEMPLATE MODAL (RESPONSIVE) ================= */}
      {tplModalOpen ? (
        <Modal onClose={() => setTplModalOpen(false)} title={tplMode === "create" ? "New Template" : "Edit Template"}>
          <div className="space-y-3">
            <Input
              label="Template Title"
              value={tplDraft.title}
              onChange={(e) => setTplDraft((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., Payment Reminder"
            />
            <Input
              label="Subject"
              value={tplDraft.subject}
              onChange={(e) => setTplDraft((p) => ({ ...p, subject: e.target.value }))}
              placeholder="Email subject"
            />
            <div>
              <label className="text-sm font-semibold text-slate-900">Message</label>
              <textarea
                rows={10}
                value={tplDraft.message}
                onChange={(e) => setTplDraft((p) => ({ ...p, message: e.target.value }))}
                placeholder={"Hello {{name}},\n\n..."}
                className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
              />
              <div className="mt-1 text-xs text-slate-600">
                Tip: Use <span className="font-semibold text-slate-900">{"{{name}}"}</span> placeholder.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTplModalOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
              >
                <FiX />
                Cancel
              </button>

              <button
                type="button"
                onClick={saveTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                <FiCheckCircle />
                Save
              </button>
            </div>
          </div>
        </Modal>
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
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold border border-slate-200 whitespace-nowrap",
        active ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
      )}
    >
      <span className={cn("shrink-0", active ? "text-white" : "text-slate-400")}>{icon}</span>
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
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
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
      <div className="mt-1 text-xs text-slate-400"> </div>
    </div>
  );
}

function Badge({ type, children }) {
  // Use only allowed accent colors
  const cls =
    type === "sent"
      ? "border-slate-200 bg-slate-50 text-green-600"
      : type === "failed"
      ? "border-slate-200 bg-slate-50 text-red-500"
      : "border-slate-200 bg-slate-50 text-orange-500";

  return (
    <span className={cn("inline-flex items-center border px-2.5 py-1 rounded-2xl text-xs font-semibold", cls)}>
      {children}
    </span>
  );
}

function MiniPill({ children }) {
  return (
    <span className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-900 max-w-full break-words">
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

/**
 * ✅ Responsive modal:
 * - Mobile: bottom-sheet style
 * - Desktop: centered dialog
 * Uses only allowed colors.
 */
function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/20"
      />

      {/* Panel */}
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-2 sm:p-4">
        <div className="w-full sm:max-w-xl rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base sm:text-lg font-extrabold text-slate-900 truncate">{title}</div>
              <div className="text-sm text-slate-600">Create a reusable email template.</div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
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
