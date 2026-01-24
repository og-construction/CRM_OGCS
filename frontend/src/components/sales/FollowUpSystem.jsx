// src/components/sales/FollowUpSystem.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import {
  fetchMyLeads,
  clearLeadsError,
  patchLeadInList,
  updateLeadFollowUp, // ✅ NEW thunk in leadsSlice.js
} from "../../store/slices/leadsSlice";

/* ================= helpers ================= */
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
  const dt = lead?.followUpDate; // ✅ using followUpDate
  if (!dt) return "Cool";
  const diffDays = Math.ceil((new Date(dt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 3) return "Hot";
  if (diffDays <= 10) return "Warm";
  return "Cool";
};

const tempTone = { Hot: "red", Warm: "amber", Cool: "sky" };

/* ================= tiny ui atoms ================= */
const TonePill = ({ tone = "slate", children }) => {
  const map = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${map[tone] || map.slate}`}>
      {children}
    </span>
  );
};

const ClickStatCard = ({ title, value, hint, tone = "slate", active, onClick }) => {
  const ring = {
    slate: "from-slate-50 to-white",
    sky: "from-sky-50 to-white",
    amber: "from-amber-50 to-white",
    red: "from-red-50 to-white",
    emerald: "from-emerald-50 to-white",
    violet: "from-violet-50 to-white",
    indigo: "from-indigo-50 to-white",
  }[tone];

  return (
    <button
      onClick={onClick}
      className={[
        "text-left rounded-3xl border p-4 shadow-sm transition active:scale-[0.99]",
        "bg-gradient-to-b",
        ring,
        active ? "border-slate-900 ring-2 ring-slate-200" : "border-slate-200 hover:shadow-md",
      ].join(" ")}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-600">{title}</p>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">{value}</p>
          {hint ? <p className="mt-2 text-[11px] text-slate-500 whitespace-normal break-words">{hint}</p> : null}
        </div>
        <TonePill tone={tone}>{title}</TonePill>
      </div>
    </button>
  );
};

const EmptyState = ({ title, desc }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
    <div className="mx-auto inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200">
      <span className="text-slate-700 text-lg">✓</span>
    </div>
    <p className="text-sm font-semibold text-slate-900 mt-3">{title}</p>
    <p className="text-xs text-slate-500 mt-1 whitespace-normal break-words">{desc}</p>
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
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
  const [nextDate, setNextDate] = useState(""); // datetime-local string
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

    // ✅ using followUpDate
    const base = leads.filter((l) => (l.status === "Follow-Up") && l.followUpDate);

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

  const statusTone = (st) => {
    if (st === "New") return "violet";
    if (st === "Follow-Up") return "sky";
    if (st === "Closed") return "slate";
    if (st === "Converted") return "emerald";
    return "slate";
  };

  const bucketMeta = (lead) => {
    if (!lead?.followUpDate) return null;
    const t = new Date(lead.followUpDate).getTime();
    const s = startOfToday();
    const e = endOfToday();
    if (t >= s && t <= e) return { label: "Today", tone: "amber" };
    if (t > e) return { label: "Upcoming", tone: "sky" };
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

    if (kind === "HOT") { setStatusTab("All"); setTempFilter("Hot"); }
    if (kind === "WARM") { setStatusTab("All"); setTempFilter("Warm"); }
    if (kind === "COOL") { setStatusTab("All"); setTempFilter("Cool"); }

    if (kind === "MANUAL") { setStatusTab("All"); setSourceFilter("Manual"); }
    if (kind === "IMPORTED") { setStatusTab("All"); setSourceFilter("Import"); }
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
    <div className="space-y-4 sm:space-y-5" style={{ background: "#EFF6FF", padding: 12, borderRadius: 16 }}>
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Quotation Follow-Up System
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-2 whitespace-normal break-words">
              Quotation Leads & Follow-Ups
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-normal break-words">
              Click any card to instantly filter (Total / Follow-Up / Hot / Cool / Manual / Imported).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <TonePill tone="slate">Allocated Leads: {counts.All}</TonePill>
            <button
              onClick={refresh}
              className="w-full sm:w-auto text-xs px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] shadow-sm"
              type="button"
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
      </div>

      {/* Clickable Stats */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ClickStatCard
          title="Total Leads"
          value={counts.All}
          hint="Click to view all"
          tone="indigo"
          active={statusTab === "All" && tempFilter === "All" && sourceFilter === "All"}
          onClick={() => setViewFromCard("TOTAL")}
        />
        <ClickStatCard
          title="Follow-Up"
          value={counts["Follow-Up"]}
          hint={`Today ${followUpBuckets.today.length} • Upcoming ${followUpBuckets.upcoming.length} • Overdue ${followUpBuckets.overdue.length}`}
          tone="sky"
          active={statusTab === "Follow-Up"}
          onClick={() => setViewFromCard("FOLLOWUP")}
        />
        <ClickStatCard
          title="Converted"
          value={counts.Converted}
          hint="Click to view converted"
          tone="emerald"
          active={statusTab === "Converted"}
          onClick={() => setViewFromCard("CONVERTED")}
        />
        <ClickStatCard
          title="Closed"
          value={counts.Closed}
          hint="Click to view closed"
          tone="slate"
          active={statusTab === "Closed"}
          onClick={() => setViewFromCard("CLOSED")}
        />
      </div>

      {/* Clickable Insights */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <ClickStatCard title="Manual" value={analytics.manual} hint="Created manually" tone="sky" active={sourceFilter === "Manual"} onClick={() => setViewFromCard("MANUAL")} />
        <ClickStatCard title="Imported" value={analytics.imported} hint="From JSON import" tone="violet" active={sourceFilter === "Import"} onClick={() => setViewFromCard("IMPORTED")} />
        <ClickStatCard title="🔥 Hot" value={analytics.hot} hint="Follow-up ≤ 3 days" tone="red" active={tempFilter === "Hot"} onClick={() => setViewFromCard("HOT")} />
        <ClickStatCard title="🌤 Warm" value={analytics.warm} hint="Follow-up ≤ 10 days" tone="amber" active={tempFilter === "Warm"} onClick={() => setViewFromCard("WARM")} />
        <ClickStatCard title="❄ Cool" value={analytics.cool} hint="Not urgent / not set" tone="sky" active={tempFilter === "Cool"} onClick={() => setViewFromCard("COOL")} />
        <ClickStatCard title="New" value={counts.New} hint="Fresh inquiry" tone="violet" active={statusTab === "New"} onClick={() => setViewFromCard("NEW")} />
      </div>

      {/* Leads List */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-white">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Leads</p>
                <p className="text-xs text-slate-500">
                  Showing <b className="text-slate-700">{filteredList.length}</b> lead(s)
                </p>
              </div>
              <TonePill tone="indigo">{activeViewLabel}</TonePill>
            </div>

            {/* Search + dropdowns */}
            <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3">
              <div className="flex-1">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search name, company, phone, email, city, source..."
                  className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400"
                />
              </div>

              <select value={tempFilter} onChange={(e) => setTempFilter(e.target.value)} className="w-full lg:w-48 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white">
                <option value="All">Temp: All</option>
                <option value="Hot">Temp: Hot</option>
                <option value="Warm">Temp: Warm</option>
                <option value="Cool">Temp: Cool</option>
              </select>

              <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="w-full lg:w-52 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white">
                <option value="All">Source: All</option>
                <option value="Manual">Source: Manual</option>
                <option value="Import">Source: Import</option>
              </select>

              <select value={sort} onChange={(e) => setSort(e.target.value)} className="w-full lg:w-56 border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white">
                <option value="created_desc">Newest Created</option>
                <option value="next_asc">Follow-Up (Earliest)</option>
                <option value="name_asc">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 bg-slate-50/40">
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
                  <div key={l._id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-slate-900 break-words">{l.name}</div>
                        <div className="mt-1 text-xs text-slate-600 break-words">{l.company || "-"} {l.city ? `• ${l.city}` : ""}</div>
                        <div className="mt-1 text-[11px] text-slate-500">
                          Source: <b className="text-slate-700">{l.source || "Manual"}</b>
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <TonePill tone={statusTone(st)}>{st}</TonePill>
                        {b ? <TonePill tone={b.tone}>{b.label}</TonePill> : null}
                        <TonePill tone={tempTone[temp]}>{temp}</TonePill>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-[11px] font-semibold text-slate-600">Follow-Up Date</div>
                        {l.followUpDate ? <span className="text-[11px] text-slate-500">{fromNow(l.followUpDate)}</span> : null}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
                        {l.followUpDate ? fmt(l.followUpDate) : "-"}
                      </div>
                      {l.followUpNotes ? (
                        <div className="mt-2 text-xs text-slate-600 whitespace-pre-wrap">{l.followUpNotes}</div>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => { setPicked(l); setNextDate(""); setFollowUpNotes(l.followUpNotes || ""); }}
                        disabled={btnLoadingId === l._id}
                        className="text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
                        type="button"
                      >
                        {btnLoadingId === l._id ? "..." : "Set"}
                      </button>

                      <button
                        onClick={() => onMarkClosed(l._id)}
                        disabled={btnLoadingId === l._id}
                        className="text-xs px-3 py-2 rounded-2xl bg-slate-900 text-white hover:bg-black disabled:opacity-60"
                        type="button"
                      >
                        {btnLoadingId === l._id ? "Closing..." : "Closed"}
                      </button>

                      <button
                        onClick={() => onMarkConverted(l._id)}
                        disabled={btnLoadingId === l._id}
                        className="text-xs px-3 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        type="button"
                      >
                        {btnLoadingId === l._id ? "Converting..." : "Won"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Follow-Up Modal */}
      {picked ? (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold text-slate-900">Set / Reschedule Follow-Up</h3>
                  <p className="text-xs text-slate-600 mt-1 break-words">
                    Lead: <span className="font-semibold text-slate-800">{picked.name}</span>
                    {picked.company ? ` • ${picked.company}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setPicked(null)}
                  disabled={btnLoadingId === picked._id}
                  className="shrink-0 text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
                  type="button"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Follow-Up Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={nextDate}
                  onChange={(e) => setNextDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Follow-Up Notes (optional)
                </label>
                <textarea
                  rows={3}
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400"
                  placeholder="What discussed / next steps..."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="text-xs text-slate-500">
                  Current: <span className="font-semibold">{fmt(picked.followUpDate)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPicked(null)}
                    disabled={btnLoadingId === picked._id}
                    className="w-full sm:w-auto text-xs px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSetFollowUp}
                    disabled={!nextDate || btnLoadingId === picked._id}
                    className="w-full sm:w-auto text-xs px-4 py-2 rounded-2xl bg-sky-600 text-white hover:bg-sky-700 disabled:opacity-60"
                    type="button"
                  >
                    {btnLoadingId === picked._id ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                Note: Saving a follow-up will automatically move the lead to <b>Follow-Up</b> status.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
