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

/**
 * ✅ UI UPDATE ONLY (logic unchanged)
 * - Uses only: bg-slate-50, bg-white, bg-slate-100, text-slate-900, text-slate-600, text-slate-400,
 *   border-slate-200, blue-600, green-600, red-500, orange-500
 * - Responsive for mobile / tablet / desktop
 */

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
      ? "bg-blue-600 text-white border-slate-200"
      : "bg-white text-slate-600 border-slate-200"
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

  // ✅ SIMPLE submit rule (no word count):
  const canSubmit = useMemo(() => {
    return memberName.trim() && reportDate && reportText.trim();
  }, [memberName, reportDate, reportText]);

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
        text: "Please enter name, date and daily report text.",
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
    <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 md:p-5 space-y-4">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate">
              Team Management
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-600">
              Submit your daily report with optional attachment.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className={chipClass(true)}>
              <span className="h-2 w-2 rounded-full bg-white" />
              Daily Report
            </span>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast.text && (
        <div
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            toast.type === "error"
              ? "border-slate-200 bg-slate-100 text-slate-900"
              : "border-slate-200 bg-slate-100 text-slate-900"
          }`}
        >
          <span
            className={`mt-0.5 shrink-0 ${
              toast.type === "error" ? "text-red-500" : "text-green-600"
            }`}
          >
            {toast.type === "error" ? <FiAlertTriangle /> : <FiCheckCircle />}
          </span>
          <div className="min-w-0 break-words">
            <div className="text-slate-900">{toast.text}</div>
            <div className="mt-0.5 text-xs text-slate-600">
              {toast.type === "error"
                ? "Please check the fields and try again."
                : "Thanks! Your report is saved."}
            </div>
          </div>
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
              <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                <label className="mb-2 block text-sm font-semibold text-slate-900">
                  Daily Report
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
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-600"
                  />
                </div>

                <div className="mt-2 text-xs text-slate-600 break-words">
                  Tip: Include sites visited, calls done, outcomes, and next
                  steps.
                </div>
              </div>

              {/* File uploader */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-slate-900">
                      Attachment (optional)
                    </div>
                    <div className="text-xs text-slate-600 break-words">
                      Upload image/pdf/excel (work proof, photos, checklist etc.)
                    </div>
                  </div>

                  <label className="inline-flex w-full sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white">
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
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900"
                      >
                        <FiX className="text-orange-500" />
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                    No file selected. (Optional)
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!canSubmit || submitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-green-600 px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
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
                <div className="rounded-2xl border border-slate-200 bg-slate-100 p-3 text-xs text-slate-600">
                  Fill <b className="text-slate-900">Name</b>, select{" "}
                  <b className="text-slate-900">Date</b>, and write your{" "}
                  <b className="text-slate-900">Daily Report</b> to enable submit.
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

            <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <div className="font-semibold text-slate-900">
                Daily Report Format
              </div>
              <ul className="mt-2 list-disc pl-5 text-slate-600 space-y-1">
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
              <div className="text-xs font-semibold text-slate-900">
                Quick Tips
              </div>
              <div className="mt-1 text-xs text-slate-600 leading-relaxed">
                Keep the report short but clear. Use bullet points for tasks and
                mention measurable outcomes.
              </div>
            </div>
          </Card>

          {/* Optional: small responsive helper block */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="text-xs font-semibold text-slate-900">
              Status Colors
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                Info
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                Success
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-orange-500" />
                Warning
              </span>
              <span className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                <span className="h-2 w-2 rounded-full bg-red-500" />
                Error
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI helper (no logic change) ---------- */
function Field({ label, icon, className = "", ...props }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-semibold text-slate-900">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          {...props}
          className="w-full rounded-2xl border border-slate-200 bg-white px-10 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-600"
        />
      </div>
      <div className="mt-1 text-[11px] text-slate-400">
        {/* keeps spacing consistent on mobile; no logic */}
      </div>
    </div>
  );
}
