// src/components/Notification.jsx
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
} from "react-icons/fi";

const empty = {
  title: "",
  description: "",
  notifyDate: "", // yyyy-mm-dd
};

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
  return d.toLocaleDateString();
};

const cn = (...a) => a.filter(Boolean).join(" ");

export default function Notification() {
  const [form, setForm] = useState(empty);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ show: false, type: "info", msg: "" });

  const [tab, setTab] = useState("all"); // all | unread | read
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
      setError(e2.response?.data?.message || "Failed to create notification");
      showToast("error", "Create failed");
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
      setError(e.response?.data?.message || "Failed to update status");
      showToast("error", "Update failed");
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
      setError(e.response?.data?.message || "Failed to delete");
      showToast("error", "Delete failed");
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

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Top banner */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-sm">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-indigo-200/40 blur-3xl" />

          <div className="relative p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                <FiBell className="text-xl" />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-slate-900">Notifications</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Create, manage and track updates for your CRM users.
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <StatPill label="Total" value={stats.total} />
                  <StatPill label="Unread" value={stats.unread} accent="blue" />
                  <StatPill label="Read" value={stats.read} accent="slate" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={loadNotifications}
                disabled={loading}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-semibold",
                  "border-slate-200 bg-white hover:bg-slate-50 shadow-sm disabled:opacity-60"
                )}
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} />
                {loading ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>
        </div>

        {/* Content grid */}
        <div className="grid lg:grid-cols-12 gap-5 mt-5">
          {/* Left: Form */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200">
                <h3 className="font-bold text-slate-900">Create Notification</h3>
                <p className="text-sm text-slate-600 mt-1">Fill details and publish to your list.</p>
              </div>

              <form onSubmit={createNotification} className="p-5">
                <div className="space-y-4">
                  <Field label="Title">
                    <input
                      value={form.title}
                      onChange={onChange("title")}
                      className={inputClass}
                      placeholder="Eg. Safety meeting at 5 PM"
                      maxLength={120}
                    />
                  </Field>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Date">
                      <input
                        type="date"
                        value={form.notifyDate}
                        onChange={onChange("notifyDate")}
                        className={inputClass}
                      />
                    </Field>

                    <Field label="Day">
                      <div className="h-[42px] flex items-center justify-between px-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-800">
                        <span className="text-sm font-semibold">{day || "—"}</span>
                        <span className="text-xs text-slate-500">Auto</span>
                      </div>
                    </Field>
                  </div>

                  <Field label="Description">
                    <textarea
                      value={form.description}
                      onChange={onChange("description")}
                      rows={5}
                      className={cn(inputClass, "py-3")}
                      placeholder="Write details…"
                      maxLength={2000}
                    />
                    <div className="mt-1 text-xs text-slate-500 flex justify-between">
                      <span>Keep it clear and actionable.</span>
                      <span>{(form.description || "").length}/2000</span>
                    </div>
                  </Field>

                  {error ? (
                    <div className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
                      {error}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={saving}
                    className={cn(
                      "w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl",
                      "bg-blue-600 text-white font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60"
                    )}
                  >
                    <FiPlus />
                    {saving ? "Publishing..." : "Publish Notification"}
                  </button>

                  <div className="text-xs text-slate-500">
                    Note: “Day” is calculated automatically in backend.
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Right: List */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Toolbar */}
              <div className="px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">All Notifications</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Showing <span className="font-semibold text-slate-900">{filtered.length}</span>{" "}
                    items
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative flex-1 md:w-72">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className={cn(inputClass, "pl-10")}
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

                  <div className="inline-flex rounded-2xl border border-slate-200 p-1 bg-slate-50">
                    <TabButton active={tab === "all"} onClick={() => setTab("all")}>
                      All
                    </TabButton>
                    <TabButton active={tab === "unread"} onClick={() => setTab("unread")}>
                      Unread
                    </TabButton>
                    <TabButton active={tab === "read"} onClick={() => setTab("read")}>
                      Read
                    </TabButton>
                  </div>
                </div>
              </div>

              {/* List */}
              {filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
                    <FiBell />
                  </div>
                  <p className="mt-3 font-semibold text-slate-800">No notifications found</p>
                  <p className="text-sm text-slate-600 mt-1">
                    Create a notification from the left panel.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filtered.map((n) => (
                    <div
                      key={n._id}
                      className={cn(
                        "p-5 group transition",
                        !n.isRead ? "bg-blue-50/40" : "bg-white"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="mt-1">
                          <div
                            className={cn(
                              "w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm",
                              !n.isRead
                                ? "bg-white border-blue-200 text-blue-700"
                                : "bg-white border-slate-200 text-slate-500"
                            )}
                            title={!n.isRead ? "Unread" : "Read"}
                          >
                            {!n.isRead ? <FiCircle /> : <FiCheckCircle />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-slate-900 truncate max-w-[520px]">
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

                              <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap leading-relaxed">
                                {n.description}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition">
                              <button
                                onClick={() => toggleRead(n._id, n.isRead)}
                                className={cn(
                                  "px-3 py-2 rounded-2xl text-sm font-semibold border shadow-sm",
                                  "border-slate-200 bg-white hover:bg-slate-50"
                                )}
                                title={n.isRead ? "Mark unread" : "Mark read"}
                              >
                                {n.isRead ? "Unread" : "Read"}
                              </button>

                              <button
                                onClick={() => deleteOne(n._id)}
                                className={cn(
                                  "px-3 py-2 rounded-2xl text-sm font-semibold border shadow-sm",
                                  "border-red-200 bg-white hover:bg-red-50 text-red-700"
                                )}
                                title="Delete"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile actions */}
                      <div className="mt-4 flex md:hidden gap-2">
                        <button
                          onClick={() => toggleRead(n._id, n.isRead)}
                          className="flex-1 px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-semibold"
                        >
                          {n.isRead ? "Mark Unread" : "Mark Read"}
                        </button>
                        <button
                          onClick={() => deleteOne(n._id)}
                          className="px-3 py-2 rounded-2xl border border-red-200 bg-white hover:bg-red-50 text-red-700"
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="text-xs text-slate-500 mt-3">
              Tip: Use “Unread” tab to quickly find new updates for your team.
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast.show ? (
          <div className="fixed bottom-5 right-5 z-50">
            <div
              className={cn(
                "px-4 py-3 rounded-2xl shadow-lg border text-sm font-semibold",
                toast.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
                toast.type === "error" && "bg-red-50 border-red-200 text-red-800",
                toast.type === "info" && "bg-slate-50 border-slate-200 text-slate-800"
              )}
            >
              {toast.msg}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* -------- Small UI helpers -------- */

const inputClass =
  "w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none " +
  "focus:ring-2 focus:ring-blue-200 focus:border-blue-300 transition placeholder:text-slate-400";

function Field({ label, children }) {
  return (
    <div>
      <label className="text-sm font-semibold text-slate-700">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StatPill({ label, value, accent = "blue" }) {
  const cls =
    accent === "blue"
      ? "bg-blue-600 text-white"
      : accent === "slate"
      ? "bg-slate-900 text-white"
      : "bg-slate-100 text-slate-800";

  return (
    <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold", cls)}>
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
        "px-3 py-2 rounded-2xl text-sm font-semibold transition",
        active ? "bg-white border border-slate-200 shadow-sm" : "text-slate-600 hover:text-slate-900"
      )}
    >
      {children}
    </button>
  );
}
