// src/components/sales/Reports.jsx
import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "../../api/axiosClient";
import {
  FiBarChart2,
  FiUsers,
  FiFileText,
  FiPhoneCall,
  FiRefreshCw,
  FiSearch,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

const prettyDateTime = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleString();
};

const prettyDate = (v) => {
  if (!v) return "-";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString();
};

const toMoney = (v) => {
  const n = Number(v || 0);
  try {
    return n.toLocaleString(undefined, { style: "currency", currency: "INR" });
  } catch {
    return `₹${n.toFixed(2)}`;
  }
};

const StatCard = ({ title, value, icon: Icon, tone = "blue" }) => {
  const tones = {
    blue: "from-blue-600 to-indigo-600",
    emerald: "from-emerald-600 to-teal-600",
    rose: "from-rose-600 to-pink-600",
    amber: "from-amber-600 to-orange-600",
    slate: "from-slate-700 to-slate-900",
  };
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className={cn("absolute inset-0 opacity-[0.10] bg-gradient-to-br", tones[tone] || tones.blue)} />
      <div className="relative p-4 md:p-5 flex items-center gap-3">
        <div className={cn("w-11 h-11 rounded-2xl text-white flex items-center justify-center shadow-sm bg-gradient-to-br", tones[tone] || tones.blue)}>
          <Icon className="text-xl" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-600">{title}</div>
          <div className="text-xl font-extrabold text-slate-900 truncate">{value}</div>
        </div>
      </div>
    </div>
  );
};

const Pill = ({ children, tone = "slate" }) => {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-800 border-amber-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border", map[tone] || map.slate)}>
      {children}
    </span>
  );
};

