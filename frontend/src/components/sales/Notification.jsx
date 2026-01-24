// ✅ Optimized, responsive, mobile-first Notification.jsx (with Follow-up Cards + Notifications)
// - Better spacing + responsive layout
// - Icons auto-scale on mobile/desktop
// - Sticky toolbars where useful
// - Cleaner cards & list rows
// - Keeps your restricted palette
// - Uses your existing custom toast (no react-hot-toast)
// - Follow-up dashboard: Today/Upcoming/Overdue + list

// src/components/sales/Notification.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  FiBell,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiCheckCircle,
  FiCircle,
  FiSearch,
  FiX,
  FiClock,
  FiAlertTriangle,
  FiChevronRight,
} from "react-icons/fi";

/**
 * ✅ Restricted palette ONLY:
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 */

const cn = (...a) => a.filter(Boolean).join(" ");

const inputClass =
  "w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none " +
  "text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-slate-100 transition";

const empty = { title: "", description: "", notifyDate: "" };

const getDayName = (yyyyMmDd) => {
  if (!yyyyMmDd) return "";
  const d = new Date(yyyyMmDd);
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[d.getDay()];
};

const prettyDate = (dateVal) => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const prettyDT = (dateVal) => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/* ---------------- UI atoms ---------------- */

function Field({ label, hint, children }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label className="text-sm font-semibold text-slate-900">{label}</label>
        {hint ? <span className="text-[11px] text-slate-400">{hint}</span> : null}
      </div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StatPill({ label, value, accent = "slate" }) {
  const cls =
    accent === "blue"
      ? "bg-blue-600 text-white"
      : accent === "green"
      ? "bg-green-600 text-white"
      : accent === "red"
      ? "bg-red-500 text-white"
      : accent === "orange"
      ? "bg-orange-500 text-white"
      : "bg-slate-100 text-slate-900 border border-slate-200";

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold",
        cls
      )}
    >
      <span className="opacity-90">{label}</span>
      <span className="bg-white/20 px-2 py-0.5 rounded-full">{value}</span>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-3 py-2 rounded-2xl text-sm font-semibold transition whitespace-nowrap",
        active
          ? "bg-white border border-slate-200 text-slate-900"
          : "text-slate-600 hover:text-slate-900"
      )}
    >
      {children}
    </button>
  );
}

function IconBadge({ tone = "blue", children, title }) {
  const toneCls =
    tone === "blue"
      ? "bg-blue-600 text-white"
      : tone === "green"
      ? "bg-green-600 text-white"
      : tone === "orange"
      ? "bg-orange-500 text-white"
      : tone === "red"
      ? "bg-red-500 text-white"
      : "bg-slate-900 text-white";

  return (
    <div
      title={title}
      className={cn(
        "shrink-0 rounded-2xl flex items-center justify-center",
        "w-10 h-10 sm:w-11 sm:h-11",
        toneCls
      )}
    >
      {/* icon size adjusts automatically */}
      <div className="text-lg sm:text-xl">{children}</div>
    </div>
  );
}

/** Follow-up Card (responsive + icon scaling) */
function FollowCard({ title, value, hint, tone = "blue", active, onClick, icon }) {
  const toneBorder =
    tone === "blue"
      ? "border-blue-600/20"
      : tone === "orange"
      ? "border-orange-500/20"
      : "border-red-500/20";

  const dotCls =
    tone === "blue" ? "bg-blue-600" : tone === "orange" ? "bg-orange-500" : "bg-red-500";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "text-left rounded-2xl border p-4 transition hover:bg-slate-50 active:scale-[0.99]",
        toneBorder,
        active ? "ring-2 ring-slate-200 border-slate-900" : "border-slate-200"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn("h-2.5 w-2.5 rounded-full", dotCls)} />
            <div className="text-xs font-semibold text-slate-600">{title}</div>
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900">{value}</div>
          {hint ? <div className="mt-1 text-xs text-slate-400 break-words">{hint}</div> : null}
        </div>

        <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700">
          <span className="text-lg sm:text-xl">{icon}</span>
        </div>
      </div>
    </button>
  );
}

