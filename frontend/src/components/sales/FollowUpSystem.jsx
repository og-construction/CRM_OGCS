// src/components/sales/FollowUpSystem.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchMyLeads,
  clearLeadsError,
  patchLeadInList,
  updateLeadFollowUp, // ✅ thunk
} from "../../store/slices/leadsSlice";

/**
 * ✅ Restricted palette only:
 * bg-slate-50, bg-white, bg-slate-100
 * text-slate-900, text-slate-600, text-slate-400
 * border-slate-200
 * blue-600, green-600, red-500, orange-500
 *
 * NOTE: Removed custom hex backgrounds & non-allowed colors.
 */

/* ================= helpers ================= */
const cn = (...a) => a.filter(Boolean).join(" ");

const fmt = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

const fromNow = (d) => {
  if (!d) return "";
  const ms = new Date(d).getTime() - Date.now();
  const mins = Math.round(ms / (1000 * 60));
  const abs = Math.abs(mins);

  if (abs < 60)
    return `${mins >= 0 ? "in " : ""}${abs} min${abs > 1 ? "s" : ""}${mins < 0 ? " ago" : ""}`;
  const hrs = Math.round(abs / 60);
  if (hrs < 24)
    return `${mins >= 0 ? "in " : ""}${hrs} hr${hrs > 1 ? "s" : ""}${mins < 0 ? " ago" : ""}`;
  const days = Math.round(hrs / 24);
  return `${mins >= 0 ? "in " : ""}${days} day${days > 1 ? "s" : ""}${mins < 0 ? " ago" : ""}`;
};

const getLeadTemperature = (lead) => {
  const dt = lead?.followUpDate; // ✅
  if (!dt) return "Cool";
  const diffDays = Math.ceil((new Date(dt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) return "Hot";
  if (diffDays <= 10) return "Warm";
  return "Cool";
};

/* ================= TINY UI ATOMS (restricted palette) ================= */

const TonePill = ({ tone = "slate", children }) => {
  // ✅ only allowed colors
  const map = {
    slate: "bg-slate-50 text-slate-600 border-slate-200",
    blue: "bg-slate-50 text-blue-600 border-slate-200",
    green: "bg-slate-50 text-green-600 border-slate-200",
    red: "bg-slate-50 text-red-500 border-slate-200",
    orange: "bg-slate-50 text-orange-500 border-slate-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border", map[tone] || map.slate)}>
      {children}
    </span>
  );
};

const ClickStatCard = ({ title, value, hint, tone = "slate", active, onClick }) => {
  const toneTop = {
    slate: "bg-slate-100",
    blue: "bg-slate-100",
    green: "bg-slate-100",
    red: "bg-slate-100",
    orange: "bg-slate-100",
  }[tone];

  const pillTone = tone;

  return (
    <button
      onClick={onClick}
      type="button"
      className={cn(
        "text-left rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 transition active:scale-[0.99]",
        active ? "ring-4 ring-slate-100" : "hover:bg-slate-50"
      )}
    >
      <div className={cn("h-1 rounded-full", toneTop)} />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600">{title}</p>
          <p className="mt-2 text-3xl sm:text-4xl font-extrabold text-slate-900">{value}</p>
          {hint ? <p className="mt-2 text-[11px] text-slate-400 whitespace-normal break-words">{hint}</p> : null}
        </div>
        <TonePill tone={pillTone}>{title}</TonePill>
      </div>
    </button>
  );
};

const EmptyState = ({ title, desc }) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-10 text-center">
    <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200">
      <span className="text-slate-600 text-lg">✓</span>
    </div>
    <p className="text-sm font-semibold text-slate-900 mt-3">{title}</p>
    <p className="text-xs text-slate-400 mt-1 whitespace-normal break-words">{desc}</p>
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="h-4 w-44 bg-slate-100 rounded" />
        <div className="mt-2 h-3 w-60 bg-slate-100 rounded" />
      </div>
      <div className="h-6 w-20 bg-slate-100 rounded-full" />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-2">
      <div className="h-14 bg-slate-50 border border-slate-200 rounded-2xl" />
      <div className="h-14 bg-slate-50 border border-slate-200 rounded-2xl" />
    </div>
    <div className="mt-3 h-10 bg-slate-100 rounded-2xl" />
  </div>
);

