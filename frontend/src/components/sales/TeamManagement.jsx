// ✅ src/components/sales/TeamManagement.jsx
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
 * ✅ Uses ONLY allowed palette:
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 * ✅ Fully responsive for mobile/tablet/desktop + touch friendly
 */

const cn = (...a) => a.filter(Boolean).join(" ");

const formatBytes = (bytes = 0) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
};

const chipClass = (active) =>
  cn(
    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold transition",
    "min-h-[40px]", // touch safe
    active ? "bg-blue-600 text-white border-slate-200" : "bg-white text-slate-600 border-slate-200"
  );

const inputBase =
  "w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm text-slate-900 " +
  "outline-none transition focus:ring-4 focus:ring-slate-100 focus:border-blue-600";

const textAreaBase =
  "w-full rounded-2xl border border-slate-200 bg-slate-50 px-10 py-3 text-sm text-slate-900 " +
  "outline-none transition focus:ring-4 focus:ring-slate-100 focus:border-blue-600";

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold " +
  "transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px]";

/* ---------- small UI helper (no logic change) ---------- */
function Field({ label, icon, hint, className = "", ...props }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <label className="block text-sm font-semibold text-slate-900 truncate">{label}</label>
        {hint ? <span className="text-[11px] text-slate-400 shrink-0">{hint}</span> : null}
      </div>

      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input {...props} className={inputBase} />
      </div>
    </div>
  );
}

function ToastBar({ toast, onClose }) {
  if (!toast?.text) return null;

  const isErr = toast.type === "error";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className={cn("h-1", isErr ? "bg-red-500" : "bg-green-600")} />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className={cn("mt-0.5 shrink-0", isErr ? "text-red-500" : "text-green-600")}>
            {isErr ? <FiAlertTriangle /> : <FiCheckCircle />}
          </span>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-slate-900 break-words">{toast.text}</div>
            <div className="mt-1 text-xs text-slate-600">
              {isErr ? "Please check the fields and try again." : "Thanks! Your report is saved."}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="ml-auto shrink-0 inline-flex items-center justify-center h-10 w-10 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600"
            aria-label="Dismiss"
            title="Dismiss"
          >
            <FiX />
          </button>
        </div>
      </div>
    </div>
  );
}

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
    <div className="bg-slate-50 min-h-[100dvh]">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 truncate">
                  Team Management
                </h1>
                <p className="mt-1 text-xs sm:text-sm text-slate-600">
                  Submit your daily report with optional attachment.
                </p>

                <div className="mt-3 flex flex-wrap gap-2">
                  <span className={chipClass(true)}>
                    <span className="h-2 w-2 rounded-full bg-white" />
                    Daily Report
                  </span>
                  <span className={chipClass(false)}>
                    <span className="h-2 w-2 rounded-full bg-slate-400" />
                    Proof Upload (optional)
                  </span>
                </div>
              </div>

              <div className="w-full lg:w-auto">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
                  <div className="font-semibold text-slate-900">Quick tip</div>
                  Use bullet points for tasks & mention outcomes (calls, meetings, closures).
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Toast */}
        <ToastBar toast={toast} onClose={() => setToast({ type: "", text: "" })} />

        {/* Layout */}
        <div className="grid gap-4 lg:grid-cols-12">
          {/* Form */}
          <div className="lg:col-span-8">
            <Card title="Daily Report Submission">
              <form onSubmit={onSubmit} className="space-y-4">
                {/* Inputs */}
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <Field
                    label="Team Member Name"
                    hint="required"
                    icon={<FiUser />}
                    value={memberName}
                    onChange={(e) => setMemberName(e.target.value)}
                    placeholder="Enter your name"
                  />

                  <Field
                    label="Report Date"
                    hint="required"
                    icon={<FiCalendar />}
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                  />
                </div>

                {/* Textarea */}
                <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <label className="block text-sm font-semibold text-slate-900">Daily Report</label>
                    <span className="text-[11px] text-slate-400">required</span>
                  </div>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-3 text-slate-400">
                      <FiFileText />
                    </span>

                    <textarea
                      value={reportText}
                      onChange={(e) => setReportText(e.target.value)}
                      rows={8}
                      placeholder="Write: tasks done, calls/meetings, outcomes, blockers, plan for tomorrow..."
                      className={textAreaBase}
                    />
                  </div>

                  <div className="mt-2 text-xs text-slate-600 break-words">
                    Tip: Include sites visited, calls done, outcomes, and next steps.
                  </div>
                </div>

                {/* File uploader */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900">Attachment</div>
                      <div className="text-xs text-slate-600 break-words">
                        Upload image/pdf/excel (work proof, photos, checklist etc.)
                      </div>
                    </div>

                    <label
                      className={cn(
                        btnBase,
                        "bg-blue-600 text-white w-full sm:w-auto cursor-pointer"
                      )}
                    >
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-slate-900">{file.name}</div>
                          <div className="text-xs text-slate-600">
                            {formatBytes(file.size)} • {file.type || "file"}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={removeFile}
                          className={cn(
                            btnBase,
                            "min-h-[44px] px-3 py-2 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 w-full sm:w-auto"
                          )}
                        >
                          <FiX className="text-orange-500" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                      No file selected (optional).
                    </div>
                  )}
                </div>

                {/* Submit */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className={cn(btnBase, "bg-green-600 text-white w-full sm:w-auto")}
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

                  <button
                    type="button"
                    onClick={() => {
                      setToast({ type: "", text: "" });
                      setReportText("");
                      setFile(null);
                    }}
                    className={cn(
                      btnBase,
                      "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 w-full sm:w-auto"
                    )}
                  >
                    Clear Text
                  </button>
                </div>

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
          <div className="lg:col-span-4 space-y-4">
            <Card title="Reporting Manager">
              <div className="text-sm text-slate-600 break-words">
                Manager information can be shown here (name, role, contact, reporting rules).
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <div className="font-semibold text-slate-900">Daily Report Format</div>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Today’s tasks done</li>
                  <li>Calls/meetings summary</li>
                  <li>Issues / blockers</li>
                  <li>Tomorrow plan</li>
                </ul>
              </div>
            </Card>

            <Card title="Collaboration Tools">
              <div className="text-sm text-slate-600 break-words">
                Internal team tools will be added here (chat, tasks, approvals).
              </div>

              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-900">Quick Tips</div>
                <div className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Keep it short but clear. Use bullets and measurable outcomes.
                </div>
              </div>
            </Card>

            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-xs font-semibold text-slate-900">Status Colors</div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-blue-600" />
                  Info
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  Success
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  Warning
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-slate-600">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  Error
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Note: This is UI-only. API endpoint remains <b className="text-slate-600">/team-reports</b>.
        </div>
      </div>
    </div>
  );
}