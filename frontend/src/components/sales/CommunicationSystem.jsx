import React, { useEffect, useMemo, useState } from "react";
import {
  FiMail,
  FiMessageSquare,
  FiSend,
  FiClock,
  FiSearch,
  FiCopy,
  FiRefreshCcw,
} from "react-icons/fi";
import Card from "./Card";
import axiosClient from "../../api/axiosClient";

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

  const filteredLogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((l) => {
      const hay = [
        l.type,
        l.toEmail,
        l.subject,
        l.message,
        l?.relatedTo?.name,
        l?.relatedTo?.company,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [logs, search]);

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

  const handleEmailChange = (e) => {
    setMsg({ type: "", text: "" });
    const { name, value } = e.target;

    if (name.startsWith("relatedTo.")) {
      const key = name.split(".")[1];
      setEmailForm((p) => ({
        ...p,
        relatedTo: { ...p.relatedTo, [key]: value },
      }));
      return;
    }

    setEmailForm((p) => ({ ...p, [name]: value }));
  };

  const applyTemplate = (t) => {
    const name = emailForm.relatedTo.name || "Customer";
    const filled = {
      subject: t.subject,
      message: t.message.replaceAll("{{name}}", name),
    };
    setEmailForm((p) => ({ ...p, ...filled }));
    setTab("email");
    setMsg({ type: "success", text: `Template applied: ${t.title}` });
  };

  const sendEmail = async () => {
    setMsg({ type: "", text: "" });

    if (!emailForm.toEmail || !emailForm.subject || !emailForm.message) {
      setMsg({
        type: "error",
        text: "To Email, Subject and Message are required.",
      });
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
      await fetchLogs(); // show failed log also
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="space-y-4"
      style={{ background: "#EFF6FF", padding: 16, borderRadius: 16 }}
    >
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug whitespace-normal break-words">
              Communication System
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 whitespace-normal break-words">
              Send emails, use follow-up templates, and track communication
              timeline.
            </p>
          </div>

          {/* Tabs (mobile scroll) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <TabButton
              active={tab === "email"}
              onClick={() => setTab("email")}
              icon={<FiMail />}
            >
              Send Email
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

      {/* Alert */}
      {msg.text && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            msg.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {msg.text}
        </div>
      )}

      {/* Content */}
      {tab === "email" && (
        <div className="grid gap-4 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <Card
              title="Compose Email"
              right={
                <span className="hidden sm:inline-flex text-xs px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                  Email
                </span>
              }
            >
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <Input
                  label="To Email"
                  name="toEmail"
                  value={emailForm.toEmail}
                  onChange={handleEmailChange}
                  placeholder="client@company.com"
                  icon={<FiMail />}
                />
                <Input
                  label="Subject"
                  name="subject"
                  value={emailForm.subject}
                  onChange={handleEmailChange}
                  placeholder="Follow-up / Quotation / Meeting"
                />
                <Input
                  label="Lead/Person Name"
                  name="relatedTo.name"
                  value={emailForm.relatedTo.name}
                  onChange={handleEmailChange}
                  placeholder="Name"
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
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  name="message"
                  value={emailForm.message}
                  onChange={handleEmailChange}
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  placeholder="Write your message..."
                />
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-xs text-slate-500 whitespace-normal break-words">
                  Email will be sent using your SMTP config from backend.
                </div>

                <button
                  onClick={sendEmail}
                  disabled={sending}
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99] disabled:opacity-50"
                >
                  {sending ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiSend />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card title="Quick Templates">
              <p className="text-sm text-slate-600 mb-3 whitespace-normal break-words">
                Tap a template to auto-fill subject and message.
              </p>

              <div className="space-y-2">
                {templates.map((t, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyTemplate(t)}
                    className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50 active:scale-[0.99] transition"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-semibold text-slate-900 whitespace-normal break-words">
                        {t.title}
                      </div>
                      <span className="shrink-0 text-[11px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                        Use
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-600 whitespace-normal break-words">
                      {t.message}
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "timeline" && (
        <Card title="Activity Timeline">
          <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:w-96">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <FiSearch />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <button
              onClick={fetchLogs}
              className="inline-flex w-full md:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
            >
              <FiRefreshCcw />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              <TimelineSkeleton />
              <TimelineSkeleton />
              <TimelineSkeleton />
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-600 bg-white">
              No logs found.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map((l) => (
                <div
                  key={l._id}
                  className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge type={l.status}>{l.status}</Badge>
                        <span className="text-sm font-semibold text-slate-900 whitespace-normal break-words">
                          {String(l.type || "").toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-500 whitespace-normal break-words">
                          •{" "}
                          {l.createdAt
                            ? new Date(l.createdAt).toLocaleString()
                            : "-"}
                        </span>
                      </div>

                      <div className="mt-2 grid gap-1 text-sm text-slate-700">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-slate-400">
                            <FiMail />
                          </span>
                          <span className="whitespace-normal break-all">
                            <b>To:</b> {l.toEmail || l.toPhone || "-"}
                          </span>
                        </div>

                        {l.subject && (
                          <div className="whitespace-normal break-words">
                            <b>Subject:</b> {l.subject}
                          </div>
                        )}

                        {(l.relatedTo?.name || l.relatedTo?.company) && (
                          <div className="text-xs text-slate-500 whitespace-normal break-words">
                            Related: {l.relatedTo?.name || "-"} •{" "}
                            {l.relatedTo?.company || "-"}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      className="inline-flex w-full md:w-auto md:self-start items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(l.message || "");
                          setMsg({ type: "success", text: "Message copied ✅" });
                        } catch {
                          setMsg({ type: "error", text: "Copy failed" });
                        }
                      }}
                    >
                      <FiCopy />
                      Copy Message
                    </button>
                  </div>

                  {l.message && (
                    <div className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-3 text-sm text-slate-800 border border-slate-100">
                      {l.message}
                    </div>
                  )}

                  {l.error && (
                    <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 whitespace-normal break-words">
                      Error: {l.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "templates" && (
        <Card title="Templates & Scripts">
          <p className="text-sm text-slate-600 mb-4 whitespace-normal break-words">
            Manage follow-up templates. Stored locally for now (can connect to DB
            later).
          </p>

          <div className="grid gap-3 md:grid-cols-2">
            {templates.map((t, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 w-full">
                    <div className="text-sm font-bold text-slate-900 whitespace-normal break-words">
                      {t.title}
                    </div>
                    <div className="mt-1 text-xs text-slate-600 whitespace-normal break-words">
                      <b>Subject:</b> {t.subject}
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] px-2 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-700">
                    Template
                  </span>
                </div>

                <div className="mt-3 whitespace-pre-wrap break-words rounded-2xl bg-slate-50 p-3 text-sm text-slate-800 border border-slate-100">
                  {t.message}
                </div>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => applyTemplate(t)}
                    className="rounded-2xl bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-95 active:scale-[0.99]"
                  >
                    Use
                  </button>
                  <button
                    onClick={() => {
                      setTemplates((prev) => prev.filter((_, i) => i !== idx));
                      setMsg({ type: "success", text: "Template deleted ✅" });
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

/* ================= UI Helpers ================= */

function TabButton({ active, onClick, icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-slate-900 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <span className={`${active ? "text-white" : "text-slate-500"}`}>{icon}</span>
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
}

function Input({ label, icon, ...props }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}
        <input
          {...props}
          className={`w-full rounded-2xl border border-slate-200 bg-white ${
            icon ? "pl-10" : "pl-3"
          } pr-3 py-2.5 text-sm outline-none focus:border-slate-400 focus:ring-4 focus:ring-slate-100`}
        />
      </div>
    </div>
  );
}

function Badge({ type, children }) {
  const cls =
    type === "sent"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : type === "failed"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-slate-700";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${cls}`}>
      {children}
    </span>
  );
}

function TimelineSkeleton() {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-16 bg-slate-100 rounded-full" />
        <div className="h-4 w-24 bg-slate-100 rounded" />
        <div className="h-3 w-28 bg-slate-100 rounded" />
      </div>
      <div className="mt-3 h-4 w-64 bg-slate-100 rounded" />
      <div className="mt-2 h-3 w-52 bg-slate-100 rounded" />
      <div className="mt-4 h-20 w-full bg-slate-100 rounded-2xl" />
    </div>
  );
}
