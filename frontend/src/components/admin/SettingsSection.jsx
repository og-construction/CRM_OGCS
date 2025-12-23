import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Card from "./Card";
import {
  fetchAdminSettings,
  saveAdminSettings,
  clearSaved,
} from "../../store/slices/adminSettingsSlice";

const SettingsSection = () => {
  const dispatch = useDispatch();
  const { data, loading, saving, error, saveError, saved } = useSelector(
    (s) => s.adminSettings
  );

  const [form, setForm] = useState(null);

  // load once
  useEffect(() => {
    dispatch(fetchAdminSettings());
  }, [dispatch]);

  // hydrate local form
  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  // auto-hide saved message
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => dispatch(clearSaved()), 2000);
    return () => clearTimeout(t);
  }, [saved, dispatch]);

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const onListChange = (name, val) => {
    // comma separated -> array
    const arr = val
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    setForm((p) => ({ ...p, [name]: arr }));
  };

  const leadSourcesText = useMemo(
    () => (form?.leadSources || []).join(", "),
    [form?.leadSources]
  );

  const leadStatusesText = useMemo(
    () => (form?.leadStatuses || []).join(", "),
    [form?.leadStatuses]
  );

  const save = () => {
    if (!form) return;
    const payload = {
      ...form,
      defaultTaxPercent: Number(form.defaultTaxPercent || 0),
      maxQuotesPerDay: Number(form.maxQuotesPerDay || 0),
    };
    dispatch(saveAdminSettings(payload));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-slate-800">System Settings</h1>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => dispatch(fetchAdminSettings())}
            className="text-xs px-3 py-1 rounded-md border border-slate-200 bg-white hover:bg-slate-50"
          >
            Reload
          </button>

          <button
            type="button"
            onClick={save}
            disabled={saving || loading || !form}
            className="text-xs px-3 py-1 rounded-md bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">Loading settings...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : !form ? (
        <p className="text-sm text-slate-500">No settings loaded.</p>
      ) : (
        <>
          {saved ? (
            <div className="mb-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
              ✅ Settings saved successfully
            </div>
          ) : null}

          {saveError ? (
            <div className="mb-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              ❌ {saveError}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <Card title="Leads Settings">
              <div className="space-y-3 text-sm">
                <div>
                  <label className="text-xs text-slate-500">Lead Sources (comma separated)</label>
                  <input
                    value={leadSourcesText}
                    onChange={(e) => onListChange("leadSources", e.target.value)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Lead Statuses (comma separated)</label>
                  <input
                    value={leadStatusesText}
                    onChange={(e) => onListChange("leadStatuses", e.target.value)}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">Default Lead Status</label>
                  <select
                    name="defaultLeadStatus"
                    value={form.defaultLeadStatus || "New"}
                    onChange={onChange}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  >
                    {(form.leadStatuses || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            <Card title="Quotation & Invoice Settings">
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Quotation Prefix</label>
                    <input
                      name="quotationPrefix"
                      value={form.quotationPrefix || ""}
                      onChange={onChange}
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">Invoice Prefix</label>
                    <input
                      name="invoicePrefix"
                      value={form.invoicePrefix || ""}
                      onChange={onChange}
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500">Default Tax %</label>
                    <input
                      type="number"
                      name="defaultTaxPercent"
                      value={form.defaultTaxPercent ?? 0}
                      onChange={onChange}
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-500">Currency</label>
                    <select
                      name="currency"
                      value={form.currency || "INR"}
                      onChange={onChange}
                      className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AED">AED</option>
                    </select>
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Approval & Limits">
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="requireQuoteApproval"
                    checked={!!form.requireQuoteApproval}
                    onChange={onChange}
                  />
                  Require admin approval for quotations/invoices
                </label>

                <div>
                  <label className="text-xs text-slate-500">Max Quotes per Day (per Sales Executive)</label>
                  <input
                    type="number"
                    name="maxQuotesPerDay"
                    value={form.maxQuotesPerDay ?? 0}
                    onChange={onChange}
                    className="mt-1 w-full rounded border border-slate-200 px-2 py-1"
                  />
                </div>
              </div>
            </Card>

            <Card title="Notifications">
              <div className="space-y-3 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={!!form.emailNotifications}
                    onChange={onChange}
                  />
                  Enable email notifications
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="notifyAdminOnQuote"
                    checked={!!form.notifyAdminOnQuote}
                    onChange={onChange}
                  />
                  Notify admin when new quote created
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="notifySalesOnApproval"
                    checked={!!form.notifySalesOnApproval}
                    onChange={onChange}
                  />
                  Notify sales executive on approval/rejection
                </label>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};

export default SettingsSection;
