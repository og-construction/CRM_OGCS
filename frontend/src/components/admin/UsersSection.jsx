import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createSalesExecutive,
  fetchSalesExecutives,
} from "../../store/slices/authSlice";

const UsersSection = () => {
  const dispatch = useDispatch();
  const { error, salesExecutives, salesLoading } = useSelector(
    (state) => state.auth
  );

  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [govDocFile, setGovDocFile] = useState(null);

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

  useEffect(() => {
    dispatch(fetchSalesExecutives());
  }, [dispatch]);

  const handleChange = (e) => {
    setSuccessMsg("");
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setGovDocFile(file);
    setErrors((prev) => ({ ...prev, govDocFile: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const trim = (v) => (v || "").trim();
    const digits = (v) => (v || "").replace(/\D/g, "");
    const emailRegex = /^\S+@\S+\.\S+$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

    if (!trim(form.name)) newErrors.name = "Name is required.";
    else if (trim(form.name).length < 3)
      newErrors.name = "Name must be at least 3 characters.";

    if (!trim(form.email)) newErrors.email = "Email is required.";
    else if (!emailRegex.test(trim(form.email)))
      newErrors.email = "Invalid email format.";

    if (!trim(form.password)) newErrors.password = "Password is required.";
    else if (form.password.length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    if (digits(form.phone).length !== 10)
      newErrors.phone = "Phone must be 10 digits.";

    if (digits(form.altPhone).length !== 10)
      newErrors.altPhone = "Alternate phone must be 10 digits.";

    if (digits(form.aadhaar).length !== 12)
      newErrors.aadhaar = "Aadhaar must be 12 digits.";

    if (!panRegex.test(trim(form.pan)))
      newErrors.pan = "PAN format should be ABCDE1234F.";

    if (trim(form.permanentAddress).length < 10)
      newErrors.permanentAddress = "Permanent address too short.";

    if (trim(form.presentAddress).length < 10)
      newErrors.presentAddress = "Present address too short.";

    if (!govDocFile) newErrors.govDocFile = "Government document required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSuccessMsg("");

    if (!validateForm()) return;

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
    };

    const result = await dispatch(createSalesExecutive(payload));

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
      setErrors({});
      setShowForm(false);
      dispatch(fetchSalesExecutives());
    }
  };

  return (
    <div>
      {/* Page Header */}
      <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
        👥 Sales Executives Management
      </h1>

      {/* Main Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">

        {/* Top Bar */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Sales Executives
            </h2>
            <p className="text-xs text-slate-500">
              Create, manage and review OGCS CRM sales staff.
            </p>
          </div>

          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
          >
            {showForm ? "Close Form" : "+ Add Sales Executive"}
          </button>
        </div>

        {/* FORM */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 bg-slate-50/60 border border-slate-200 rounded-xl p-5 mb-5"
          >
            {/* Inputs */}
            {[
              { label: "Name", name: "name", type: "text" },
              { label: "Email", name: "email", type: "email" },
              { label: "Password", name: "password", type: "password" },
              { label: "Phone Number", name: "phone", type: "tel" },
              { label: "Alternate Phone", name: "altPhone", type: "tel" },
              { label: "Aadhaar Number", name: "aadhaar", type: "text" },
              { label: "PAN Number", name: "pan", type: "text" },
            ].map((field) => (
              <div key={field.name}>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  {field.label} <span className="text-red-500">*</span>
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
                    errors[field.name]
                      ? "border-red-400 focus:ring-red-400"
                      : "border-slate-300 focus:ring-sky-500"
                  }`}
                  placeholder={field.label}
                />
                {errors[field.name] && (
                  <p className="text-[11px] text-red-600 mt-1">
                    {errors[field.name]}
                  </p>
                )}
              </div>
            ))}

            {/* Permanent Address */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Permanent Address *
              </label>
              <textarea
                name="permanentAddress"
                value={form.permanentAddress}
                onChange={handleChange}
                rows={2}
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${
                  errors.permanentAddress
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-300 focus:ring-sky-500"
                }`}
                placeholder="Full permanent address"
              />
            </div>

            {/* Present Address */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Present Address *
              </label>
              <textarea
                name="presentAddress"
                value={form.presentAddress}
                onChange={handleChange}
                rows={2}
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${
                  errors.presentAddress
                    ? "border-red-400 focus:ring-red-400"
                    : "border-slate-300 focus:ring-sky-500"
                }`}
                placeholder="Current stay address"
              />
            </div>

            {/* Document Upload */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Government Document *
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className={`w-full border border-dashed rounded-lg p-3 text-xs cursor-pointer bg-white ${
                  errors.govDocFile ? "border-red-400" : "border-slate-300"
                }`}
              />
              {govDocFile && (
                <p className="text-xs text-slate-600 mt-1">
                  Selected: {govDocFile.name}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="md:col-span-2 lg:col-span-3 text-right">
              <button
                type="submit"
                className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Save Sales Executive
              </button>
            </div>
          </form>
        )}

        {successMsg && (
          <p className="text-sm text-emerald-600 mb-3">{successMsg}</p>
        )}
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        {/* TABLE */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">
            Total Sales Executives: {salesExecutives?.length || 0}
          </h3>

          {salesLoading ? (
            <p className="text-sm text-slate-500">Loading...</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left px-4 py-2">Name</th>
                    <th className="text-left px-4 py-2">Email</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Created</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {salesExecutives?.length > 0 ? (
                    salesExecutives.map((u) => (
                      <tr
                        key={u._id}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-4 py-2">{u.name}</td>
                        <td className="px-4 py-2">{u.email}</td>

                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              u.isActive !== false
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {u.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </td>

                        <td className="px-4 py-2 text-slate-600">
                          {u.createdAt
                            ? new Date(u.createdAt).toLocaleDateString()
                            : "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-4 text-slate-500"
                      >
                        No records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsersSection;