function Toast({ show, type, msg, onClose }) {
  if (!show) return null;

  const tone =
    type === "success"
      ? "text-green-600"
      : type === "error"
      ? "text-red-500"
      : "text-slate-600";

  return (
    <div className="fixed bottom-5 right-5 z-50">
      <div className={cn("px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold bg-white", tone)}>
        <div className="flex items-start gap-3">
          <div className="min-w-0 break-words">{msg}</div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <FiX />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Component ---------------- */

export default function Notification() {
  /* Notifications state */
  const [form, setForm] = useState(empty);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: "info", msg: "" });

  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const day = useMemo(() => getDayName(form.notifyDate), [form.notifyDate]);

  const showToast = (type, msg) => {
    setToast({ show: true, type, msg });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast({ show: false, type: "info", msg: "" }), 2200);
  };

  const loadNotifications = async () => {
    try {
      setError("");
      setLoading(true);
      const res = await axiosClient.get("/notifications");
      setItems(res.data?.items || []);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load notifications");
      showToast("error", e.response?.data?.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const onChange = (key) => (e) => setForm((p) => ({ ...p, [key]: e.target.value }));

  const createNotification = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.title.trim() || !form.description.trim() || !form.notifyDate) {
      setError("Please fill Title, Description and Date");
      showToast("error", "Please fill all required fields");
      return;
    }

    try {
      setSaving(true);
      await axiosClient.post("/notifications", {
        title: form.title.trim(),
        description: form.description.trim(),
        notifyDate: form.notifyDate,
      });
      setForm(empty);
      await loadNotifications();
      showToast("success", "Notification created");
    } catch (e2) {
      const msg = e2.response?.data?.message || "Failed to create notification";
      setError(msg);
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const toggleRead = async (id, current) => {
    try {
      await axiosClient.patch(`/notifications/${id}/read`, { isRead: !current });
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: !current } : n)));
      showToast("success", !current ? "Marked as read" : "Marked as unread");
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to update status";
      setError(msg);
      showToast("error", msg);
    }
  };

  const deleteOne = async (id) => {
    const ok = window.confirm("Delete this notification?");
    if (!ok) return;

    try {
      await axiosClient.delete(`/notifications/${id}`);
      setItems((prev) => prev.filter((n) => n._id !== id));
      showToast("success", "Deleted");
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to delete";
      setError(msg);
      showToast("error", msg);
    }
  };

  const stats = useMemo(() => {
    const total = items.length;
    const unread = items.filter((x) => !x.isRead).length;
    const read = total - unread;
    return { total, unread, read };
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((n) => {
        if (tab === "unread") return !n.isRead;
        if (tab === "read") return n.isRead;
        return true;
      })
      .filter((n) => {
        if (!q) return true;
        const t = (n.title || "").toLowerCase();
        const d = (n.description || "").toLowerCase();
        return t.includes(q) || d.includes(q);
      });
  }, [items, tab, search]);

  /* Follow-up Reminder Dashboard */
  const [fuSummary, setFuSummary] = useState({ today: 0, upcoming: 0, overdue: 0 });
  const [fuBucket, setFuBucket] = useState("today");
  const [fuItems, setFuItems] = useState([]);
  const [fuLoading, setFuLoading] = useState(false);
  const [fuError, setFuError] = useState("");

  const loadFollowUpSummary = async () => {
    try {
      setFuError("");
      const res = await axiosClient.get("/leads/my/followups/summary");
      setFuSummary({
        today: Number(res.data?.today || 0),
        upcoming: Number(res.data?.upcoming || 0),
        overdue: Number(res.data?.overdue || 0),
      });
    } catch (e) {
      const msg = e.response?.data?.message || "Follow-up summary not available";
      setFuError(msg);
    }
  };

  const loadFollowUps = async (bucket) => {
    try {
      setFuError("");
      setFuLoading(true);
      const res = await axiosClient.get("/leads/my/followups", {
        params: { bucket: bucket || fuBucket, page: 1, limit: 50 },
      });
      const list = res.data?.items || res.data?.data || [];
      setFuItems(Array.isArray(list) ? list : []);
    } catch (e) {
      const msg = e.response?.data?.message || "Failed to load follow-ups";
      setFuError(msg);
      setFuItems([]);
    } finally {
      setFuLoading(false);
    }
  };

  const refreshFollowUps = async () => {
    await loadFollowUpSummary();
    await loadFollowUps(fuBucket);
  };

  useEffect(() => {
    refreshFollowUps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPickBucket = async (b) => {
    setFuBucket(b);
    await loadFollowUps(b);
  };

  return (
    <div className="bg-slate-50 min-h-[100dvh]">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6 space-y-5">
        {/* ===================== Follow-up Reminder Dashboard ===================== */}
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="h-1 bg-orange-500" />
          <div className="p-4 sm:p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <IconBadge tone="slate" title="Follow-up Reminder">
                <FiClock />
              </IconBadge>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900">
                  Follow-up Reminder
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Today / Upcoming / Overdue follow-ups for your leads.
                </p>
              </div>
            </div>

            <button
              onClick={refreshFollowUps}
              disabled={fuLoading}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-slate-200",
                "bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-60 w-full md:w-auto"
              )}
              type="button"
            >
              <FiRefreshCw className={fuLoading ? "animate-spin" : ""} />
              {fuLoading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <FollowCard
                title="Today"
                value={fuSummary.today}
                hint="Follow-ups due today"
                tone="orange"
                active={fuBucket === "today"}
                onClick={() => onPickBucket("today")}
                icon={<FiClock />}
              />
              <FollowCard
                title="Upcoming"
                value={fuSummary.upcoming}
                hint="Future scheduled follow-ups"
                tone="blue"
                active={fuBucket === "upcoming"}
                onClick={() => onPickBucket("upcoming")}
                icon={<FiChevronRight />}
              />
              <FollowCard
                title="Overdue"
                value={fuSummary.overdue}
                hint="Need action immediately"
                tone="red"
                active={fuBucket === "overdue"}
                onClick={() => onPickBucket("overdue")}
                icon={<FiAlertTriangle />}
              />
            </div>

            {fuError ? (
              <div className="mt-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                <span className="text-red-500 font-semibold">Follow-up error:</span>{" "}
                <span className="text-slate-900">{fuError}</span>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                <div className="text-sm font-extrabold text-slate-900">
                  {fuBucket === "today"
                    ? "Today Follow-ups"
                    : fuBucket === "upcoming"
                    ? "Upcoming Follow-ups"
                    : "Overdue Follow-ups"}
                </div>
                <div className="text-xs text-slate-600">
                  Showing <b className="text-slate-900">{fuItems.length}</b>
                </div>
              </div>

              {fuLoading ? (
                <div className="p-4 text-slate-600">Loading follow-ups...</div>
              ) : fuItems.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="text-slate-900 font-semibold">No follow-ups in this bucket</div>
                  <div className="text-sm text-slate-600 mt-1">
                    Set follow-up date from Follow-Up System.
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {fuItems.map((l) => (
                    <div key={l._id} className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-extrabold text-slate-900 truncate">
                            {l.name}{" "}
                            <span className="text-xs font-semibold text-slate-400">
                              ({l.leadType || "Lead"})
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 mt-1 truncate">
                            {l.company || "-"} {l.city ? `• ${l.city}` : ""}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            <StatPill label="Date" value={prettyDT(l.followUpDate)} accent="slate" />
                            <StatPill label="Status" value={l.status || "-"} accent="blue" />
                          </div>

                          {l.followUpNotes ? (
                            <div className="mt-2 text-sm text-slate-600 whitespace-pre-wrap">
                              {l.followUpNotes}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-2 text-xs text-slate-400">
              Tip: Use Follow-Up System to set dates and notes. This panel shows reminders.
            </div>
          </div>
        </section>

        {/* ===================== Notifications ===================== */}
        <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <IconBadge tone="blue" title="Notifications">
                <FiBell />
              </IconBadge>
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900">
                  Notifications
                </h2>
                <p className="text-sm text-slate-600 mt-1">
                  Create, manage and track updates for your CRM users.
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <StatPill label="Total" value={stats.total} accent="slate" />
                  <StatPill label="Unread" value={stats.unread} accent="blue" />
                  <StatPill label="Read" value={stats.read} accent="green" />
                </div>
              </div>
            </div>

            <button
              onClick={loadNotifications}
              disabled={loading}
              className={cn(
                "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-slate-200",
                "bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-60 w-full md:w-auto"
              )}
              type="button"
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>

        {/* Content grid */}
        <div className="grid lg:grid-cols-12 gap-5">
          {/* Left: Create */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="px-4 sm:px-5 py-4 border-b border-slate-200 bg-white">
                <h3 className="font-extrabold text-slate-900">Create Notification</h3>
                <p className="text-sm text-slate-600 mt-1">
                  Fill details and publish to your list.
                </p>
              </div>

              <form onSubmit={createNotification} className="p-4 sm:p-5 space-y-4">
                <Field label="Title" hint="required">
                  <input
                    value={form.title}
                    onChange={onChange("title")}
                    className={inputClass}
                    placeholder="Eg. Safety meeting at 5 PM"
                    maxLength={120}
                  />
                </Field>

                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Date" hint="required">
                    <input type="date" value={form.notifyDate} onChange={onChange("notifyDate")} className={inputClass} />
                  </Field>

                  <Field label="Day" hint="auto">
                    <div className="h-[42px] flex items-center justify-between px-4 rounded-2xl border border-slate-200 bg-slate-50">
                      <span className="text-sm font-semibold text-slate-900">{day || "—"}</span>
                      <span className="text-xs text-slate-400">Auto</span>
                    </div>
                  </Field>
                </div>

                <Field label="Description" hint="required">
                  <textarea
                    value={form.description}
                    onChange={onChange("description")}
                    rows={5}
                    className={cn(inputClass, "py-3")}
                    placeholder="Write details…"
                    maxLength={2000}
                  />
                  <div className="mt-1 text-xs text-slate-600 flex justify-between">
                    <span className="text-slate-400">Keep it clear and actionable.</span>
                    <span className="text-slate-600">{(form.description || "").length}/2000</span>
                  </div>
                </Field>

                {error ? (
                  <div className="text-sm text-slate-900 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                    <span className="text-red-500 font-semibold">Error:</span>{" "}
                    <span className="text-slate-900">{error}</span>
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={saving}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl",
                    "bg-blue-600 text-white font-semibold disabled:opacity-60"
                  )}
                >
                  <FiPlus className="text-lg" />
                  {saving ? "Publishing..." : "Publish Notification"}
                </button>

                <div className="text-xs text-slate-400">
                  Tip: Use short title + clear description.
                </div>
              </form>
            </div>
          </div>

          {/* Right: List */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              {/* Toolbar */}
              <div className="px-4 sm:px-5 py-4 border-b border-slate-200 bg-white sticky top-[72px] md:top-0 z-10">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-slate-900">All Notifications</h3>
                      <p className="text-sm text-slate-600 mt-1">
                        Showing <span className="font-semibold text-slate-900">{filtered.length}</span> items
                      </p>
                    </div>

                    <div className="inline-flex rounded-2xl border border-slate-200 p-1 bg-slate-50 shrink-0">
                      <TabButton active={tab === "all"} onClick={() => setTab("all")}>All</TabButton>
                      <TabButton active={tab === "unread"} onClick={() => setTab("unread")}>Unread</TabButton>
                      <TabButton active={tab === "read"} onClick={() => setTab("read")}>Read</TabButton>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={cn(inputClass, "pl-10 pr-10")}
                        placeholder="Search title or description..."
                      />
                      {search ? (
                        <button
                          type="button"
                          onClick={() => setSearch("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          title="Clear"
                        >
                          <FiX />
                        </button>
                      ) : null}
                    </div>

                    <button
                      onClick={loadNotifications}
                      disabled={loading}
                      className={cn(
                        "inline-flex items-center justify-center gap-2 px-4 py-2 rounded-2xl border border-slate-200",
                        "bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-60 w-full sm:w-auto"
                      )}
                      type="button"
                    >
                      <FiRefreshCw className={loading ? "animate-spin" : ""} />
                      {loading ? "..." : "Refresh"}
                    </button>
                  </div>
                </div>
              </div>

              {/* List */}
              {filtered.length === 0 ? (
                <div className="p-8 text-center bg-white">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <FiBell />
                  </div>
                  <p className="mt-3 font-semibold text-slate-900">No notifications found</p>
                  <p className="text-sm text-slate-600 mt-1">Create a notification from the left panel.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {filtered.map((n) => (
                    <div key={n._id} className={cn("p-4 sm:p-5 group transition", !n.isRead ? "bg-slate-50" : "bg-white")}>
                      <div className="flex gap-3">
                        {/* status icon */}
                        <div className="mt-0.5">
                          <div
                            className={cn(
                              "w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center border border-slate-200 bg-white",
                              !n.isRead ? "text-blue-600" : "text-green-600"
                            )}
                            title={!n.isRead ? "Unread" : "Read"}
                          >
                            <span className="text-lg sm:text-xl">
                              {!n.isRead ? <FiCircle /> : <FiCheckCircle />}
                            </span>
                          </div>
                        </div>

                        {/* content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-extrabold text-slate-900 truncate max-w-[520px]">
                                  {n.title}
                                </h4>

                                {!n.isRead ? (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-600 text-white">
                                    NEW
                                  </span>
                                ) : (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                    READ
                                  </span>
                                )}

                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-600">
                                  {prettyDate(n.notifyDate)} • {n.day}
                                </span>
                              </div>

                              <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap leading-relaxed">
                                {n.description}
                              </p>
                            </div>

                            {/* desktop actions */}
                            <div className="hidden md:flex items-center gap-2 opacity-80 group-hover:opacity-100 transition shrink-0">
                              <button
                                onClick={() => toggleRead(n._id, n.isRead)}
                                className={cn(
                                  "px-3 py-2 rounded-2xl text-sm font-semibold border border-slate-200",
                                  "bg-white text-slate-600 hover:bg-slate-50"
                                )}
                                title={n.isRead ? "Mark unread" : "Mark read"}
                                type="button"
                              >
                                {n.isRead ? "Unread" : "Read"}
                              </button>

                              <button
                                onClick={() => deleteOne(n._id)}
                                className={cn(
                                  "px-3 py-2 rounded-2xl text-sm font-semibold border border-slate-200",
                                  "bg-white text-red-500 hover:bg-slate-50"
                                )}
                                title="Delete"
                                type="button"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>

                          {/* mobile actions */}
                          <div className="mt-3 flex md:hidden gap-2">
                            <button
                              onClick={() => toggleRead(n._id, n.isRead)}
                              className="flex-1 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold text-slate-600"
                              type="button"
                            >
                              {n.isRead ? "Mark Unread" : "Mark Read"}
                            </button>
                            <button
                              onClick={() => deleteOne(n._id)}
                              className="px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-red-500"
                              type="button"
                              title="Delete"
                            >
                              <FiTrash2 />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="text-xs text-slate-400 mt-3">
              Tip: Unread tab helps you quickly find fresh updates.
            </div>
          </div>
        </div>

        <Toast
          show={toast.show}
          type={toast.type}
          msg={toast.msg}
          onClose={() => setToast({ show: false, type: "info", msg: "" })}
        />
      </div>
    </div>
  );
}
