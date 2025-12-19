import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "./Card";
import { fetchMyLeads, clearLeadsError } from "../../store/slices/leadsSlice";
import {
  updateMyFollowUp,
  clearFollowUpsError,
} from "../../store/slices/followUpsSlice";

/* ================= helpers ================= */
const fmt = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
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

const fromNow = (d) => {
  if (!d) return "";
  const ms = new Date(d).getTime() - Date.now();
  const mins = Math.round(ms / (1000 * 60));
  const abs = Math.abs(mins);

  if (abs < 60)
    return `${mins >= 0 ? "in " : ""}${abs} min${abs > 1 ? "s" : ""}${
      mins < 0 ? " ago" : ""
    }`;
  const hrs = Math.round(abs / 60);
  if (hrs < 24)
    return `${mins >= 0 ? "in " : ""}${hrs} hr${hrs > 1 ? "s" : ""}${
      mins < 0 ? " ago" : ""
    }`;
  const days = Math.round(hrs / 24);
  return `${mins >= 0 ? "in " : ""}${days} day${days > 1 ? "s" : ""}${
    mins < 0 ? " ago" : ""
  }`;
};

const Pill = ({ tone = "sky", children }) => {
  const map = {
    sky: "bg-sky-50 text-sky-700 border-sky-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    violet: "bg-violet-50 text-violet-700 border-violet-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
        map[tone] || map.sky
      }`}
    >
      {children}
    </span>
  );
};

const EmptyState = ({ title, desc }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200">
      <span className="text-slate-700 text-lg">✓</span>
    </div>
    <p className="text-sm font-semibold text-slate-900 mt-3">{title}</p>
    <p className="text-xs text-slate-500 mt-1">{desc}</p>
  </div>
);

const SkeletonCard = () => (
  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0 flex-1">
        <div className="h-4 w-40 bg-slate-100 rounded" />
        <div className="mt-2 h-3 w-56 bg-slate-100 rounded" />
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

export default function FollowUpSystem() {
  const dispatch = useDispatch();

  // ✅ ALL leads
  const { items: leads = [], loading, error } = useSelector((s) => s.leads);

  const [statusTab, setStatusTab] = useState("All"); // All | New | Follow-Up | Closed | Converted
  const [bucketTab, setBucketTab] = useState("today"); // today | upcoming | overdue
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("created_desc"); // created_desc | next_asc | name_asc

  const [picked, setPicked] = useState(null); // lead object
  const [nextDate, setNextDate] = useState("");

  useEffect(() => {
    dispatch(fetchMyLeads({ status: "All", search: "" }));
    return () => {
      dispatch(clearLeadsError());
      dispatch(clearFollowUpsError());
    };
  }, [dispatch]);

  const counts = useMemo(() => {
    const c = {
      All: leads.length,
      New: 0,
      "Follow-Up": 0,
      Closed: 0,
      Converted: 0,
    };
    for (const l of leads) {
      const st = l.status || "New";
      if (c[st] !== undefined) c[st] += 1;
    }
    return c;
  }, [leads]);

  // ✅ build follow-up buckets from ALL leads (client-side)
  const followUpBuckets = useMemo(() => {
    const todayStart = startOfToday();
    const todayEnd = endOfToday();

    const base = leads.filter((l) => l.status === "Follow-Up" && l.nextFollowUpAt);

    const today = [];
    const upcoming = [];
    const overdue = [];

    for (const l of base) {
      const t = new Date(l.nextFollowUpAt).getTime();
      if (t >= todayStart && t <= todayEnd) today.push(l);
      else if (t > todayEnd) upcoming.push(l);
      else overdue.push(l);
    }

    today.sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt));
    upcoming.sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt));
    overdue.sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt));

    return { today, upcoming, overdue };
  }, [leads]);

  const filteredList = useMemo(() => {
    const query = String(q || "").trim().toLowerCase();

    // status filter first
    let list =
      statusTab === "All"
        ? leads
        : leads.filter((l) => (l.status || "New") === statusTab);

    // if Follow-Up tab, apply bucket tab
    if (statusTab === "Follow-Up") {
      list =
        bucketTab === "today"
          ? followUpBuckets.today
          : bucketTab === "upcoming"
          ? followUpBuckets.upcoming
          : followUpBuckets.overdue;
    }

    // search
    if (query) {
      list = list.filter((l) => {
        return (
          String(l.name || "").toLowerCase().includes(query) ||
          String(l.company || "").toLowerCase().includes(query) ||
          String(l.phone || "").toLowerCase().includes(query) ||
          String(l.email || "").toLowerCase().includes(query) ||
          String(l.city || "").toLowerCase().includes(query)
        );
      });
    }

    // sort
    if (sort === "created_desc") {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
    }
    if (sort === "next_asc") {
      list = [...list].sort(
        (a, b) => new Date(a.nextFollowUpAt || 0) - new Date(b.nextFollowUpAt || 0)
      );
    }
    if (sort === "name_asc") {
      list = [...list].sort((a, b) =>
        String(a.name || "").localeCompare(String(b.name || ""))
      );
    }

    return list;
  }, [leads, statusTab, bucketTab, q, sort, followUpBuckets]);

  const refresh = () => dispatch(fetchMyLeads({ status: "All", search: "" }));

  const onSetFollowUp = async () => {
    if (!picked?._id || !nextDate) return;
    const r = await dispatch(updateMyFollowUp({ id: picked._id, nextFollowUpAt: nextDate }));
    if (updateMyFollowUp.fulfilled.match(r)) {
      setPicked(null);
      setNextDate("");
      refresh();
      setStatusTab("Follow-Up");
    }
  };

  const onMarkClosed = async (id) => {
    const r = await dispatch(updateMyFollowUp({ id, status: "Closed" }));
    if (updateMyFollowUp.fulfilled.match(r)) refresh();
  };

  const onMarkConverted = async (id) => {
    const r = await dispatch(updateMyFollowUp({ id, status: "Converted" }));
    if (updateMyFollowUp.fulfilled.match(r)) refresh();
  };

  const statusTone = (st) => {
    if (st === "New") return "violet";
    if (st === "Follow-Up") return "sky";
    if (st === "Closed") return "slate";
    if (st === "Converted") return "emerald";
    return "slate";
  };

  const bucketTone = (b) => (b === "today" ? "amber" : b === "upcoming" ? "sky" : "red");

  return (
    <div
      className="space-y-4 sm:space-y-5"
      style={{ background: "#EFF6FF", padding: 12, borderRadius: 16 }}
    >
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/90 backdrop-blur p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 whitespace-normal break-words">
              Leads & Follow-Ups
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 whitespace-normal break-words">
              First we load all leads, then you can filter by status and follow-up bucket.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <Pill tone="slate">Total Leads: {counts.All}</Pill>
            <button
              onClick={refresh}
              className="w-full sm:w-auto text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
            >
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}
      </div>

      {/* Summary */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="New">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{counts.New}</p>
            <Pill tone="violet">Fresh</Pill>
          </div>
        </Card>

        <Card title="Follow-Up">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{counts["Follow-Up"]}</p>
            <Pill tone="sky">Active</Pill>
          </div>
          <p className="text-xs text-slate-500 mt-2 whitespace-normal break-words">
            Today: <b>{followUpBuckets.today.length}</b> • Upcoming:{" "}
            <b>{followUpBuckets.upcoming.length}</b> • Overdue:{" "}
            <b>{followUpBuckets.overdue.length}</b>
          </p>
        </Card>

        <Card title="Closed">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{counts.Closed}</p>
            <Pill tone="slate">Done</Pill>
          </div>
        </Card>

        <Card title="Converted">
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold text-slate-900">{counts.Converted}</p>
            <Pill tone="emerald">Won</Pill>
          </div>
        </Card>
      </div>

      {/* List */}
      <Card title="Leads List">
        {/* Status Tabs (mobile scroll) */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
          {["All", "New", "Follow-Up", "Closed", "Converted"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusTab(st)}
              className={`shrink-0 text-xs px-3 py-2 rounded-2xl border transition ${
                statusTab === st
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {st}{" "}
              <span className="ml-1 opacity-90">
                ({st === "All" ? counts.All : counts[st]})
              </span>
            </button>
          ))}
        </div>

        {/* Follow-Up bucket tabs */}
        {statusTab === "Follow-Up" ? (
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-1 px-1">
            {[
              {
                key: "today",
                label: "Today",
                count: followUpBuckets.today.length,
              },
              {
                key: "upcoming",
                label: "Upcoming",
                count: followUpBuckets.upcoming.length,
              },
              {
                key: "overdue",
                label: "Overdue",
                count: followUpBuckets.overdue.length,
              },
            ].map((b) => (
              <button
                key={b.key}
                onClick={() => setBucketTab(b.key)}
                className={`shrink-0 text-xs px-3 py-2 rounded-2xl border transition ${
                  bucketTab === b.key
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {b.label} <span className="ml-1 opacity-90">({b.count})</span>
              </button>
            ))}
          </div>
        ) : null}

        {/* Search + Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-3 mb-3">
          <div className="flex-1">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, company, phone, email, city..."
              className="w-full border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400"
            />
          </div>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full lg:w-auto border border-slate-200 rounded-2xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400"
          >
            <option value="created_desc">Newest Created</option>
            <option value="next_asc">Next Follow-Up (Earliest)</option>
            <option value="name_asc">Name (A-Z)</option>
          </select>
        </div>

        {/* ✅ Mobile-first list (no cutting) */}
        {loading ? (
          <div className="grid gap-3">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        ) : filteredList.length === 0 ? (
          <EmptyState title="No leads found" desc="Try changing status tab or search keyword." />
        ) : (
          <>
            {/* Mobile cards */}
            <div className="grid gap-3 lg:hidden">
              {filteredList.map((l) => {
                const st = l.status || "New";
                const showBucket = st === "Follow-Up" && l.nextFollowUpAt;
                let bucketLabel = "";
                let tone = "sky";
                if (showBucket) {
                  const t = new Date(l.nextFollowUpAt).getTime();
                  const s = startOfToday();
                  const e = endOfToday();
                  if (t >= s && t <= e) {
                    bucketLabel = "Today";
                    tone = "amber";
                  } else if (t > e) {
                    bucketLabel = "Upcoming";
                    tone = "sky";
                  } else {
                    bucketLabel = "Overdue";
                    tone = "red";
                  }
                }

                return (
                  <div
                    key={l._id}
                    className={`rounded-3xl border p-4 bg-white shadow-sm ${
                      statusTab === "Follow-Up" && bucketTab === "overdue"
                        ? "border-red-200"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 whitespace-normal break-words">
                          {l.name}
                        </div>
                        <div className="mt-1 text-xs text-slate-600 whitespace-normal break-words">
                          {l.company || "-"} {l.city ? `• ${l.city}` : ""}
                        </div>
                      </div>

                      <div className="shrink-0 flex flex-col items-end gap-1">
                        <Pill tone={statusTone(st)}>{st}</Pill>
                        {showBucket ? <Pill tone={tone}>{bucketLabel}</Pill> : null}
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-[11px] font-semibold text-slate-600">Phone</div>
                        <div className="mt-1 text-sm font-medium text-slate-900 whitespace-normal break-all">
                          {l.phone || "-"}
                        </div>
                      </div>
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                        <div className="text-[11px] font-semibold text-slate-600">Email</div>
                        <div className="mt-1 text-sm font-medium text-slate-900 whitespace-normal break-all">
                          {l.email || "-"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 border border-slate-200 px-3 py-2">
                      <div className="text-[11px] font-semibold text-slate-600">Next Follow-Up</div>
                      <div className="mt-1 text-sm font-medium text-slate-900 whitespace-normal break-words">
                        {l.nextFollowUpAt ? fmt(l.nextFollowUpAt) : "-"}
                      </div>
                      {l.nextFollowUpAt ? (
                        <div className="mt-0.5 text-xs text-slate-500">{fromNow(l.nextFollowUpAt)}</div>
                      ) : null}
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        onClick={() => {
                          setPicked(l);
                          setNextDate("");
                        }}
                        className="text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
                      >
                        Set
                      </button>

                      <button
                        onClick={() => onMarkClosed(l._id)}
                        className="text-xs px-3 py-2 rounded-2xl bg-slate-900 text-white hover:bg-black active:scale-[0.99]"
                      >
                        Closed
                      </button>

                      <button
                        onClick={() => onMarkConverted(l._id)}
                        className="text-xs px-3 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.99]"
                      >
                        Won
                      </button>
                    </div>
                  </div>
                );
              })}

              <div className="px-1 text-xs text-slate-600">
                Showing <b className="text-slate-900">{filteredList.length}</b> lead(s) in{" "}
                <b className="text-slate-900">{statusTab}</b>
                {statusTab === "Follow-Up" ? (
                  <>
                    {" "}
                    • bucket <b className="text-slate-900">{bucketTab}</b>
                  </>
                ) : null}
                .
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-3xl bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-700">
                  <tr>
                    <th className="text-left px-3 py-3">Lead</th>
                    <th className="text-left px-3 py-3">Contact</th>
                    <th className="text-left px-3 py-3">Status</th>
                    <th className="text-left px-3 py-3">Next Follow-Up</th>
                    <th className="text-right px-3 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((l) => (
                    <tr
                      key={l._id}
                      className={`border-t border-slate-100 hover:bg-slate-50 ${
                        statusTab === "Follow-Up" && bucketTab === "overdue"
                          ? "bg-red-50/40"
                          : ""
                      }`}
                    >
                      <td className="px-3 py-3">
                        <div className="font-semibold text-slate-900">{l.name}</div>
                        <div className="text-xs text-slate-500">
                          {l.company || "-"} {l.city ? `• ${l.city}` : ""}
                        </div>
                      </td>

                      <td className="px-3 py-3">
                        <div className="text-slate-700">{l.phone || "-"}</div>
                        <div className="text-xs text-slate-500">{l.email || "-"}</div>
                      </td>

                      <td className="px-3 py-3">
                        <Pill tone={statusTone(l.status || "New")}>{l.status || "New"}</Pill>
                      </td>

                      <td className="px-3 py-3 text-slate-700">
                        <div>{l.nextFollowUpAt ? fmt(l.nextFollowUpAt) : "-"}</div>
                        {l.nextFollowUpAt ? (
                          <div className="text-xs text-slate-500">{fromNow(l.nextFollowUpAt)}</div>
                        ) : null}
                      </td>

                      <td className="px-3 py-3 text-right">
                        <div className="flex justify-end flex-wrap gap-2">
                          <button
                            onClick={() => {
                              setPicked(l);
                              setNextDate("");
                            }}
                            className="text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50"
                          >
                            Set Follow-Up
                          </button>

                          <button
                            onClick={() => onMarkClosed(l._id)}
                            className="text-xs px-3 py-2 rounded-2xl bg-slate-900 text-white hover:bg-black"
                          >
                            Closed
                          </button>

                          <button
                            onClick={() => onMarkConverted(l._id)}
                            className="text-xs px-3 py-2 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
                          >
                            Converted
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="px-3 py-3 border-t border-slate-100 text-xs text-slate-500">
                Showing <b className="text-slate-700">{filteredList.length}</b> lead(s) in{" "}
                <b className="text-slate-700">{statusTab}</b>
                {statusTab === "Follow-Up" ? (
                  <>
                    {" "}
                    • bucket <b className="text-slate-700">{bucketTab}</b>
                  </>
                ) : null}
                .
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal */}
      {picked ? (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center p-3 sm:p-4 z-50">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">
                    Set / Reschedule Follow-Up
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 whitespace-normal break-words">
                    Lead: <span className="font-semibold text-slate-800">{picked.name}</span>
                    {picked.company ? ` • ${picked.company}` : ""}
                  </p>
                </div>
                <button
                  onClick={() => setPicked(null)}
                  className="shrink-0 text-xs px-3 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Next Follow-Up Date & Time
              </label>
              <input
                type="datetime-local"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                className="w-full border border-slate-200 rounded-2xl px-3 py-3 text-sm focus:outline-none focus:ring-4 focus:ring-slate-100 focus:border-slate-400"
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-3">
                <div className="text-xs text-slate-500 whitespace-normal break-words">
                  Current: <span className="font-semibold">{fmt(picked.nextFollowUpAt)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPicked(null)}
                    className="w-full sm:w-auto text-xs px-4 py-2 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onSetFollowUp}
                    disabled={!nextDate}
                    className="w-full sm:w-auto text-xs px-4 py-2 rounded-2xl bg-sky-600 text-white hover:bg-sky-700 active:scale-[0.99] disabled:opacity-60"
                  >
                    Save
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 whitespace-normal break-words">
                Note: When you save a follow-up date, backend automatically sets status to{" "}
                <b>Follow-Up</b>.
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
