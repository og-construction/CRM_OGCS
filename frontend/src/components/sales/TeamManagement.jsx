import React, { useMemo, useState } from "react";
import Card from "./Card";
import axiosClient from "../../api/axiosClient";
import {
  FiUpload,
  FiFileText,
  FiSend,
  FiX,
  FiCheckCircle,
  FiAlertTriangle,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

const MIN_WORDS = 20;

const countWords = (text = "") =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const chipClass = (active) =>
  `inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition ${
    active
      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
      : "bg-white text-slate-700 border-slate-200"
  }`;

export default function TeamManagement() {
  const [reportDate, setReportDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [memberName, setMemberName] = useState("");
  const [reportText, setReportText] = useState("");
  const [file, setFile] = useState(null);

  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ type: "", text: "" });

  const words = useMemo(() => countWords(reportText), [reportText]);
  const canSubmit = useMemo(() => {
    return memberName.trim() && reportDate && words >= MIN_WORDS;
  }, [memberName, reportDate, words]);

  const handlePickFile = (e) => {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setToast({ type: "", text: "" });
  };

  const removeFile = () => setFile(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setToast({ type: "", text: "" });

    if (!canSubmit) {
      setToast({
        type: "error",
        text: `Please enter name, date and minimum ${MIN_WORDS} words in report.`,
      });
      return;
    }

    try {
      setSubmitting(true);

      const fd = new FormData();
      fd.append("reportDate", reportDate);
      fd.append("memberName", memberName);
      fd.append("reportText", reportText);
      if (file) fd.append("file", file);

      await axiosClient.post("/team-reports", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast({ type: "success", text: "Daily report submitted ✅" });
      setReportText("");
      setFile(null);
      // setMemberName("");
    } catch (err) {
      setToast({
        type: "error",
        text: err.response?.data?.message || "Submit failed",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="space-y-4"
      style={{ background: "#EFF6FF", padding: 16, borderRadius: 16 }}
    >
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              Team Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Submit your daily report with optional attachment. Minimum{" "}
              {MIN_WORDS} words.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={chipClass(true)}>
              <span className="h-2 w-2 rounded-full bg-white/90" />
              Daily Report
            </span>
            <span className={chipClass(false)}>
              Words:{" "}
              <b className="font-extrabold">
                {words}/{MIN_WORDS}
              </b>
            </span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.text && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm shadow-sm ${
            toast.type === "error"
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          <span className="mt-0.5 shrink-0">
            {toast.type === "error" ? <FiAlertTriangle /> : <FiCheckCircle />}
          </span>
          <div className="min-w-0 break-words">{toast.text}</div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Report Form */}
        <div className="lg:col-span-3">
          <Card title="Daily Report Submission">
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Inputs */}
              <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                <Field
                  label="Team Member Name"
                  icon={<FiUser />}
                  value={memberName}
                  onChange={(e) => setMemberName(e.target.value)}
                  placeholder="Enter your name"
                />

                <Field
                  label="Report Date"
                  icon={<FiCalendar />}
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                />
              </div>

              {/* Textarea */}
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Daily Report (min {MIN_WORDS} words)
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-3 text-slate-400">
                    <FiFileText />
                  </span>

                  <textarea
                    value={reportText}
                    onChange={(e) => setReportText(e.target.value)}
                    rows={8}
                    placeholder="Write your daily progress, tasks done, blockers, plan for tomorrow..."
                    className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
                  />
                </div>

                <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between text-xs">
                  <span
                    className={`font-semibold ${
                      words >= MIN_WORDS ? "text-emerald-700" : "text-slate-600"
                    }`}
                  >
                    Words: {words}/{MIN_WORDS}
                  </span>
                  <span className="text-slate-500 break-words">
                    Tip: Include sites visited, calls done, outcomes, and next
                    steps.
                  </span>
                </div>
              </div>

              {/* File uploader */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      Attachment (optional)
                    </div>
                    <div className="text-xs text-slate-600 break-words">
                      Upload image/pdf/excel (work proof, photos, checklist etc.)
                    </div>
                  </div>

                  <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99]">
                    <FiUpload />
                    Upload File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handlePickFile}
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.doc,.docx"
                    />
                  </label>
                </div>

                {file ? (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {file.name}
                        </div>
                        <div className="text-xs text-slate-600">
                          {formatBytes(file.size)} • {file.type || "file"}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={removeFile}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                      >
                        <FiX />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    No file selected. (Optional)
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-95 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Submit Report
                  </>
                )}
              </button>

              {!canSubmit ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Fill <b>Name</b>, select <b>Date</b>, and write at least{" "}
                  <b>{MIN_WORDS} words</b> to enable submit.
                </div>
              ) : null}
            </form>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Reporting Manager">
            <div className="text-sm text-slate-600 break-words">
              Manager information can be shown here (name, role, contact,
              reporting rules).
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <div className="font-semibold text-slate-900">
                Daily Report Format
              </div>
              <ul className="mt-2 list-disc pl-5 text-slate-700 space-y-1">
                <li>Today’s tasks done</li>
                <li>Calls/meetings summary</li>
                <li>Issues / blockers</li>
                <li>Tomorrow plan</li>
              </ul>
            </div>
          </Card>

          <Card title="Collaboration Tools">
            <div className="text-sm text-slate-600 break-words">
              Internal team communication tools will be added here (chat, tasks,
              approvals).
            </div>

            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-700">
                Quick Tips
              </div>
              <div className="mt-1 text-xs text-slate-600 leading-relaxed">
                Keep the report short but clear. Use bullet points for tasks and
                mention measurable outcomes.
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI helper (no logic change) ---------- */
function Field({ label, icon, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          {...props}
          className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100"
        />
      </div>
    </div>
  );
}