const MiniKV = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
    <div className="text-[11px] font-semibold text-slate-600">{label}</div>
    <div className="mt-1 text-sm font-semibold text-slate-900 break-words">{value}</div>
  </div>
);

const IconBtn = ({ children, onClick, disabled, title, variant = "ghost" }) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold transition active:scale-[0.99]";
  const map = {
    ghost: "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
    primary: "border-slate-200 bg-blue-600 text-white disabled:opacity-60",
    danger: "border-slate-200 bg-white text-red-500 hover:bg-slate-50 disabled:opacity-60",
    success: "border-slate-200 bg-green-600 text-white disabled:opacity-60",
  };
  return (
    <button type="button" title={title} onClick={onClick} disabled={disabled} className={cn(base, map[variant] || map.ghost)}>
      {children}
    </button>
  );
};

/* ================= component ================= */
export default function FollowUpSystem() {
  const dispatch = useDispatch();
  const { items: leads = [], loading, error } = useSelector((s) => s.leads);

  const [statusTab, setStatusTab] = useState("All");
  const [bucketTab, setBucketTab] = useState("today");
  const [rangeTab, setRangeTab] = useState("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("created_desc");

  const [tempFilter, setTempFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");

  const [picked, setPicked] = useState(null);
  const [nextDate, setNextDate] = useState(""); // datetime-local
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [btnLoadingId, setBtnLoadingId] = useState(null);

  useEffect(() => {
    dispatch(fetchMyLeads({ status: "All", leadType: "All", search: "", page: 1, limit: 200 }));
    return () => dispatch(clearLeadsError());
  }, [dispatch]);

  const refresh = () =>
    dispatch(fetchMyLeads({ status: "All", leadType: "All", search: "", page: 1, limit: 200 }));

  const counts = useMemo(() => {
    const c = { All: leads.length, New: 0, "Follow-Up": 0, Closed: 0, Converted: 0 };
    for (const l of leads) {
      const st = l.status || "New";
      if (c[st] !== undefined) c[st] += 1;
    }
    return c;
  }, [leads]);

  const analytics = useMemo(() => {
    let manual = 0,
      imported = 0,
      hot = 0,
      warm = 0,
      cool = 0;

    for (const l of leads) {
      const src = String(l.source || "").toLowerCase();
      if (src === "import") imported++;
      else manual++;

      const t = getLeadTemperature(l);
      if (t === "Hot") hot++;
      else if (t === "Warm") warm++;
      else cool++;
    }

    return { manual, imported, hot, warm, cool };
  }, [leads]);

  const followUpBuckets = useMemo(() => {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const base = leads.filter((l) => l.status === "Follow-Up" && l.followUpDate);

    const today = [];
    const upcoming = [];
    const overdue = [];

    for (const l of base) {
      const t = new Date(l.followUpDate).getTime();
      if (t >= todayStart && t <= todayEnd) today.push(l);
      else if (t > todayEnd) upcoming.push(l);
      else overdue.push(l);
    }

    today.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
    upcoming.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));
    overdue.sort((a, b) => new Date(a.followUpDate) - new Date(b.followUpDate));

    return { today, upcoming, overdue };
  }, [leads]);

  const filteredList = useMemo(() => {
    const query = String(q || "").trim().toLowerCase();

    let list =
      statusTab === "All"
        ? leads
        : leads.filter((l) => (l.status || "New") === statusTab);

    if (statusTab === "Follow-Up") {
      list =
        bucketTab === "today"
          ? followUpBuckets.today
          : bucketTab === "upcoming"
          ? followUpBuckets.upcoming
          : followUpBuckets.overdue;
    }

    if (rangeTab !== "all") {
      const map = { "15d": daysAgo(15), "1m": daysAgo(30), "2m": daysAgo(60), "3m": daysAgo(90) };
      const since = map[rangeTab];
      if (since) {
        list = list.filter((l) => l.followUpDate && new Date(l.followUpDate).getTime() >= since);
      }
    }

    if (tempFilter !== "All") list = list.filter((l) => getLeadTemperature(l) === tempFilter);

    if (sourceFilter !== "All") {
      list = list.filter((l) => {
        const src = String(l.source || "").toLowerCase();
        if (sourceFilter === "Import") return src === "import";
        return src !== "import";
      });
    }

    if (query) {
      list = list.filter((l) => {
        return (
          String(l.name || "").toLowerCase().includes(query) ||
          String(l.company || "").toLowerCase().includes(query) ||
          String(l.phone || "").toLowerCase().includes(query) ||
          String(l.email || "").toLowerCase().includes(query) ||
          String(l.city || "").toLowerCase().includes(query) ||
          String(l.source || "").toLowerCase().includes(query)
        );
      });
    }

    if (sort === "created_desc")
      list = [...list].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    if (sort === "next_asc")
      list = [...list].sort((a, b) => new Date(a.followUpDate || 0) - new Date(b.followUpDate || 0));
    if (sort === "name_asc")
      list = [...list].sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

    return list;
  }, [leads, statusTab, bucketTab, rangeTab, q, sort, followUpBuckets, tempFilter, sourceFilter]);

  const statusPillTone = (st) => {
    if (st === "New") return "orange";
    if (st === "Follow-Up") return "blue";
    if (st === "Closed") return "slate";
    if (st === "Converted") return "green";
    return "slate";
  };

  const tempPillTone = (t) => {
    if (t === "Hot") return "red";
    if (t === "Warm") return "orange";
    return "blue";
  };

  const bucketMeta = (lead) => {
    if (!lead?.followUpDate) return null;
    const t = new Date(lead.followUpDate).getTime();
    const s = startOfToday();
    const e = endOfToday();
    if (t >= s && t <= e) return { label: "Today", tone: "orange" };
    if (t > e) return { label: "Upcoming", tone: "blue" };
    return { label: "Overdue", tone: "red" };
  };

  const setViewFromCard = (kind) => {
    setQ("");
    setSort("created_desc");
    setRangeTab("all");
    setBucketTab("today");
    setTempFilter("All");
    setSourceFilter("All");

    if (kind === "TOTAL") setStatusTab("All");
    if (kind === "FOLLOWUP") setStatusTab("Follow-Up");
    if (kind === "NEW") setStatusTab("New");
    if (kind === "CLOSED") setStatusTab("Closed");
    if (kind === "CONVERTED") setStatusTab("Converted");

    if (kind === "HOT") {
      setStatusTab("All");
      setTempFilter("Hot");
    }
    if (kind === "WARM") {
      setStatusTab("All");
      setTempFilter("Warm");
    }
    if (kind === "COOL") {
      setStatusTab("All");
      setTempFilter("Cool");
    }

    if (kind === "MANUAL") {
      setStatusTab("All");
      setSourceFilter("Manual");
    }
    if (kind === "IMPORTED") {
      setStatusTab("All");
      setSourceFilter("Import");
    }
  };

  // ✅ SET follow-up
  const onSetFollowUp = async () => {
    if (!picked?._id) return toast.error("No lead selected");
    if (!nextDate) return toast.error("Please select date/time");

    setBtnLoadingId(picked._id);
    const toastId = toast.loading("Saving follow-up...");

    try {
      const updated = await dispatch(
        updateLeadFollowUp({
          id: picked._id,
          followUpDate: new Date(nextDate).toISOString(),
          followUpNotes: followUpNotes || "",
          status: "Follow-Up",
        })
      ).unwrap();

      dispatch(patchLeadInList(updated));
      toast.success("Follow-up saved ✅", { id: toastId });

      setPicked(null);
      setNextDate("");
      setFollowUpNotes("");
      setStatusTab("Follow-Up");
      refresh();
    } catch (e) {
      toast.error(String(e || "Failed to set follow-up"), { id: toastId });
    } finally {
      setBtnLoadingId(null);
    }
  };

  const onMarkClosed = async (id) => {
    setBtnLoadingId(id);
    const toastId = toast.loading("Closing lead...");
    try {
      const updated = await dispatch(updateLeadFollowUp({ id, status: "Closed" })).unwrap();
      dispatch(patchLeadInList(updated));
      toast.success("Lead closed ✅", { id: toastId });
      refresh();
    } catch (e) {
      toast.error(String(e || "Failed to close lead"), { id: toastId });
    } finally {
      setBtnLoadingId(null);
    }
  };

  const onMarkConverted = async (id) => {
    setBtnLoadingId(id);
    const toastId = toast.loading("Converting lead...");
    try {
      const updated = await dispatch(updateLeadFollowUp({ id, status: "Converted" })).unwrap();
      dispatch(patchLeadInList(updated));
      toast.success("Lead converted ✅", { id: toastId });
      refresh();
    } catch (e) {
      toast.error(String(e || "Failed to convert lead"), { id: toastId });
    } finally {
      setBtnLoadingId(null);
    }
  };

  const activeViewLabel = useMemo(() => {
    const parts = [];
    parts.push(`Status: ${statusTab}`);
    if (statusTab === "Follow-Up") parts.push(`Bucket: ${bucketTab}`);
    if (rangeTab !== "all") parts.push(`Range: ${rangeTab}`);
    if (tempFilter !== "All") parts.push(`Temp: ${tempFilter}`);
    if (sourceFilter !== "All") parts.push(`Source: ${sourceFilter}`);
    return parts.join(" • ");
  }, [statusTab, bucketTab, rangeTab, tempFilter, sourceFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 bg-slate-50 p-3 sm:p-4 lg:p-6 rounded-2xl">
      {/* ================= HEADER ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="h-1 bg-blue-600" />
        <div className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                Quotation Follow-Up System
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 break-words">
                Quotation Leads & Follow-Ups
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 break-words">
                Tap any card to filter (Total / Follow-Up / Hot / Manual / Imported).
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                <TonePill tone="slate">Allocated Leads: {counts.All}</TonePill>
                <TonePill tone="blue">View: {activeViewLabel}</TonePill>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <IconBtn onClick={refresh} title="Refresh" variant="ghost">
                Refresh
              </IconBtn>
            </div>
          </div>

          {error ? (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-red-500">
              {error}
            </div>
          ) : null}
        </div>
      </div>

      {/* ================= STATS ================= */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ClickStatCard
          title="Total Leads"
          value={counts.All}
          hint="Tap to view all"
          tone="blue"
          active={statusTab === "All" && tempFilter === "All" && sourceFilter === "All"}
          onClick={() => setViewFromCard("TOTAL")}
        />
        <ClickStatCard
          title="Follow-Up"
          value={counts["Follow-Up"]}
          hint={`Today ${followUpBuckets.today.length} • Upcoming ${followUpBuckets.upcoming.length} • Overdue ${followUpBuckets.overdue.length}`}
          tone="orange"
          active={statusTab === "Follow-Up"}
          onClick={() => setViewFromCard("FOLLOWUP")}
        />
        <ClickStatCard
          title="Converted"
          value={counts.Converted}
          hint="Tap to view converted"
          tone="green"
          active={statusTab === "Converted"}
          onClick={() => setViewFromCard("CONVERTED")}
        />
        <ClickStatCard
          title="Closed"
          value={counts.Closed}
          hint="Tap to view closed"
          tone="slate"
          active={statusTab === "Closed"}
          onClick={() => setViewFromCard("CLOSED")}
        />
      </div>

      {/* ================= INSIGHTS ================= */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <ClickStatCard title="Manual" value={analytics.manual} hint="Created manually" tone="blue" active={sourceFilter === "Manual"} onClick={() => setViewFromCard("MANUAL")} />
        <ClickStatCard title="Imported" value={analytics.imported} hint="From import" tone="orange" active={sourceFilter === "Import"} onClick={() => setViewFromCard("IMPORTED")} />
        <ClickStatCard title="Hot" value={analytics.hot} hint="Follow-up ≤ 3 days" tone="red" active={tempFilter === "Hot"} onClick={() => setViewFromCard("HOT")} />
        <ClickStatCard title="Warm" value={analytics.warm} hint="Follow-up ≤ 10 days" tone="orange" active={tempFilter === "Warm"} onClick={() => setViewFromCard("WARM")} />
        <ClickStatCard title="Cool" value={analytics.cool} hint="Not urgent / not set" tone="blue" active={tempFilter === "Cool"} onClick={() => setViewFromCard("COOL")} />
        <ClickStatCard title="New" value={counts.New} hint="Fresh inquiry" tone="orange" active={statusTab === "New"} onClick={() => setViewFromCard("NEW")} />
      </div>

      {/* ================= CONTROLS + LIST ================= */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-slate-900">Leads</p>
                <p className="text-xs text-slate-600">
                  Showing <b className="text-slate-900">{filteredList.length}</b> lead(s)
                </p>
              </div>
              <TonePill tone="slate">{activeViewLabel}</TonePill>
            </div>

            <div className="grid gap-2 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, company, phone, email, city, source..."
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white outline-none focus:ring-4 focus:ring-slate-100"
                />
              </div>

              <div className="lg:col-span-2">
                <select
                  value={tempFilter}
                  onChange={(e) => setTempFilter(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="All">Temp: All</option>
                  <option value="Hot">Temp: Hot</option>
                  <option value="Warm">Temp: Warm</option>
                  <option value="Cool">Temp: Cool</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <select
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="All">Source: All</option>
                  <option value="Manual">Source: Manual</option>
                  <option value="Import">Source: Import</option>
                </select>
              </div>

              <div className="lg:col-span-3">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white"
                >
                  <option value="created_desc">Newest Created</option>
                  <option value="next_asc">Follow-Up (Earliest)</option>
                  <option value="name_asc">Name (A-Z)</option>
                </select>
              </div>

              {/* Only show bucket/range when Follow-Up selected */}
              {statusTab === "Follow-Up" ? (
                <>
                  <div className="lg:col-span-3">
                    <select
                      value={bucketTab}
                      onChange={(e) => setBucketTab(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white"
                    >
                      <option value="today">Bucket: Today</option>
                      <option value="upcoming">Bucket: Upcoming</option>
                      <option value="overdue">Bucket: Overdue</option>
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <select
                      value={rangeTab}
                      onChange={(e) => setRangeTab(e.target.value)}
                      className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white"
                    >
                      <option value="all">Range: All</option>
                      <option value="15d">Last 15 days</option>
                      <option value="1m">Last 1 month</option>
                      <option value="2m">Last 2 months</option>
                      <option value="3m">Last 3 months</option>
                    </select>
                  </div>
                </>
              ) : null}
            </div>

            {/* Status Tabs (scrollable on mobile) */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {["All", "New", "Follow-Up", "Converted", "Closed"].map((st) => {
                const active = statusTab === st;
                const val = st === "All" ? counts.All : counts[st] || 0;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusTab(st)}
                    className={cn(
                      "whitespace-nowrap rounded-2xl border px-3 py-2 text-sm font-semibold transition",
                      active
                        ? "bg-slate-900 text-white border-slate-200"
                        : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    {st} <span className={cn("ml-1 text-xs", active ? "text-white" : "text-slate-600")}>({val})</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-50">
          {loading ? (
            <div className="grid gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : filteredList.length === 0 ? (
            <EmptyState title="No leads found" desc="Try changing filters or search keyword." />
          ) : (
            <div className="grid gap-3">
              {filteredList.map((l) => {
                const st = l.status || "New";
                const b = st === "Follow-Up" ? bucketMeta(l) : null;
                const temp = getLeadTemperature(l);

                return (
                  <div key={l._id} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm sm:text-base font-extrabold text-slate-900 break-words">
                          {l.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-600 break-words">
                          {l.company || "-"} {l.city ? `• ${l.city}` : ""}
                        </div>
                        <div className="mt-1 text-[11px] text-slate-400">
                          Source: <span className="font-semibold text-slate-600">{l.source || "Manual"}</span>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-wrap">
                        <TonePill tone={statusPillTone(st)}>{st}</TonePill>
                        {b ? <TonePill tone={b.tone}>{b.label}</TonePill> : null}
                        <TonePill tone={tempPillTone(temp)}>{temp}</TonePill>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <MiniKV
                        label="Follow-Up Date"
                        value={l.followUpDate ? fmt(l.followUpDate) : "-"}
                      />
                      <MiniKV
                        label="Relative"
                        value={l.followUpDate ? fromNow(l.followUpDate) : "-"}
                      />
                    </div>

                    {l.followUpNotes ? (
                      <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <div className="text-[11px] font-semibold text-slate-600">Notes</div>
                        <div className="mt-1 text-sm text-slate-900 whitespace-pre-wrap break-words">
                          {l.followUpNotes}
                        </div>
                      </div>
                    ) : null}

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <IconBtn
                        onClick={() => {
                          setPicked(l);
                          setNextDate("");
                          setFollowUpNotes(l.followUpNotes || "");
                        }}
                        disabled={btnLoadingId === l._id}
                        title="Set follow-up"
                        variant="ghost"
                      >
                        {btnLoadingId === l._id ? "..." : "Set Follow-Up"}
                      </IconBtn>

                      <IconBtn
                        onClick={() => onMarkClosed(l._id)}
                        disabled={btnLoadingId === l._id}
                        title="Mark closed"
                        variant="ghost"
                      >
                        {btnLoadingId === l._id ? "Closing..." : "Closed"}
                      </IconBtn>

                      <IconBtn
                        onClick={() => onMarkConverted(l._id)}
                        disabled={btnLoadingId === l._id}
                        title="Mark converted"
                        variant="success"
                      >
                        {btnLoadingId === l._id ? "Converting..." : "Won"}
                      </IconBtn>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ================= FOLLOW-UP MODAL (RESPONSIVE) ================= */}
      {picked ? (
        <Modal
          title="Set / Reschedule Follow-Up"
          subtitle={
            <>
              Lead: <span className="font-semibold text-slate-900">{picked.name}</span>
              {picked.company ? <span className="text-slate-600"> • {picked.company}</span> : null}
            </>
          }
          onClose={() => setPicked(null)}
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Follow-Up Date & Time</label>
              <input
                type="datetime-local"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-100"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">Follow-Up Notes (optional)</label>
              <textarea
                rows={4}
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-3 py-3 text-sm outline-none focus:ring-4 focus:ring-slate-100"
                placeholder="What discussed / next steps..."
              />
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
              Current: <span className="font-semibold text-slate-900">{fmt(picked.followUpDate)}</span>
              <div className="mt-1">
                Saving follow-up will set status to <b>Follow-Up</b>.
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2">
              <IconBtn
                onClick={() => setPicked(null)}
                disabled={btnLoadingId === picked._id}
                variant="ghost"
              >
                Cancel
              </IconBtn>

              <IconBtn
                onClick={onSetFollowUp}
                disabled={!nextDate || btnLoadingId === picked._id}
                variant="primary"
              >
                {btnLoadingId === picked._id ? "Saving..." : "Save"}
              </IconBtn>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

/* ================= Modal ================= */
/**
 * ✅ Responsive modal:
 * - Mobile: bottom-sheet feel
 * - Desktop: centered
 * Restricted palette only.
 */
function Modal({ title, subtitle, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/20"
      />
      <div className="absolute inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center p-2 sm:p-4">
        <div className="w-full sm:max-w-lg rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="h-1 bg-blue-600" />
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-white">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-base sm:text-lg font-extrabold text-slate-900 truncate">{title}</div>
                <div className="mt-1 text-xs sm:text-sm text-slate-600 break-words">{subtitle}</div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}