const TableWrap = ({ title, subtitle, right, children }) => (
  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <div className="text-base font-extrabold text-slate-900">{title}</div>
        {subtitle ? <div className="text-sm text-slate-600 mt-1">{subtitle}</div> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
    <div className="p-0">{children}</div>
  </div>
);

const EmptyState = ({ title, desc }) => (
  <div className="p-10 text-center">
    <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600">
      <FiBarChart2 />
    </div>
    <div className="mt-3 font-extrabold text-slate-900">{title}</div>
    <div className="text-sm text-slate-600 mt-1">{desc}</div>
  </div>
);

const ErrorState = ({ message }) => (
  <div className="p-5">
    <div className="rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 px-4 py-3 flex items-start gap-2">
      <FiAlertTriangle className="mt-0.5" />
      <div className="text-sm font-semibold">{message}</div>
    </div>
  </div>
);

const LoadingBar = () => (
  <div className="p-5">
    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
      <div className="h-full w-2/3 bg-slate-300 animate-pulse rounded-full" />
    </div>
    <div className="mt-3 text-xs text-slate-500">Loading…</div>
  </div>
);

function useDebounce(value, delay = 350) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export default function Reports() {
  const [tab, setTab] = useState("overview"); // overview | leads | discussions | daily | quotes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Leads filters
  const [leadStatus, setLeadStatus] = useState("All");
  const [leadSearch, setLeadSearch] = useState("");

  // Discussions filters
  const [discPage, setDiscPage] = useState(1);
  const [discLimit, setDiscLimit] = useState(20);

  // Daily report filters
  const [drPage, setDrPage] = useState(1);
  const [drLimit, setDrLimit] = useState(20);
  const [drQ, setDrQ] = useState("");
  const [drDate, setDrDate] = useState("");

  // Quotes filters
  const [quoteType, setQuoteType] = useState(""); // "" | quotation | invoice
  const [quoteStatus, setQuoteStatus] = useState(""); // "" | pending | approved | rejected

  // Data
  const [leads, setLeads] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [discMeta, setDiscMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [dailyReports, setDailyReports] = useState([]);
  const [drMeta, setDrMeta] = useState({ page: 1, totalPages: 1, total: 0, limit: 20 });

  const [quotes, setQuotes] = useState([]);

  const debLeadSearch = useDebounce(leadSearch, 350);
  const debDrQ = useDebounce(drQ, 350);

  const fetchLeads = async () => {
    const res = await axiosClient.get("/leads/my", { params: { status: leadStatus, search: debLeadSearch } });
    setLeads(res.data?.items || []);
  };

  const fetchDiscussions = async () => {
    // ✅ adjust if your route path differs
    // Example route: /api/contact-discussions
    const res = await axiosClient.get("/contact-discussions", { params: { page: discPage, limit: discLimit } });
    setDiscussions(res.data?.data || []);
    const p = res.data?.pagination || {};
    setDiscMeta({
      page: p.page || discPage,
      limit: p.limit || discLimit,
      total: p.total || 0,
      totalPages: p.totalPages || 1,
    });
  };

  const fetchDailyReports = async () => {
    // Example route: /api/daily-reports
    const res = await axiosClient.get("/daily-reports", {
      params: { page: drPage, limit: drLimit, q: debDrQ, date: drDate },
    });
    setDailyReports(res.data?.data || []);
    const p = res.data?.pagination || {};
    setDrMeta({
      page: p.page || drPage,
      limit: p.limit || drLimit,
      total: p.total || 0,
      totalPages: p.totalPages || 1,
    });
  };

  const fetchQuotes = async () => {
    // ✅ sales endpoint: /quotes/my
    // ✅ admin endpoint: /quotes
    // We try my first, fallback to all (if 403/404)
    try {
      const res = await axiosClient.get("/quotes/my", { params: { type: quoteType || undefined } });
      setQuotes(res.data?.data || []);
    } catch (e) {
      const code = e?.response?.status;
      if (code === 403 || code === 404) {
        const res2 = await axiosClient.get("/quotes", {
          params: {
            type: quoteType || undefined,
            status: quoteStatus || undefined,
          },
        });
        setQuotes(res2.data?.data || []);
      } else {
        throw e;
      }
    }
  };

  const refresh = async () => {
    try {
      setError("");
      setLoading(true);

      if (tab === "overview") {
        await Promise.allSettled([fetchLeads(), fetchDiscussions(), fetchDailyReports(), fetchQuotes()]);
      } else if (tab === "leads") await fetchLeads();
      else if (tab === "discussions") await fetchDiscussions();
      else if (tab === "daily") await fetchDailyReports();
      else if (tab === "quotes") await fetchQuotes();
    } catch (e) {
      setError(e.response?.data?.message || "Failed to load reports data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  // re-fetch per filters
  useEffect(() => {
    if (tab === "leads") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadStatus, debLeadSearch]);

  useEffect(() => {
    if (tab === "discussions") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discPage, discLimit]);

  useEffect(() => {
    if (tab === "daily") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drPage, drLimit, debDrQ, drDate]);

  useEffect(() => {
    if (tab === "quotes") refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteType, quoteStatus]);

  // ----------- Summaries -----------
  const leadsSummary = useMemo(() => {
    const total = leads.length;
    const by = { New: 0, "Follow-Up": 0, Closed: 0, Converted: 0 };
    for (const l of leads) if (by[l.status] !== undefined) by[l.status]++;
    return { total, ...by };
  }, [leads]);

  const discussionSummary = useMemo(() => {
    const total = discMeta.total || discussions.length;
    const uniqueCompanies = new Set((discussions || []).map((d) => String(d.companyName || "").trim()).filter(Boolean)).size;
    const uniquePeople = new Set((discussions || []).map((d) => String(d.email || "").trim()).filter(Boolean)).size;
    return { total, uniqueCompanies, uniquePeople };
  }, [discussions, discMeta.total]);

  const dailySummary = useMemo(() => {
    const total = drMeta.total || dailyReports.length;
    const withAttachment = dailyReports.filter((r) => r.attachment?.url).length;
    const uniqueMembers = new Set(dailyReports.map((r) => r.memberName)).size;
    return { total, withAttachment, uniqueMembers };
  }, [dailyReports, drMeta.total]);

  const quoteSummary = useMemo(() => {
    const total = quotes.length;
    const pending = quotes.filter((q) => q.status === "pending").length;
    const approved = quotes.filter((q) => q.status === "approved").length;
    const rejected = quotes.filter((q) => q.status === "rejected").length;
    const totalAmount = quotes.reduce((s, q) => s + Number(q.totalAmount || 0), 0);
    return { total, pending, approved, rejected, totalAmount };
  }, [quotes]);

  return (
    <div className="p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Hero */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50 shadow-sm">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-blue-200/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="relative p-5 md:p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white flex items-center justify-center shadow-sm">
                <FiBarChart2 className="text-xl" />
              </div>
              <div>
                <div className="text-2xl font-extrabold text-slate-900">Reports Dashboard</div>
                <div className="text-sm text-slate-600 mt-1">
                  Leads • Contact Discussions • Daily Reports • Quotes (Quotation/Invoice)
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Pill tone="blue">Colorful • Professional</Pill>
                  <Pill tone="emerald">Fast Filters</Pill>
                  <Pill tone="amber">Live Insights</Pill>
                </div>
              </div>
            </div>

            <button
              onClick={refresh}
              disabled={loading}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border shadow-sm font-semibold",
                "border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-60"
              )}
            >
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex flex-wrap gap-2">
          <TopTab active={tab === "overview"} onClick={() => setTab("overview")}>
            Overview
          </TopTab>
          <TopTab active={tab === "leads"} onClick={() => setTab("leads")}>
            Leads
          </TopTab>
          <TopTab active={tab === "discussions"} onClick={() => setTab("discussions")}>
            Contact Discussions
          </TopTab>
          <TopTab active={tab === "daily"} onClick={() => setTab("daily")}>
            Daily Reports
          </TopTab>
          <TopTab active={tab === "quotes"} onClick={() => setTab("quotes")}>
            Quotes
          </TopTab>
        </div>

        {/* Error / Loading */}
        {error ? <div className="mt-4"><ErrorState message={error} /></div> : null}
        {loading ? <div className="mt-4"><LoadingBar /></div> : null}

        {/* Overview */}
        {tab === "overview" ? (
          <div className="mt-5 space-y-5">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Leads (Total)" value={leadsSummary.total} icon={FiUsers} tone="blue" />
              <StatCard title="Discussions (Total)" value={discussionSummary.total} icon={FiPhoneCall} tone="emerald" />
              <StatCard title="Daily Reports (Total)" value={dailySummary.total} icon={FiFileText} tone="amber" />
              <StatCard title="Quotes (Total)" value={quoteSummary.total} icon={FiBarChart2} tone="rose" />
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <TableWrap
                title="Leads Snapshot"
                subtitle="Latest leads and status distribution"
                right={<Pill tone="blue">New: {leadsSummary.New}</Pill>}
              >
                <div className="p-5 grid sm:grid-cols-2 gap-3">
                  <MiniStat label="New" value={leadsSummary.New} tone="blue" />
                  <MiniStat label="Follow-Up" value={leadsSummary["Follow-Up"]} tone="amber" />
                  <MiniStat label="Closed" value={leadsSummary.Closed} tone="slate" />
                  <MiniStat label="Converted" value={leadsSummary.Converted} tone="emerald" />
                </div>
              </TableWrap>

              <TableWrap
                title="Quotes Snapshot"
                subtitle="Pending vs Approved vs Rejected + Total value"
                right={<Pill tone="emerald">{toMoney(quoteSummary.totalAmount)}</Pill>}
              >
                <div className="p-5 grid sm:grid-cols-3 gap-3">
                  <MiniStat label="Pending" value={quoteSummary.pending} tone="amber" />
                  <MiniStat label="Approved" value={quoteSummary.approved} tone="emerald" />
                  <MiniStat label="Rejected" value={quoteSummary.rejected} tone="rose" />
                </div>
              </TableWrap>
            </div>

            <div className="grid lg:grid-cols-2 gap-5">
              <TableWrap
                title="Contact Discussions"
                subtitle="People and companies engaged"
                right={<Pill tone="emerald">Companies: {discussionSummary.uniqueCompanies}</Pill>}
              >
                <div className="p-5 grid sm:grid-cols-2 gap-3">
                  <MiniStat label="Unique Companies" value={discussionSummary.uniqueCompanies} tone="emerald" />
                  <MiniStat label="Unique Emails" value={discussionSummary.uniquePeople} tone="blue" />
                </div>
              </TableWrap>

              <TableWrap
                title="Daily Reports"
                subtitle="Attachments & members activity"
                right={<Pill tone="amber">Attachments: {dailySummary.withAttachment}</Pill>}
              >
                <div className="p-5 grid sm:grid-cols-2 gap-3">
                  <MiniStat label="Unique Members" value={dailySummary.uniqueMembers} tone="blue" />
                  <MiniStat label="With Attachment" value={dailySummary.withAttachment} tone="amber" />
                </div>
              </TableWrap>
            </div>
          </div>
        ) : null}

        {/* Leads */}
        {tab === "leads" ? (
          <div className="mt-5 space-y-5">
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard title="Total Leads" value={leadsSummary.total} icon={FiUsers} tone="blue" />
              <StatCard title="New" value={leadsSummary.New} icon={FiCheckCircle} tone="emerald" />
              <StatCard title="Follow-Up" value={leadsSummary["Follow-Up"]} icon={FiFilter} tone="amber" />
              <StatCard title="Converted" value={leadsSummary.Converted} icon={FiBarChart2} tone="rose" />
            </div>

            <TableWrap
              title="My Leads"
              subtitle="Filter by status and search"
              right={
                <>
                  <div className="relative w-64 hidden md:block">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={leadSearch}
                      onChange={(e) => setLeadSearch(e.target.value)}
                      placeholder="Search lead..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-200"
                    />
                  </div>
                  <select
                    value={leadStatus}
                    onChange={(e) => setLeadStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {["All", "New", "Follow-Up", "Closed", "Converted"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </>
              }
            >
              {leads.length === 0 ? (
                <EmptyState title="No leads" desc="No leads match your filters." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-left text-slate-600">
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">Company</th>
                        <th className="py-3 px-5">Phone</th>
                        <th className="py-3 px-5">City</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {leads.map((l) => (
                        <tr key={l._id} className="hover:bg-slate-50">
                          <td className="py-3 px-5 font-semibold text-slate-900">{l.name || "-"}</td>
                          <td className="py-3 px-5 text-slate-700">{l.company || "-"}</td>
                          <td className="py-3 px-5 text-slate-700">{l.phone || "-"}</td>
                          <td className="py-3 px-5 text-slate-700">{l.city || "-"}</td>
                          <td className="py-3 px-5">
                            <StatusBadge value={l.status} />
                          </td>
                          <td className="py-3 px-5 text-slate-600">{prettyDateTime(l.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableWrap>

            {/* Mobile search */}
            <div className="md:hidden">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Search lead..."
                  className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </div>
        ) : null}

        {/* Contact Discussions */}
        {tab === "discussions" ? (
          <div className="mt-5 space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard title="Total Discussions" value={discussionSummary.total} icon={FiPhoneCall} tone="emerald" />
              <StatCard title="Unique Companies" value={discussionSummary.uniqueCompanies} icon={FiBarChart2} tone="blue" />
              <StatCard title="Unique Emails" value={discussionSummary.uniquePeople} icon={FiUsers} tone="amber" />
            </div>

            <TableWrap
              title="Contact Discussions"
              subtitle="Paginated list (latest first)"
              right={
                <>
                  <select
                    value={discLimit}
                    onChange={(e) => {
                      setDiscPage(1);
                      setDiscLimit(Number(e.target.value));
                    }}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}/page
                      </option>
                    ))}
                  </select>

                  <Pager
                    page={discMeta.page}
                    totalPages={discMeta.totalPages}
                    onPrev={() => setDiscPage((p) => Math.max(p - 1, 1))}
                    onNext={() => setDiscPage((p) => Math.min(p + 1, discMeta.totalPages))}
                  />
                </>
              }
            >
              {discussions.length === 0 ? (
                <EmptyState title="No discussions" desc="No contact discussion records found." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-left text-slate-600">
                        <th className="py-3 px-5">Name</th>
                        <th className="py-3 px-5">Company</th>
                        <th className="py-3 px-5">Role</th>
                        <th className="py-3 px-5">Email</th>
                        <th className="py-3 px-5">Phone</th>
                        <th className="py-3 px-5">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {discussions.map((d) => (
                        <tr key={d._id} className="hover:bg-slate-50">
                          <td className="py-3 px-5 font-semibold text-slate-900">{d.name || "-"}</td>
                          <td className="py-3 px-5 text-slate-700">{d.companyName || "-"}</td>
                          <td className="py-3 px-5">
                            <Pill tone="emerald">{d.role || "-"}</Pill>
                          </td>
                          <td className="py-3 px-5 text-slate-700">{d.email || "-"}</td>
                          <td className="py-3 px-5 text-slate-700">{d.phone || "-"}</td>
                          <td className="py-3 px-5 text-slate-600">{prettyDateTime(d.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* Notes section (compact) */}
                  <div className="p-5 border-t border-slate-200 bg-white">
                    <div className="text-sm font-extrabold text-slate-900 mb-2">Latest Notes</div>
                    <div className="grid md:grid-cols-2 gap-3">
                      {discussions.slice(0, 4).map((d) => (
                        <div key={d._id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-bold text-slate-900 truncate">{d.name}</div>
                            <Pill tone="blue">{d.companyName || "Company"}</Pill>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">{prettyDateTime(d.createdAt)}</div>
                          <div className="text-sm text-slate-700 mt-2 line-clamp-3">
                            {d.discussionNote || "-"}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </TableWrap>
          </div>
        ) : null}

        {/* Daily Reports */}
        {tab === "daily" ? (
          <div className="mt-5 space-y-5">
            <div className="grid md:grid-cols-3 gap-4">
              <StatCard title="Total Reports" value={dailySummary.total} icon={FiFileText} tone="amber" />
              <StatCard title="With Attachment" value={dailySummary.withAttachment} icon={FiBarChart2} tone="blue" />
              <StatCard title="Unique Members" value={dailySummary.uniqueMembers} icon={FiUsers} tone="emerald" />
            </div>

            <TableWrap
              title="Daily Reports"
              subtitle="Search by member or report text, filter by date"
              right={
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                  <div className="relative w-full md:w-64">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={drQ}
                      onChange={(e) => {
                        setDrPage(1);
                        setDrQ(e.target.value);
                      }}
                      placeholder="Search reports..."
                      className="w-full pl-10 pr-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>

                  <input
                    type="date"
                    value={drDate}
                    onChange={(e) => {
                      setDrPage(1);
                      setDrDate(e.target.value);
                    }}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-amber-200"
                  />

                  <select
                    value={drLimit}
                    onChange={(e) => {
                      setDrPage(1);
                      setDrLimit(Number(e.target.value));
                    }}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-amber-200"
                  >
                    {[10, 20, 50, 100].map((n) => (
                      <option key={n} value={n}>
                        {n}/page
                      </option>
                    ))}
                  </select>

                  <Pager
                    page={drMeta.page}
                    totalPages={drMeta.totalPages}
                    onPrev={() => setDrPage((p) => Math.max(p - 1, 1))}
                    onNext={() => setDrPage((p) => Math.min(p + 1, drMeta.totalPages))}
                  />
                </div>
              }
            >
              {dailyReports.length === 0 ? (
                <EmptyState title="No daily reports" desc="Try changing date or search keyword." />
              ) : (
                <div className="divide-y divide-slate-100">
                  {dailyReports.map((r) => (
                    <div key={r._id} className="p-5 hover:bg-slate-50 transition">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="font-extrabold text-slate-900">{r.memberName || "-"}</div>
                            <Pill tone="amber">{r.reportDate || "-"}</Pill>
                            <Pill tone="slate">{(r.wordCount ?? "").toString()} words</Pill>
                            {r.attachment?.url ? <Pill tone="blue">Attachment</Pill> : <Pill tone="slate">No file</Pill>}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">Created: {prettyDateTime(r.createdAt)}</div>
                        </div>

                        {r.attachment?.url ? (
                          <a
                            href={r.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-blue-200 bg-blue-50 text-blue-800 font-semibold hover:bg-blue-100"
                          >
                            <FiFileText />
                            View Attachment
                          </a>
                        ) : null}
                      </div>

                      <div className="mt-3 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {r.reportText || "-"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TableWrap>
          </div>
        ) : null}

        {/* Quotes */}
        {tab === "quotes" ? (
          <div className="mt-5 space-y-5">
            <div className="grid md:grid-cols-4 gap-4">
              <StatCard title="Total Quotes" value={quoteSummary.total} icon={FiBarChart2} tone="rose" />
              <StatCard title="Pending" value={quoteSummary.pending} icon={FiFilter} tone="amber" />
              <StatCard title="Approved" value={quoteSummary.approved} icon={FiCheckCircle} tone="emerald" />
              <StatCard title="Total Value" value={toMoney(quoteSummary.totalAmount)} icon={FiFileText} tone="blue" />
            </div>

            <TableWrap
              title="Quotes / Invoices"
              subtitle="Sales: your quotes • Admin: all quotes (auto-fallback)"
              right={
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                  <select
                    value={quoteType}
                    onChange={(e) => setQuoteType(e.target.value)}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="">All Types</option>
                    <option value="quotation">Quotation</option>
                    <option value="invoice">Invoice</option>
                  </select>

                  <select
                    value={quoteStatus}
                    onChange={(e) => setQuoteStatus(e.target.value)}
                    className="px-3 py-2.5 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-rose-200"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              }
            >
              {quotes.length === 0 ? (
                <EmptyState title="No quotes" desc="No records found for selected filters." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr className="text-left text-slate-600">
                        <th className="py-3 px-5">Type</th>
                        <th className="py-3 px-5">Customer</th>
                        <th className="py-3 px-5">Company</th>
                        <th className="py-3 px-5">Project</th>
                        <th className="py-3 px-5">Total</th>
                        <th className="py-3 px-5">Status</th>
                        <th className="py-3 px-5">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {quotes
                        .filter((q) => (!quoteStatus ? true : q.status === quoteStatus))
                        .map((q) => (
                          <tr key={q._id} className="hover:bg-slate-50">
                            <td className="py-3 px-5">
                              <Pill tone={q.type === "invoice" ? "blue" : "emerald"}>
                                {(q.type || "-").toUpperCase()}
                              </Pill>
                            </td>
                            <td className="py-3 px-5 font-semibold text-slate-900">{q.customerName || "-"}</td>
                            <td className="py-3 px-5 text-slate-700">{q.companyName || "-"}</td>
                            <td className="py-3 px-5 text-slate-700">{q.projectName || "-"}</td>
                            <td className="py-3 px-5 font-extrabold text-slate-900">{toMoney(q.totalAmount)}</td>
                            <td className="py-3 px-5">
                              <QuoteStatus value={q.status} />
                            </td>
                            <td className="py-3 px-5 text-slate-600">{prettyDateTime(q.createdAt)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TableWrap>
          </div>
        ) : null}

        <div className="mt-5 text-xs text-slate-500">
          Note: If your API paths are different (example: <b>/api/contactdiscussion</b> etc.), just change the
          axios paths in this file (search “axiosClient.get(”).
        </div>
      </div>
    </div>
  );
}

/* ---------------- UI Components ---------------- */

function TopTab({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2.5 rounded-2xl border text-sm font-extrabold shadow-sm transition",
        active
          ? "bg-slate-900 text-white border-slate-900"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ value }) {
  const v = String(value || "");
  if (v === "New") return <Pill tone="blue">New</Pill>;
  if (v === "Follow-Up") return <Pill tone="amber">Follow-Up</Pill>;
  if (v === "Closed") return <Pill tone="slate">Closed</Pill>;
  if (v === "Converted") return <Pill tone="emerald">Converted</Pill>;
  return <Pill tone="slate">{v || "—"}</Pill>;
}

function QuoteStatus({ value }) {
  const v = String(value || "");
  if (v === "pending") return <Pill tone="amber">PENDING</Pill>;
  if (v === "approved") return <Pill tone="emerald">APPROVED</Pill>;
  if (v === "rejected") return <Pill tone="rose">REJECTED</Pill>;
  return <Pill tone="slate">{v || "—"}</Pill>;
}

function MiniStat({ label, value, tone = "blue" }) {
  const map = {
    blue: "border-blue-200 bg-blue-50 text-blue-900",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-900",
    amber: "border-amber-200 bg-amber-50 text-amber-900",
    rose: "border-rose-200 bg-rose-50 text-rose-900",
    slate: "border-slate-200 bg-slate-50 text-slate-900",
  };
  return (
    <div className={cn("rounded-2xl border p-4", map[tone] || map.blue)}>
      <div className="text-xs font-bold opacity-80">{label}</div>
      <div className="text-2xl font-extrabold mt-1">{value}</div>
    </div>
  );
}

function Pager({ page, totalPages, onPrev, onNext }) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={onPrev}
        disabled={page <= 1}
        className={cn(
          "p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        )}
        title="Previous"
      >
        <FiChevronLeft />
      </button>
      <div className="text-sm font-extrabold text-slate-800">
        {page} / {totalPages || 1}
      </div>
      <button
        type="button"
        onClick={onNext}
        disabled={page >= (totalPages || 1)}
        className={cn(
          "p-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40"
        )}
        title="Next"
      >
        <FiChevronRight />
      </button>
    </div>
  );
}
