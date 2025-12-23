import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Card from "./Card";
import { fetchAdminOverview } from "../../store/slices/adminOverviewSlice";
import axiosClient from "../../api/axiosClient";

const money = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 });

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString();
};

const fmtDateTime = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleString();
};

const todayYmd = () => new Date().toISOString().slice(0, 10);

const ReportsSection = () => {
  const dispatch = useDispatch();

  const { stats, loading, error } = useSelector((s) => s.adminOverview, shallowEqual);

  // ---------------------------
  // Daily Reports (local state)
  // ---------------------------
  const [drLoading, setDrLoading] = useState(false);
  const [drError, setDrError] = useState(null);
  const [drData, setDrData] = useState(null); // {summary, reports}

  const [drDate, setDrDate] = useState("");      // YYYY-MM-DD
  const [drMember, setDrMember] = useState("");  // search name

  const loadDailyReports = async () => {
    try {
      setDrLoading(true);
      setDrError(null);

      const params = {};
      if (drDate) params.date = drDate;
      if (drMember.trim()) params.member = drMember.trim();

      const res = await axiosClient.get("/admin/daily-reports", { params });

      // expected:
      // { status:"success", data:{ summary:{...}, reports:[...] } }
      const payload = res.data?.data || null;
      setDrData(payload);
    } catch (e) {
      setDrError(e.response?.data?.message || e.message || "Failed to load daily reports");
      setDrData(null);
    } finally {
      setDrLoading(false);
    }
  };

  // Load overview once
  useEffect(() => {
    if (!stats) dispatch(fetchAdminOverview());
  }, [dispatch, stats]);

  // Load daily reports once
  useEffect(() => {
    loadDailyReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leads = stats?.leads;
  const week = stats?.quotes?.week;
  const topExecs = stats?.topSalesExecutivesThisWeek || [];
  const meta = stats?.meta;

  const statusRows = useMemo(() => Object.entries(leads?.statusBreakdown || {}), [leads]);

  const drSummary = drData?.summary;
  const drReports = drData?.reports || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">Reports & Analytics</h1>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => dispatch(fetchAdminOverview())}
            className="text-xs px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
          >
            Refresh Overview
          </button>

          <button
            type="button"
            onClick={loadDailyReports}
            className="text-xs px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
          >
            Refresh Daily Reports
          </button>
        </div>
      </div>

      {/* ---------------------------
          OVERVIEW REPORTS (NO CHARTS)
      ---------------------------- */}
      {loading ? (
        <p className="text-sm text-slate-500">Loading reports...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !stats ? (
        <p className="text-sm text-slate-500">No report data found.</p>
      ) : (
        <>
          {/* ✅ Summary cards */}
          <div className="grid gap-4 md:grid-cols-4 mb-4">
            <Card title="Total Leads">
              <div className="text-2xl font-bold text-slate-800">{leads?.totalLeads ?? 0}</div>
              <div className="text-xs text-slate-500 mt-1">
                New this week:{" "}
                <span className="font-semibold text-slate-700">{leads?.newLeadsThisWeek ?? 0}</span>
              </div>
            </Card>

            <Card title="Follow-ups Due">
              <div className="text-sm text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Today</span>
                  <span className="font-semibold">{leads?.followUpsDueToday ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>This Week</span>
                  <span className="font-semibold">{leads?.followUpsDueThisWeek ?? 0}</span>
                </div>
              </div>
            </Card>

            <Card title="Quotes This Week">
              <div className="text-sm text-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Created</span>
                  <span className="font-semibold">{week?.created ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Approved</span>
                  <span className="font-semibold">{week?.approved ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rejected</span>
                  <span className="font-semibold">{week?.rejected ?? 0}</span>
                </div>
              </div>
            </Card>

            <Card title="Approved Amount">
              <div className="text-2xl font-bold text-slate-800">₹{money(week?.approvedAmount ?? 0)}</div>
              <div className="text-xs text-slate-500 mt-1">
                Week start:{" "}
                <span className="font-semibold text-slate-700">{fmtDate(meta?.weekStart)}</span>
              </div>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* ✅ Leads breakdown table */}
            <Card title="Leads Status Breakdown">
              <div className="border border-slate-100 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Status</th>
                      <th className="px-3 py-2 text-right">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusRows.length === 0 ? (
                      <tr>
                        <td className="px-3 py-3 text-slate-500" colSpan={2}>
                          No status data.
                        </td>
                      </tr>
                    ) : (
                      statusRows.map(([k, v]) => (
                        <tr key={k} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-700">{k}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">{v}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-[11px] text-slate-500">
                Track pipeline health (New → Follow-Up → Converted).
              </p>
            </Card>

            {/* ✅ Top sales executives */}
            <Card title="Top Sales Executives This Week">
              {topExecs.length === 0 ? (
                <p className="text-xs text-slate-500">No weekly activity found.</p>
              ) : (
                <div className="border border-slate-100 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-right">Created</th>
                        <th className="px-3 py-2 text-right">Total Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topExecs.map((u) => (
                        <tr key={u.userId} className="border-t border-slate-100">
                          <td className="px-3 py-2 text-slate-700">
                            <div className="font-medium">{u.name}</div>
                            <div className="text-[11px] text-slate-500">{u.email}</div>
                          </td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">{u.created ?? 0}</td>
                          <td className="px-3 py-2 text-right font-semibold text-slate-800">₹{money(u.totalAmount ?? 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mt-2 text-[11px] text-slate-500">
                Ranking based on quotations/invoices created this week.
              </p>
            </Card>
          </div>

          <div className="mt-4 text-[11px] text-slate-500">
            Today range: {fmtDate(meta?.todayStart)} → {fmtDate(meta?.todayEnd)}
          </div>
        </>
      )}

      {/* ---------------------------
          DAILY REPORTS (NEW SECTION)
      ---------------------------- */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">Daily Reports</h2>

          <button
            type="button"
            onClick={() => {
              setDrDate(todayYmd());
              setDrMember("");
              // load after setting date (small timeout avoids stale state)
              setTimeout(loadDailyReports, 0);
            }}
            className="text-xs px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
          >
            Today
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3 mb-4">
          <Card title="Total Reports">
            <div className="text-2xl font-bold text-slate-800">{drSummary?.totalReports ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">All reports in current filter.</div>
          </Card>

          <Card title="Today Reports">
            <div className="text-2xl font-bold text-slate-800">{drSummary?.todayReports ?? 0}</div>
            <div className="text-xs text-slate-500 mt-1">Based on reportDate = today.</div>
          </Card>

          <Card title="Attachments / Members">
            <div className="text-sm text-slate-700 space-y-1">
              <div className="flex justify-between">
                <span>With attachment</span>
                <span className="font-semibold">{drSummary?.withAttachment ?? 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Unique members</span>
                <span className="font-semibold">{drSummary?.uniqueMembers ?? 0}</span>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Daily Reports List">
          {/* Filters */}
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between mb-3">
            <div className="flex gap-2 flex-wrap">
              <div>
                <div className="text-[11px] text-slate-500 mb-1">Date (YYYY-MM-DD)</div>
                <input
                  type="date"
                  value={drDate}
                  onChange={(e) => setDrDate(e.target.value)}
                  className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white"
                />
              </div>

              <div>
                <div className="text-[11px] text-slate-500 mb-1">Member</div>
                <input
                  type="text"
                  value={drMember}
                  onChange={(e) => setDrMember(e.target.value)}
                  placeholder="Search member name..."
                  className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white w-56"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={loadDailyReports}
                className="text-xs px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
              >
                Apply
              </button>
              <button
                type="button"
                onClick={() => {
                  setDrDate("");
                  setDrMember("");
                  setTimeout(loadDailyReports, 0);
                }}
                className="text-xs px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
              >
                Clear
              </button>
            </div>
          </div>

          {drLoading ? (
            <p className="text-xs text-slate-500">Loading daily reports...</p>
          ) : drError ? (
            <p className="text-xs text-red-600">{drError}</p>
          ) : drReports.length === 0 ? (
            <p className="text-xs text-slate-500">No daily reports found.</p>
          ) : (
            <div className="border border-slate-100 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left">Date</th>
                    <th className="px-3 py-2 text-left">Member</th>
                    <th className="px-3 py-2 text-right">Words</th>
                    <th className="px-3 py-2 text-left">Attachment</th>
                    <th className="px-3 py-2 text-left">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {drReports.map((r) => (
                    <tr key={r._id} className="border-t border-slate-100">
                      <td className="px-3 py-2 text-slate-700">{r.reportDate}</td>
                      <td className="px-3 py-2 text-slate-700">
                        <div className="font-medium">{r.memberName}</div>
                      </td>
                      <td className="px-3 py-2 text-right font-semibold text-slate-800">
                        {r.wordCount ?? 0}
                      </td>
                      <td className="px-3 py-2 text-slate-700">
                        {r.attachment?.url ? (
                          <a
                            href={r.attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-blue-700 hover:underline"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-600">{fmtDateTime(r.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-2 text-[11px] text-slate-500">
            Admin can filter by date and member name. Attachments open in a new tab.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default ReportsSection;