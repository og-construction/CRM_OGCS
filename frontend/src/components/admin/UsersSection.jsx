// src/components/admin/UsersSection.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Trash2,
  Power,
  PowerOff,
  Users,
  Plus,
  RefreshCw,
  Upload,
} from "lucide-react";
import { useDispatch, useSelector, shallowEqual } from "react-redux";
import {
  createSalesExecutive,
  fetchSalesExecutives,
  toggleSalesExecutiveStatus,
  deleteSalesExecutive,
  clearError,
} from "../../store/slices/authSlice";

const cn = (...a) => a.filter(Boolean).join(" ");

const trim = (v) => (v || "").trim();
const digits = (v) => (v || "").replace(/\D/g, "");

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  return Number.isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString("en-IN");
};

const Banner = ({ type = "info", children }) => {
  const styles =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div
      className={cn(
        "mb-3 rounded-2xl border px-4 py-3",
        "text-xs sm:text-sm font-semibold",
        styles
      )}
    >
      {children}
    </div>
  );
};

const FieldLabel = ({ children }) => (
  <div className="mb-1 text-xs font-semibold text-slate-600">{children}</div>
);

const HelpText = ({ children }) => (
  <div className="mt-1 text-[11px] text-slate-400">{children}</div>
);

const TextInput = ({ error, className = "", ...props }) => (
  <input
    {...props}
    className={cn(
      "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none",
      "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
      "disabled:bg-slate-50 disabled:text-slate-400",
      error ? "border-red-300" : "border-slate-200",
      className
    )}
  />
);

const TextArea = ({ error, className = "", ...props }) => (
  <textarea
    {...props}
    className={cn(
      "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none",
      "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
      "disabled:bg-slate-50 disabled:text-slate-400",
      error ? "border-red-300" : "border-slate-200",
      className
    )}
  />
);

const Select = ({ error, className = "", ...props }) => (
  <select
    {...props}
    className={cn(
      "w-full rounded-xl border bg-white px-3 py-2 text-sm outline-none",
      "focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
      "disabled:bg-slate-50 disabled:text-slate-400",
      error ? "border-red-300" : "border-slate-200",
      className
    )}
  />
);

const ErrorText = ({ children }) =>
  children ? (
    <div className="mt-1 text-[11px] font-semibold text-red-600">{children}</div>
  ) : null;

const StatusPill = ({ active }) => (
  <span
    className={cn(
      "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] sm:text-xs font-bold",
      active ? "bg-emerald-100 text-emerald-800" : "bg-slate-200 text-slate-700"
    )}
  >
    {active ? "Active" : "Inactive"}
  </span>
);

const IconButton = ({
  children,
  variant = "slate",
  disabled,
  title,
  onClick,
  className = "",
}) => {
  const variants = {
    slate:
      "border-slate-200 bg-white text-slate-800 hover:bg-slate-50 disabled:opacity-50",
    primary:
      "border-slate-900 bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50",
    danger:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50",
    amber:
      "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 disabled:opacity-50",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 disabled:opacity-50",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2",
        "text-xs sm:text-sm font-extrabold transition",
        variants[variant],
        className
      )}
    >
      {children}
    </button>
  );
};

