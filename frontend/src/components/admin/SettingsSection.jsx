// src/components/admin/SettingsSection.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import Card from "./Card";
import {
  fetchAdminSettings,
  saveAdminSettings,
  clearSaved,
} from "../../store/slices/adminSettingsSlice";

import {
  FiSettings,
  FiRefreshCw,
  FiSave,
  FiCheckCircle,
  FiAlertTriangle,
  FiSliders,
  FiBell,
  FiFileText,
  FiShield,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

const FieldLabel = ({ children }) => (
  <div className="text-xs font-semibold text-slate-600">{children}</div>
);

const HelpText = ({ children }) => (
  <div className="mt-1 text-[11px] text-slate-400">{children}</div>
);

const Input = (props) => (
  <input
    {...props}
    className={cn(
      "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
      "outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
      "disabled:bg-slate-50 disabled:text-slate-400",
      props.className
    )}
  />
);

const Select = (props) => (
  <select
    {...props}
    className={cn(
      "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm",
      "outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
      "disabled:bg-slate-50 disabled:text-slate-400",
      props.className
    )}
  />
);

const CheckboxRow = ({ checked, onChange, title, desc, disabled }) => (
  <label
    className={cn(
      "flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3",
      disabled ? "opacity-60" : "hover:bg-slate-50/70"
    )}
  >
    <input
      type="checkbox"
      checked={!!checked}
      onChange={onChange}
      disabled={disabled}
      className="mt-1 h-4 w-4 rounded border-slate-300"
    />
    <div className="min-w-0">
      <div className="text-sm font-semibold text-slate-800">{title}</div>
      {desc ? <div className="text-xs text-slate-500">{desc}</div> : null}
    </div>
  </label>
);

const Banner = ({ type = "success", children }) => {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-amber-200 bg-amber-50 text-amber-800";

  const Icon =
    type === "success" ? FiCheckCircle : type === "error" ? FiAlertTriangle : FiAlertTriangle;

  return (
    <div className={cn("mb-3 flex items-start gap-2 rounded-2xl border px-3 py-2 text-xs", styles)}>
      <Icon className="mt-0.5" />
      <div className="font-semibold">{children}</div>
    </div>
  );
};

export default function SettingsSection() {
  const dispatch = useDispatch();

  const { data, loading, saving, error, saveError, saved } = useSelector(
    (s) => s.adminSettings,
    shallowEqual
  );

  const [form, setForm] = useState(null);

  // load once
  useEffect(() => {
    dispatch(fetchAdminSettings());
  }, [dispatch]);

  // hydrate local form (only first time)
  useEffect(() => {
    if (data && !form) setForm(data);
  }, [data, form]);

  // auto-hide saved message
  useEffect(() => {
    if (!saved) return;
    const t = setTimeout(() => dispatch(clearSaved()), 2000);
    return () => clearTimeout(t);
  }, [saved, dispatch]);

  const disabled = loading || saving || !form;

  const onChange = (e) => {
    const { name, type, value, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const onListChange = (name, val) => {
    const arr = String(val || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
    setForm((p) => ({ ...p, [name]: arr }));
  };

  const leadSourcesText = useMemo(() => (form?.leadSources || []).join(", "), [form?.leadSources]);
  const leadStatusesText = useMemo(() => (form?.leadStatuses || []).join(", "), [form?.leadStatuses]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
              <FiSettings />
            </span>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">System Settings</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Configure leads, documents, approvals, and notifications.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => dispatch(fetchAdminSettings())}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs sm:text-sm font-bold text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw />
            Reload
          </button>

          <button
            type="button"
            onClick={save}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            <FiSave />
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* States */}
      {loading ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          Loading settings...
        </div>
      ) : error ? (
        <Banner type="error">{error}</Banner>
      ) : !form ? (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
          No settings loaded.
        </div>
      ) : (
        <>
          {saved ? <Banner type="success">Settings saved successfully</Banner> : null}
          {saveError ? <Banner type="error">{saveError}</Banner> : null}

          {/* Content grid */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Leads */}
            <Card title="Leads Settings">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    <FiSliders />
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">Leads</div>
                </div>

                <div>
                  <FieldLabel>Lead Sources</FieldLabel>
                  <Input
                    value={leadSourcesText}
                    onChange={(e) => onListChange("leadSources", e.target.value)}
                    placeholder="Manual, Website, Referral, WhatsApp, ..."
                    disabled={saving}
                  />
                  <HelpText>Comma-separated. Example: Manual, Referral, Website</HelpText>
                </div>

                <div>
                  <FieldLabel>Lead Statuses</FieldLabel>
                  <Input
                    value={leadStatusesText}
                    onChange={(e) => onListChange("leadStatuses", e.target.value)}
                    placeholder="New, Follow-Up, Closed, Converted"
                    disabled={saving}
                  />
                  <HelpText>Comma-separated. Keep values consistent across team.</HelpText>
                </div>

                <div>
                  <FieldLabel>Default Lead Status</FieldLabel>
                  <Select
                    name="defaultLeadStatus"
                    value={form.defaultLeadStatus || "New"}
                    onChange={onChange}
                    disabled={saving || !(form.leadStatuses || []).length}
                  >
                    {(form.leadStatuses || []).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </Card>

            {/* Quote/Invoice */}
            <Card title="Quotation & Invoice Settings">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    <FiFileText />
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">Documents</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Quotation Prefix</FieldLabel>
                    <Input
                      name="quotationPrefix"
                      value={form.quotationPrefix || ""}
                      onChange={onChange}
                      placeholder="QTN-"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <FieldLabel>Invoice Prefix</FieldLabel>
                    <Input
                      name="invoicePrefix"
                      value={form.invoicePrefix || ""}
                      onChange={onChange}
                      placeholder="INV-"
                      disabled={saving}
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Default Tax %</FieldLabel>
                    <Input
                      type="number"
                      name="defaultTaxPercent"
                      value={form.defaultTaxPercent ?? 0}
                      onChange={onChange}
                      min={0}
                      step="0.01"
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <FieldLabel>Currency</FieldLabel>
                    <Select
                      name="currency"
                      value={form.currency || "INR"}
                      onChange={onChange}
                      disabled={saving}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="AED">AED</option>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>

            {/* Approval & Limits */}
            <Card title="Approval & Limits">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    <FiShield />
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">Controls</div>
                </div>

                <CheckboxRow
                  checked={!!form.requireQuoteApproval}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, requireQuoteApproval: e.target.checked }))
                  }
                  title="Require admin approval for quotations/invoices"
                  desc="If enabled, sales team cannot finalize without admin action."
                  disabled={saving}
                />

                <div>
                  <FieldLabel>Max Quotes per Day (per Sales Executive)</FieldLabel>
                  <Input
                    type="number"
                    name="maxQuotesPerDay"
                    value={form.maxQuotesPerDay ?? 0}
                    onChange={onChange}
                    min={0}
                    step="1"
                    disabled={saving}
                  />
                  <HelpText>Use 0 for unlimited.</HelpText>
                </div>
              </div>
            </Card>

            {/* Notifications */}
            <Card title="Notifications">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700">
                    <FiBell />
                  </span>
                  <div className="text-sm font-extrabold text-slate-900">Alerts</div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <CheckboxRow
                    checked={!!form.emailNotifications}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, emailNotifications: e.target.checked }))
                    }
                    title="Enable email notifications"
                    desc="Master switch for emails."
                    disabled={saving}
                  />

                  <CheckboxRow
                    checked={!!form.notifyAdminOnQuote}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notifyAdminOnQuote: e.target.checked }))
                    }
                    title="Notify admin on new quote"
                    desc="Admin gets alert when quote is created."
                    disabled={saving}
                  />

                  <CheckboxRow
                    checked={!!form.notifySalesOnApproval}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, notifySalesOnApproval: e.target.checked }))
                    }
                    title="Notify sales on approval/rejection"
                    desc="Sales gets alert when admin approves/rejects."
                    disabled={saving}
                  />
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
