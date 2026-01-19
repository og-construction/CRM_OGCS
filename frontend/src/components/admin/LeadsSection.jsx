import React, { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const statusBadge = (status = "") => {
  const s = String(status).toLowerCase();
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold";
  if (s === "converted") return `${base} bg-green-100 text-green-800`;
  if (s === "closed") return `${base} bg-slate-200 text-slate-800`;
  if (s === "follow-up" || s === "followup") return `${base} bg-amber-100 text-amber-800`;
  if (s === "new") return `${base} bg-blue-100 text-blue-800`;
  return `${base} bg-slate-100 text-slate-700`;
};

const pill = (text) =>
  text ? (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
      {text}
    </span>
  ) : (
    <span className="text-slate-400">—</span>
  );

const fmtDate = (d) => {
  if (!d) return "—";
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const pickName = (maybeObj) => {
  if (!maybeObj) return "—";
  if (typeof maybeObj === "string") return "—"; // id only
  return maybeObj?.name || maybeObj?.fullName || "—";
};

export default function LeadsSection() {
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [source, setSource] = useState("All");

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

const fetchLeads = async () => {
  try {
    setLoading(true);
    setError("");

    const token = localStorage.getItem("token");

    // backend expects: /api/leads/my?status=&leadType=&search=
    const params = new URLSearchParams();
    params.set("status", status || "All");
    params.set("leadType", "All"); // you can add a leadType dropdown later
    params.set("search", q || "");

    const res = await fetch(`${API_BASE}/leads/my?${params.toString()}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Failed to load leads");

    // ✅ your backend returns { items: [...] }
    const list = Array.isArray(data?.items) ? data.items : [];
    setLeads(list);
  } catch (e) {
    setError(e.message || "Something went wrong");
  } finally {
    setLoading(false);
  }
};



  useEffect(() => {
  fetchLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [status, q]);


  const uniqueSources = useMemo(() => {
    const s = new Set(leads.map((l) => l?.source).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [leads]);

  const uniqueStatuses = useMemo(() => {
    const s = new Set(leads.map((l) => l?.status).filter(Boolean));
    return ["All", ...Array.from(s)];
  }, [leads]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return leads
      .filter((l) => {
        if (status !== "All" && l?.status !== status) return false;
        if (source !== "All" && l?.source !== source) return false;

        if (!query) return true;

        const hay = [
          l?.name,
          l?.company,
          l?.phone,
          l?.email,
          l?.city,
          l?.descriptionText,
          l?.description,
          l?.requirement,
          l?.status,
          l?.source,
          l?.leadType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return hay.includes(query);
      })
      .sort((a, b) => new Date(b?.updatedAt || 0) - new Date(a?.updatedAt || 0));
  }, [leads, q, status, source]);

  const openDrawer = (lead) => {
    setSelected(lead);
    setOpen(true);
  };

  const closeDrawer = () => {
    setOpen(false);
    setSelected(null);
  };

  return (
    <div className="min-h-[70vh] rounded-2xl bg-[#EFF6FF] p-4 md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Leads Management</h2>
          <p className="text-sm text-slate-600">Search, filter, and review leads quickly.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            onClick={fetchLeads}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Refresh
          </button>

          <button
            onClick={() => alert("Connect this to your Create Lead form/page")}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"
          >
            + New Lead
          </button>
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-slate-200 md:grid-cols-4">
        <div className="md:col-span-2">
          <label className="mb-1 block text-xs font-semibold text-slate-600">Search</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Name / Company / Phone / City / Description…"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            {uniqueStatuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Source</label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            {uniqueSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center justify-between border-b border-slate-200 p-3">
          <p className="text-sm text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filtered.length}</span> leads
          </p>
          {error ? (
            <span className="text-sm font-semibold text-red-600">{error}</span>
          ) : (
            <span className="text-sm text-slate-500">Updated: {fmtDate(leads?.[0]?.updatedAt)}</span>
          )}
        </div>

        {loading ? (
          <div className="p-6 text-sm text-slate-600">Loading leads…</div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-sm text-slate-600">No leads found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-4 py-3">Lead</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filtered.map((l) => (
                  <tr key={l._id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{l?.name || "—"}</div>
                      <div className="text-xs text-slate-600">{l?.company || "—"}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        {pill(l?.email)}
                        {pill(l?.leadType)}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{l?.phone || "—"}</div>
                      <div className="mt-2 flex gap-2">
                        <a
                          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          href={l?.phone ? `tel:${l.phone}` : undefined}
                          onClick={(e) => !l?.phone && e.preventDefault()}
                        >
                          Call
                        </a>
                        <a
                          className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                          href={l?.phone ? `https://wa.me/91${l.phone}` : undefined}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => !l?.phone && e.preventDefault()}
                        >
                          WhatsApp
                        </a>
                      </div>
                    </td>

                    <td className="px-4 py-3">{l?.city || "—"}</td>

                    <td className="px-4 py-3">
                      <div className="line-clamp-2 max-w-[260px] text-slate-800">
                        {l?.descriptionText || l?.description || l?.requirement || "—"}
                      </div>
                    </td>

                    <td className="px-4 py-3">{pill(l?.source)}</td>

                    <td className="px-4 py-3">
                      <span className={statusBadge(l?.status)}>{l?.status || "—"}</span>
                    </td>

                    <td className="px-4 py-3">{pickName(l?.assignedTo)}</td>

                    <td className="px-4 py-3">{fmtDate(l?.updatedAt)}</td>

                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => openDrawer(l)}
                          className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800"
                        >
                          View
                        </button>
                        <button
                          onClick={() => alert("Connect Edit Lead form")}
                          className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {open && selected ? (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={closeDrawer} />

          <div className="absolute right-0 top-0 h-full w-full max-w-[520px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 p-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{selected?.name || "Lead Details"}</h3>
                <p className="text-sm text-slate-600">{selected?.company || "—"}</p>
              </div>

              <button
                onClick={closeDrawer}
                className="rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="h-[calc(100%-64px)] overflow-y-auto p-4">
              <Section title="Basic Information">
                <GridRow label="Lead Type" value={selected?.leadType} />
                <GridRow label="Phone" value={selected?.phone} />
                <GridRow label="Email" value={selected?.email} />
                <GridRow label="City" value={selected?.city} />
                <GridRow label="Address" value={selected?.address} />
              </Section>

              <Section title="Description / Requirement">
                <div className="text-sm text-slate-700">
                  {selected?.descriptionText || selected?.description || selected?.requirement || "—"}
                </div>
              </Section>

              <Section title="Lead Management">
                <GridRow label="Source" value={selected?.source} />
                <GridRow label="Status" value={selected?.status} />
                <GridRow label="Assigned To" value={pickName(selected?.assignedTo)} />
              </Section>

              <Section title="Audit">
                <GridRow label="Created At" value={fmtDate(selected?.createdAt)} />
                <GridRow label="Updated At" value={fmtDate(selected?.updatedAt)} />
              </Section>

              <div className="mt-4 flex gap-2">
                <a
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                  href={selected?.phone ? `tel:${selected.phone}` : undefined}
                  onClick={(e) => !selected?.phone && e.preventDefault()}
                >
                  Call
                </a>
                <a
                  className="flex-1 rounded-xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-800 ring-1 ring-slate-200 hover:bg-slate-50"
                  href={selected?.phone ? `https://wa.me/91${selected.phone}` : undefined}
                  target="_blank"
                  rel="noreferrer"
                  onClick={(e) => !selected?.phone && e.preventDefault()}
                >
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="mb-3 text-sm font-bold text-slate-900">{title}</h4>
      {children}
    </div>
  );
}

function GridRow({ label, value }) {
  const show = value === 0 ? "0" : value;
  return (
    <div className="grid grid-cols-3 gap-3 py-2 text-sm">
      <div className="col-span-1 font-semibold text-slate-600">{label}</div>
      <div className="col-span-2 text-slate-800">{show ? String(show) : "—"}</div>
    </div>
  );
}