export default function UsersSection() {
  const dispatch = useDispatch();

  const { error, salesExecutives = [], salesLoading } = useSelector(
    (state) => state.auth,
    shallowEqual
  );

  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [govDocFile, setGovDocFile] = useState(null);
  const [sameAddress, setSameAddress] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    altPhone: "",
    aadhaar: "",
    pan: "",
    permanentAddress: "",
    presentAddress: "",
    jobStatus: "office",
  });

  const panUpper = useMemo(() => trim(form.pan).toUpperCase(), [form.pan]);

  useEffect(() => {
    dispatch(fetchSalesExecutives());
  }, [dispatch]);

  const handleChange = useCallback(
    (e) => {
      setSuccessMsg("");
      dispatch(clearError());

      const { name, value } = e.target;

      setForm((prev) => {
        const next = { ...prev, [name]: name === "pan" ? value.toUpperCase() : value };
        if (sameAddress && name === "permanentAddress") next.presentAddress = value;
        return next;
      });

      setErrors((prev) => ({ ...prev, [name]: "" }));
    },
    [dispatch, sameAddress]
  );

  const handleSameAddressToggle = useCallback((e) => {
    const checked = e.target.checked;
    setSameAddress(checked);

    setForm((prev) => ({
      ...prev,
      presentAddress: checked ? prev.permanentAddress : prev.presentAddress,
    }));

    if (checked) setErrors((prev) => ({ ...prev, presentAddress: "" }));
  }, []);

  const handleFileChange = useCallback(
    (e) => {
      dispatch(clearError());
      const file = e.target.files?.[0] || null;
      setGovDocFile(file);
      setErrors((prev) => ({ ...prev, govDocFile: "" }));
    },
    [dispatch]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!trim(form.name)) newErrors.name = "Name is required.";
    else if (trim(form.name).length < 3) newErrors.name = "Name must be at least 3 characters.";

    if (!trim(form.email)) newErrors.email = "Email is required.";
    else if (!emailRegex.test(trim(form.email))) newErrors.email = "Invalid email format.";

    if (!trim(form.password)) newErrors.password = "Password is required.";
    else if (String(form.password).length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    if (digits(form.phone).length !== 10) newErrors.phone = "Phone must be 10 digits.";

    if (trim(form.altPhone)) {
      if (digits(form.altPhone).length !== 10) newErrors.altPhone = "Alternate phone must be 10 digits.";
      if (digits(form.altPhone) === digits(form.phone))
        newErrors.altPhone = "Alternate phone cannot be same as phone.";
    }

    if (digits(form.aadhaar).length !== 12) newErrors.aadhaar = "Aadhaar must be 12 digits.";
    if (!panRegex.test(panUpper)) newErrors.pan = "PAN format should be ABCDE1234F.";

    if (trim(form.permanentAddress).length < 10) newErrors.permanentAddress = "Permanent address too short.";
    if (!sameAddress && trim(form.presentAddress).length < 10)
      newErrors.presentAddress = "Present address too short.";

    if (!["office", "remote"].includes(trim(form.jobStatus).toLowerCase())) {
      newErrors.jobStatus = "Job Status must be office or remote.";
    }

    if (!govDocFile) newErrors.govDocFile = "Government document required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, govDocFile, panUpper, sameAddress]);

  const handleCreate = useCallback(
    async (e) => {
      e.preventDefault();
      setSuccessMsg("");
      dispatch(clearError());

      if (!validateForm()) return;

      const fd = new FormData();
      fd.append("name", trim(form.name));
      fd.append("email", trim(form.email));
      fd.append("password", String(form.password));

      fd.append("phone", trim(form.phone));
      if (trim(form.altPhone)) fd.append("altPhone", trim(form.altPhone));

      fd.append("aadhaar", digits(form.aadhaar));
      fd.append("pan", panUpper);

      fd.append("permanentAddress", trim(form.permanentAddress));
      fd.append(
        "presentAddress",
        sameAddress ? trim(form.permanentAddress) : trim(form.presentAddress)
      );
      fd.append("jobStatus", trim(form.jobStatus).toLowerCase());
      if (govDocFile) fd.append("govDocFile", govDocFile);

      const result = await dispatch(createSalesExecutive(fd));

      if (createSalesExecutive.fulfilled.match(result)) {
        setSuccessMsg("Sales Executive created successfully.");

        setForm({
          name: "",
          email: "",
          password: "",
          phone: "",
          altPhone: "",
          aadhaar: "",
          pan: "",
          permanentAddress: "",
          presentAddress: "",
          jobStatus: "office",
        });
        setGovDocFile(null);
        setSameAddress(false);
        setErrors({});
        setShowForm(false);

        dispatch(fetchSalesExecutives());
        return;
      }

      if (createSalesExecutive.rejected.match(result)) {
        const payload = result.payload;
        if (payload?.errors && typeof payload.errors === "object") {
          setErrors((prev) => ({ ...prev, ...payload.errors }));
        }
      }
    },
    [dispatch, form, govDocFile, panUpper, sameAddress, validateForm]
  );

  const handleToggleActive = useCallback(
    async (u) => {
      dispatch(clearError());
      setSuccessMsg("");

      const next = u.isActive === false ? true : false;
      setActionLoadingId(u._id);

      const r = await dispatch(toggleSalesExecutiveStatus({ id: u._id, isActive: next }));
      setActionLoadingId(null);

      if (toggleSalesExecutiveStatus.fulfilled.match(r)) {
        setSuccessMsg(`Sales Executive ${next ? "Activated" : "Deactivated"} successfully.`);
        dispatch(fetchSalesExecutives());
      }
    },
    [dispatch]
  );

  const handleDelete = useCallback(
    async (u) => {
      dispatch(clearError());
      setSuccessMsg("");

      const ok = window.confirm(`Delete ${u.name}? This cannot be undone.`);
      if (!ok) return;

      setActionLoadingId(u._id);
      const r = await dispatch(deleteSalesExecutive(u._id));
      setActionLoadingId(null);

      if (deleteSalesExecutive.fulfilled.match(r)) {
        setSuccessMsg("Sales Executive deleted successfully.");
        dispatch(fetchSalesExecutives());
      }
    },
    [dispatch]
  );

  const sortedExecutives = useMemo(() => {
    const list = Array.isArray(salesExecutives) ? [...salesExecutives] : [];
    // active first, then latest created
    return list.sort((a, b) => {
      const aa = a?.isActive === false ? 0 : 1;
      const bb = b?.isActive === false ? 0 : 1;
      if (aa !== bb) return bb - aa;
      return new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0);
    });
  }, [salesExecutives]);

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
            <Users size={18} />
          </span>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 truncate">
              Sales Executives Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Create, manage and review OGCS CRM sales staff.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <IconButton
            variant="slate"
            onClick={() => dispatch(fetchSalesExecutives())}
            disabled={salesLoading}
            title="Refresh list"
          >
            <RefreshCw size={16} />
            Refresh
          </IconButton>

          <IconButton
            variant="primary"
            onClick={() => {
              setShowForm((v) => !v);
              setSuccessMsg("");
              dispatch(clearError());
            }}
            title={showForm ? "Close create form" : "Add Sales Executive"}
          >
            <Plus size={16} />
            {showForm ? "Close Form" : "Add Sales Executive"}
          </IconButton>
        </div>
      </div>

      {/* Alerts */}
      {successMsg ? <Banner type="success">{successMsg}</Banner> : null}
      {error ? (
        <Banner type="error">
          {typeof error === "string" ? error : error?.message || "Request failed"}
        </Banner>
      ) : null}

      {/* Form */}
      {showForm ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="mb-4 flex flex-col gap-1">
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              Create Sales Executive
            </div>
            <div className="text-xs sm:text-sm text-slate-500">
              Fill details and upload government document (image/pdf).
            </div>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            {/* ✅ Responsive: single column on mobile, 2 on md, 3 on xl */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <FieldLabel>
                    Name <span className="text-red-500">*</span>
                  </FieldLabel>
                  <TextInput
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Full name"
                    error={errors.name}
                  />
                  <ErrorText>{errors.name}</ErrorText>
                </div>

                <div>
                  <FieldLabel>
                    Email <span className="text-red-500">*</span>
                  </FieldLabel>
                  <TextInput
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="name@company.com"
                    error={errors.email}
                  />
                  <ErrorText>{errors.email}</ErrorText>
                </div>

                <div>
                  <FieldLabel>
                    Password <span className="text-red-500">*</span>
                  </FieldLabel>
                  <TextInput
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    error={errors.password}
                  />
                  <ErrorText>{errors.password}</ErrorText>
                </div>

                <div>
                  <FieldLabel>
                    Job Status <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Select
                    name="jobStatus"
                    value={form.jobStatus}
                    onChange={handleChange}
                    error={errors.jobStatus}
                  >
                    <option value="office">Office</option>
                    <option value="remote">Remote</option>
                  </Select>
                  <ErrorText>{errors.jobStatus}</ErrorText>
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <FieldLabel>
                    Phone <span className="text-red-500">*</span>
                  </FieldLabel>
                  <TextInput
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="10-digit mobile number"
                    error={errors.phone}
                    inputMode="numeric"
                  />
                  <ErrorText>{errors.phone}</ErrorText>
                </div>

                <div>
                  <FieldLabel>Alternate Phone</FieldLabel>
                  <TextInput
                    name="altPhone"
                    value={form.altPhone}
                    onChange={handleChange}
                    placeholder="Optional"
                    error={errors.altPhone}
                    inputMode="numeric"
                  />
                  <ErrorText>{errors.altPhone}</ErrorText>
                </div>

                <div>
                  <FieldLabel>
                    Aadhaar <span className="text-red-500">*</span>
                  </FieldLabel>
                  <TextInput
                    name="aadhaar"
                    value={form.aadhaar}
                    onChange={handleChange}
                    placeholder="12-digit Aadhaar"
                    error={errors.aadhaar}
                    inputMode="numeric"
                  />
                  <ErrorText>{errors.aadhaar}</ErrorText>
                </div>

                <div>
                  <FieldLabel>
                    PAN <span className="text-red-500">*</span>
                  </FieldLabel>
                  <TextInput
                    name="pan"
                    value={form.pan}
                    onChange={handleChange}
                    placeholder="ABCDE1234F"
                    error={errors.pan}
                    autoCapitalize="characters"
                  />
                  <HelpText>Auto-converts to uppercase.</HelpText>
                  <ErrorText>{errors.pan}</ErrorText>
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <FieldLabel>
                    Permanent Address <span className="text-red-500">*</span>
                  </FieldLabel>
                  <TextArea
                    rows={3}
                    name="permanentAddress"
                    value={form.permanentAddress}
                    onChange={handleChange}
                    placeholder="Full permanent address"
                    error={errors.permanentAddress}
                  />
                  <ErrorText>{errors.permanentAddress}</ErrorText>
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                  <input
                    id="sameAddress"
                    type="checkbox"
                    checked={sameAddress}
                    onChange={handleSameAddressToggle}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                  <label
                    htmlFor="sameAddress"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Present address is same
                  </label>
                </div>

                <div>
                  <FieldLabel>
                    Present Address{" "}
                    {!sameAddress ? <span className="text-red-500">*</span> : null}
                  </FieldLabel>
                  <TextArea
                    rows={3}
                    name="presentAddress"
                    value={form.presentAddress}
                    onChange={handleChange}
                    placeholder="Current stay address"
                    error={errors.presentAddress}
                    disabled={sameAddress}
                  />
                  <ErrorText>{errors.presentAddress}</ErrorText>
                </div>

                <div>
                  <FieldLabel>
                    Government Document <span className="text-red-500">*</span>
                  </FieldLabel>

                  <label
                    className={cn(
                      "mt-1 flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-dashed bg-white px-3 py-3",
                      "transition hover:bg-slate-50",
                      errors.govDocFile ? "border-red-300" : "border-slate-200"
                    )}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                        <Upload size={16} />
                        <span className="truncate">
                          {govDocFile ? govDocFile.name : "Upload image or PDF"}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">Accepted: image/*, .pdf</div>
                    </div>

                    <span className="rounded-xl bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      Browse
                    </span>

                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>

                  <ErrorText>{errors.govDocFile}</ErrorText>
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-[11px] text-slate-400">
                Tip: Aadhaar/PAN validation runs before submit.
              </div>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-extrabold text-white hover:bg-emerald-700 transition"
              >
                Save Sales Executive
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* List */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="text-base sm:text-lg font-extrabold text-slate-900">
              Sales Executives
            </div>
            <div className="text-xs text-slate-500">
              Total:{" "}
              <span className="font-bold text-slate-800">
                {sortedExecutives?.length || 0}
              </span>
            </div>
          </div>

          {salesLoading ? (
            <div className="text-sm font-semibold text-slate-500">Loading...</div>
          ) : null}
        </div>

        {/* ✅ Mobile cards (better spacing + compact actions) */}
        <div className="grid gap-3 md:hidden">
          {sortedExecutives?.length ? (
            sortedExecutives.map((u) => {
              const busy = actionLoadingId === u._id;
              const active = u.isActive !== false;

              return (
                <div
                  key={u._id || `${u.email}-${u.createdAt}`}
                  className="rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-extrabold text-slate-900">
                        {u.name}
                      </div>
                      <div className="truncate text-xs text-slate-500">{u.email}</div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill active={active} />
                        <span className="text-[11px] text-slate-500">
                          Created:{" "}
                          <span className="font-semibold text-slate-700">
                            {fmtDate(u.createdAt)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(u)}
                        disabled={busy}
                        className={cn(
                          "inline-flex items-center justify-center rounded-xl border px-3 py-2",
                          "text-xs font-bold transition disabled:opacity-50",
                          active
                            ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                            : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                        )}
                        title={active ? "Deactivate" : "Activate"}
                      >
                        {active ? <PowerOff size={16} /> : <Power size={16} />}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(u)}
                        disabled={busy}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-600">
              No records found.
            </div>
          )}
        </div>

        {/* ✅ Desktop table (sticky header + better overflow handling) */}
        <div className="hidden md:block">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full text-sm">
                <thead className="bg-slate-50 text-xs font-extrabold text-slate-600 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Email</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-left">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {sortedExecutives?.length ? (
                    sortedExecutives.map((u) => {
                      const busy = actionLoadingId === u._id;
                      const active = u.isActive !== false;

                      return (
                        <tr
                          key={u._id || `${u.email}-${u.createdAt}`}
                          className="hover:bg-slate-50/60"
                        >
                          <td className="px-4 py-3">
                            <div className="font-extrabold text-slate-900">{u.name}</div>
                            {u.phone ? (
                              <div className="text-xs text-slate-500">{u.phone}</div>
                            ) : null}
                          </td>

                          <td className="px-4 py-3 text-slate-700">{u.email}</td>

                          <td className="px-4 py-3">
                            <StatusPill active={active} />
                          </td>

                          <td className="px-4 py-3 text-slate-600">{fmtDate(u.createdAt)}</td>

                          <td className="px-4 py-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(u)}
                                disabled={busy}
                                className={cn(
                                  "inline-flex items-center gap-2 rounded-xl border px-3 py-2",
                                  "text-xs font-extrabold transition disabled:opacity-50",
                                  active
                                    ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                    : "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                )}
                                title={active ? "Deactivate" : "Activate"}
                              >
                                {active ? <PowerOff size={16} /> : <Power size={16} />}
                                {active ? "Deactivate" : "Activate"}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(u)}
                                disabled={busy}
                                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-extrabold text-red-700 hover:bg-red-100 transition disabled:opacity-50"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-10 text-center text-sm text-slate-600"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-2 text-[11px] text-slate-400">
            Tip: Mobile shows cards; desktop shows table. All actions stay identical.
          </div>
        </div>
      </div>
    </div>
  );
}