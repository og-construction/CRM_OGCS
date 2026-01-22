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
    title: "Follow-up after meeting",
    subject: "Follow-up — Next steps",
    message:
      "Hello {{name}},\n\nThank you for your time today. As discussed, we will share the proposal and next steps.\n\nRegards,\nOGCS CRM",
  },
  {
    title: "Quotation request",
    subject: "Quotation / Requirements",
    message:
      "Hello {{name}},\n\nPlease share your requirement details. We will provide quotation and delivery schedule.\n\nRegards,\nOGCS CRM",
  },
];

const cn = (...a) => a.filter(Boolean).join(" ");

export default function CommunicationSystem() {
  const [tab, setTab] = useState("email"); // email | timeline | templates
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [emailForm, setEmailForm] = useState(emptyEmail);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  const [search, setSearch] = useState("");
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem("ogcs_comm_templates");
    return saved ? JSON.parse(saved) : templatesSeed;
  });

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
    localStorage.setItem("ogcs_comm_templates", JSON.stringify(templates));
  }, [templates]);

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
      subject: t.subject,
      message: t.message.replaceAll("{{name}}", name),
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

  /* ================= UI ================= */

  return (
    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl">
      {/* ================= HEADER ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white">
        {/* Top accent bar (allowed colors) */}
        <div className="h-1 bg-blue-600" />

        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900 truncate">
              Communication System
            </h1>
            <p className="text-sm text-slate-600">
              Email • Templates • Communication Timeline
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            <TabButton
              active={tab === "email"}
              onClick={() => setTab("email")}
              icon={<FiMail />}
            >
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
        <div
          className={cn(
            "rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm flex items-start gap-2"
          )}
        >
          <span className={cn("mt-0.5 shrink-0", msg.type === "error" ? "text-red-500" : "text-green-600")}>
            {msg.type === "error" ? <FiAlertTriangle /> : <FiCheckCircle />}
          </span>
          <div className="text-slate-900 break-words">{msg.text}</div>
        </div>
      ) : null}

      {/* ================= EMAIL ================= */}
      {tab === "email" ? (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Card title="Compose Email" tone="blue">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="To Email"
                  name="toEmail"
                  value={emailForm.toEmail}
                  onChange={handleEmailChange}
                  icon={<FiMail />}
                  placeholder="customer@email.com"
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
                  rows={8}
                  name="message"
                  value={emailForm.message}
                  onChange={handleEmailChange}
                  placeholder="Write email message..."
                  className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
                />
                <div className="mt-2 text-xs text-slate-600">
                  Tip: Use template for faster writing.
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={sendEmail}
                  disabled={sending}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold border border-slate-200",
                    "bg-blue-600 text-white disabled:opacity-60"
                  )}
                >
                  {sending ? "Sending..." : <FiSend />}
                  Send Email
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card
              title="Quick Templates"
              subtitle="Click to apply"
              tone="orange"
            >
              <div className="space-y-2">
                {templates.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left rounded-2xl border border-slate-200 bg-white p-3 hover:bg-slate-50 transition"
                  >
                    <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2 whitespace-pre-wrap">
                      {t.message}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {/* ================= TIMELINE ================= */}
      {tab === "timeline" ? (
        <Card title="Communication Timeline" subtitle="Latest activity" tone="green">
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 outline-none focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <button
              type="button"
              onClick={fetchLogs}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              <FiRefreshCcw className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
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
                <div
                  key={l._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <Badge type={l.status}>{l.status || "status"}</Badge>
                      <div className="text-sm font-semibold text-slate-900 mt-1 truncate">
                        {l.subject || "No Subject"}
                      </div>
                      <div className="text-xs text-slate-600 mt-1">
                        {new Date(l.createdAt).toLocaleString()}
                      </div>
                      {(l?.relatedTo?.name || l?.relatedTo?.company) ? (
                        <div className="text-xs text-slate-400 mt-1 truncate">
                          {l?.relatedTo?.name ? `Name: ${l.relatedTo.name}` : ""}
                          {l?.relatedTo?.name && l?.relatedTo?.company ? " • " : ""}
                          {l?.relatedTo?.company ? `Company: ${l.relatedTo.company}` : ""}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(l.message || "")}
                      className="text-xs font-semibold flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1.5 rounded-2xl text-slate-900 hover:bg-slate-50"
                      title="Copy message"
                    >
                      <FiCopy /> Copy
                    </button>
                  </div>

                  {l.message ? (
                    <div className="mt-3 bg-slate-50 rounded-2xl p-3 text-sm text-slate-900 whitespace-pre-wrap">
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
        <Card title="Templates" subtitle="Saved templates" tone="orange">
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((t, i) => (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-bold text-slate-900">{t.title}</div>
                <div className="text-xs text-slate-600 mt-1">{t.subject}</div>
                <div className="mt-2 text-sm bg-slate-50 rounded-2xl p-3 text-slate-900 whitespace-pre-wrap">
                  {t.message}
                </div>

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => applyTemplate(t)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50"
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
        "inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold border border-slate-200",
        active ? "bg-slate-900 text-white" : "bg-white text-slate-900 hover:bg-slate-50"
      )}
    >
      <span className="text-slate-400">{icon}</span>
      <span className={active ? "text-white" : "text-slate-900"}>{children}</span>
    </button>
  );
}

function Input({ label, icon, ...props }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-900">{label}</label>
      <div className="relative mt-1">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
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

function TimelineSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-24 rounded-2xl bg-slate-100 animate-pulse border border-slate-200" />
      ))}
    </div>
  );
}
