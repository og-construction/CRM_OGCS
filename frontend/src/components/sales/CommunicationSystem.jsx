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

/* ================= DATA ================= */

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

/* ================= COMPONENT ================= */

export default function CommunicationSystem() {
  const [tab, setTab] = useState("email");
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
      setMsg({ type: "error", text: "All fields are required." });
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
    <div
      className="space-y-4 animate-fadeIn"
      style={{ background: "#EFF6FF", padding: 16, borderRadius: 16 }}
    >
      {/* ================= HEADER ================= */}
      <div className="relative overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="h-1.5 bg-gradient-to-r from-red-700 via-yellow-400 to-blue-900 animate-pulse" />

        <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">
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
      {msg.text && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm flex items-start gap-2 animate-slideDown ${
            msg.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {msg.type === "error" ? <FiAlertTriangle /> : <FiCheckCircle />}
          {msg.text}
        </div>
      )}

      {/* ================= EMAIL ================= */}
      {tab === "email" && (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <Card title="Compose Email">
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="To Email"
                  name="toEmail"
                  value={emailForm.toEmail}
                  onChange={handleEmailChange}
                  icon={<FiMail />}
                />
                <Input
                  label="Subject"
                  name="subject"
                  value={emailForm.subject}
                  onChange={handleEmailChange}
                />
                <Input
                  label="Contact Name"
                  name="relatedTo.name"
                  value={emailForm.relatedTo.name}
                  onChange={handleEmailChange}
                />
                <Input
                  label="Company"
                  name="relatedTo.company"
                  value={emailForm.relatedTo.company}
                  onChange={handleEmailChange}
                />
              </div>

              <div className="mt-4">
                <label className="text-sm font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  rows={8}
                  name="message"
                  value={emailForm.message}
                  onChange={handleEmailChange}
                  className="mt-1 w-full rounded-2xl border px-3 py-3 text-sm focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={sendEmail}
                  disabled={sending}
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:scale-[1.02] transition"
                >
                  {sending ? "Sending..." : <FiSend />}
                  Send Email
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Quick Templates">
              <div className="space-y-2">
                {templates.map((t, i) => (
                  <button
                    key={i}
                    onClick={() => applyTemplate(t)}
                    className="w-full text-left rounded-2xl border p-3 hover:bg-slate-50 transition hover:scale-[1.01]"
                  >
                    <div className="font-semibold">{t.title}</div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {t.message}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ================= TIMELINE ================= */}
      {tab === "timeline" && (
        <Card title="Communication Timeline">
          <div className="flex flex-col md:flex-row gap-2 mb-3">
            <div className="relative w-full md:w-96">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full rounded-2xl border px-10 py-2.5 text-sm"
              />
            </div>
            <button
              onClick={fetchLogs}
              className="inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm"
            >
              <FiRefreshCcw />
              Refresh
            </button>
          </div>

          {loading ? (
            <TimelineSkeleton />
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((l) => (
                <div
                  key={l._id}
                  className="rounded-3xl border bg-white p-4 shadow-sm animate-fadeIn"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge type={l.status}>{l.status}</Badge>
                      <div className="text-sm font-semibold mt-1">
                        {l.subject || "No Subject"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(l.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(l.message || "")
                      }
                      className="text-xs flex items-center gap-1 border px-2 py-1 rounded-full"
                    >
                      <FiCopy /> Copy
                    </button>
                  </div>

                  {l.message && (
                    <div className="mt-3 bg-slate-50 rounded-2xl p-3 text-sm">
                      {l.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ================= TEMPLATES ================= */}
      {tab === "templates" && (
        <Card title="Templates">
          <div className="grid md:grid-cols-2 gap-4">
            {templates.map((t, i) => (
              <div
                key={i}
                className="rounded-3xl border p-4 bg-white shadow-sm hover:shadow-md transition"
              >
                <div className="font-bold">{t.title}</div>
                <div className="text-xs text-slate-600 mt-1">
                  {t.subject}
                </div>
                <div className="mt-2 text-sm bg-slate-50 rounded-2xl p-3">
                  {t.message}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ================= ANIMATIONS ================= */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn { animation: fadeIn .3s ease-out; }
          .animate-slideDown { animation: slideDown .25s ease-out; }
        `}
      </style>
    </div>
  );
}

/* ================= SMALL UI ================= */

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white"
          : "border bg-white hover:bg-slate-50"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function Input({ label, icon, ...props }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <div className="relative mt-1">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full rounded-2xl border px-3 py-2.5 text-sm ${
            icon ? "pl-10" : ""
          }`}
        />
      </div>
    </div>
  );
}

function Badge({ type, children }) {
  const cls =
    type === "sent"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : type === "failed"
      ? "bg-red-50 text-red-700 border-red-200"
      : "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-block border px-2 py-0.5 rounded-full text-xs ${cls}`}>
      {children}
    </span>
  );
}

function TimelineSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-24 rounded-3xl bg-slate-100 animate-pulse"
        />
      ))}
    </div>
  );
}
