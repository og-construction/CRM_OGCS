import React, { useEffect, useMemo, useState } from "react";
import { Trash2, Power, PowerOff } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  createSalesExecutive,
  fetchSalesExecutives,
  toggleSalesExecutiveStatus,
  deleteSalesExecutive,
  clearError,
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

  // same address checkbox
  const [sameAddress, setSameAddress] = useState(false);

  // action loading for toggle/delete buttons
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

  useEffect(() => {
    dispatch(fetchSalesExecutives());
  }, [dispatch]);

  const trim = (v) => (v || "").trim();
  const digits = (v) => (v || "").replace(/\D/g, "");
  const panUpper = useMemo(() => trim(form.pan).toUpperCase(), [form.pan]);

  const handleChange = (e) => {
    setSuccessMsg("");
    dispatch(clearError());

    const { name, value } = e.target;

    setForm((prev) => {
      const next = {
        ...prev,
        [name]: name === "pan" ? value.toUpperCase() : value,
      };

      // if checkbox ON and permanent changes, keep present same
      if (sameAddress && name === "permanentAddress") {
        next.presentAddress = value;
      }

      return next;
    });

    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSameAddressToggle = (e) => {
    const checked = e.target.checked;
    setSameAddress(checked);

    setForm((prev) => ({
      ...prev,
      presentAddress: checked ? prev.permanentAddress : prev.presentAddress,
    }));

    if (checked) {
      setErrors((prev) => ({ ...prev, presentAddress: "" }));
    }
  };

  const handleFileChange = (e) => {
    dispatch(clearError());
    const file = e.target.files?.[0] || null;
    setGovDocFile(file);
    setErrors((prev) => ({ ...prev, govDocFile: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

    if (!trim(form.name)) newErrors.name = "Name is required.";
    else if (trim(form.name).length < 3)
      newErrors.name = "Name must be at least 3 characters.";

    if (!trim(form.email)) newErrors.email = "Email is required.";
    else if (!emailRegex.test(trim(form.email)))
      newErrors.email = "Invalid email format.";

    if (!trim(form.password)) newErrors.password = "Password is required.";
    else if (String(form.password).length < 6)
      newErrors.password = "Password must be at least 6 characters.";

    if (digits(form.phone).length !== 10)
      newErrors.phone = "Phone must be 10 digits.";

    if (trim(form.altPhone)) {
      if (digits(form.altPhone).length !== 10)
        newErrors.altPhone = "Alternate phone must be 10 digits.";
      if (digits(form.altPhone) === digits(form.phone))
        newErrors.altPhone = "Alternate phone cannot be same as phone.";
    }

    if (digits(form.aadhaar).length !== 12)
      newErrors.aadhaar = "Aadhaar must be 12 digits.";

    if (!panRegex.test(panUpper))
      newErrors.pan = "PAN format should be ABCDE1234F.";

    if (trim(form.permanentAddress).length < 10)
      newErrors.permanentAddress = "Permanent address too short.";

    if (!sameAddress) {
      if (trim(form.presentAddress).length < 10)
        newErrors.presentAddress = "Present address too short.";
    }

    if (!["office", "remote"].includes(trim(form.jobStatus).toLowerCase())) {
      newErrors.jobStatus = "Job Status must be office or remote.";
    }

    if (!govDocFile) newErrors.govDocFile = "Government document required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e) => {
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
  };

  // ✅ Activate / Deactivate
  const handleToggleActive = async (u) => {
    dispatch(clearError());
    setSuccessMsg("");

    const next = u.isActive === false ? true : false;

    setActionLoadingId(u._id);
    const r = await dispatch(
      toggleSalesExecutiveStatus({ id: u._id, isActive: next })
    );
    setActionLoadingId(null);

    if (toggleSalesExecutiveStatus.fulfilled.match(r)) {
      setSuccessMsg(`Sales Executive ${next ? "Activated" : "Deactivated"} successfully.`);
    }
  };

  // ✅ Delete
  const handleDelete = async (u) => {
    dispatch(clearError());
    setSuccessMsg("");

    const ok = window.confirm(`Delete ${u.name}? This cannot be undone.`);
    if (!ok) return;

    setActionLoadingId(u._id);
    const r = await dispatch(deleteSalesExecutive(u._id));
    setActionLoadingId(null);

    if (deleteSalesExecutive.fulfilled.match(r)) {
      setSuccessMsg("Sales Executive deleted successfully.");
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
            onClick={() => {
              setShowForm((prev) => !prev);
              setSuccessMsg("");
            }}
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
                  {field.label}{" "}
                  {field.name !== "altPhone" && (
                    <span className="text-red-500">*</span>
                  )}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${errors[field.name]
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

            {/* Job Status */}
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Job Status <span className="text-red-500">*</span>
              </label>
              <select
                name="jobStatus"
                value={form.jobStatus}
                onChange={handleChange}
                className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${errors.jobStatus
                  ? "border-red-400 focus:ring-red-400"
                  : "border-slate-300 focus:ring-sky-500"
                  }`}
              >
                <option value="office">Office</option>
                <option value="remote">Remote</option>
              </select>
              {errors.jobStatus && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.jobStatus}
                </p>
              )}
            </div>

            {/* Permanent Address */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Permanent Address <span className="text-red-500">*</span>
              </label>
              <textarea
                name="permanentAddress"
                value={form.permanentAddress}
                onChange={handleChange}
                rows={2}
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${errors.permanentAddress
                  ? "border-red-400 focus:ring-red-400"
                  : "border-slate-300 focus:ring-sky-500"
                  }`}
                placeholder="Full permanent address"
              />
              {errors.permanentAddress && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.permanentAddress}
                </p>
              )}
            </div>

            {/* Same Address Checkbox */}
            <div className="md:col-span-2 lg:col-span-3 flex items-center gap-2">
              <input
                id="sameAddress"
                type="checkbox"
                checked={sameAddress}
                onChange={handleSameAddressToggle}
                className="h-4 w-4 accent-sky-600"
              />
              <label htmlFor="sameAddress" className="text-sm text-slate-700">
                Present address is same as Permanent address
              </label>
            </div>

            {/* Present Address */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Present Address{" "}
                {!sameAddress && <span className="text-red-500">*</span>}
              </label>
              <textarea
                name="presentAddress"
                value={form.presentAddress}
                onChange={handleChange}
                rows={2}
                disabled={sameAddress}
                className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${errors.presentAddress
                  ? "border-red-400 focus:ring-red-400"
                  : "border-slate-300 focus:ring-sky-500"
                  } ${sameAddress ? "bg-slate-100 cursor-not-allowed" : ""}`}
                placeholder="Current stay address"
              />
              {errors.presentAddress && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.presentAddress}
                </p>
              )}
            </div>

            {/* Document Upload */}
            <div className="md:col-span-2 lg:col-span-3">
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Government Document <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className={`w-full border border-dashed rounded-lg p-3 text-xs cursor-pointer bg-white ${errors.govDocFile ? "border-red-400" : "border-slate-300"
                  }`}
              />
              {errors.govDocFile && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.govDocFile}
                </p>
              )}
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

        {error && (
          <p className="text-sm text-red-600 mb-3">
            {typeof error === "string"
              ? error
              : error?.message || "Request failed"}
          </p>
        )}

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
                    <th className="text-left px-4 py-2">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {salesExecutives?.length > 0 ? (
                    salesExecutives.map((u) => (
                      <tr
                        key={u._id || `${u.email}-${u.createdAt}`}
                        className="hover:bg-slate-50 transition"
                      >
                        <td className="px-4 py-2">{u.name}</td>
                        <td className="px-4 py-2">{u.email}</td>

                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive !== false
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-red-600"
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

                        <td className="px-4 py-2">
                          <div className="flex items-center gap-3">

                            {/* Activate / Deactivate */}
                            <button
                              onClick={() => handleToggleActive(u)}
                              disabled={actionLoadingId === u._id}
                              title={u.isActive !== false ? "Deactivate" : "Activate"}
                              className={`p-2 rounded-lg border transition disabled:opacity-50
                               ${u.isActive !== false
                                  ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                                  : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                                }`}
                            >
                              {u.isActive !== false ? (
                                <PowerOff size={16} />
                              ) : (
                                <Power size={16} />
                              )}
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDelete(u)}
                              disabled={actionLoadingId === u._id}
                              title="Delete"
                              className="p-2 rounded-lg border bg-red-50 text-red-700 border-red-200 hover:bg-red-100 transition disabled:opacity-50"
                            >
                              <Trash2 size={16} />
                            </button>

                          </div>
                        </td>

                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-slate-500">
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










































// import React, { useEffect, useMemo, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   createSalesExecutive,
//   fetchSalesExecutives,
//   clearError, // ✅ add this
// } from "../../store/slices/authSlice";

// const UsersSection = () => {
//   const dispatch = useDispatch();
//   const { error, salesExecutives, salesLoading } = useSelector(
//     (state) => state.auth
//   );

//   const [showForm, setShowForm] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");
//   const [errors, setErrors] = useState({});
//   const [govDocFile, setGovDocFile] = useState(null);

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     phone: "",
//     altPhone: "",
//     aadhaar: "",
//     pan: "",
//     permanentAddress: "",
//     presentAddress: "",
//     jobStatus: "office", // must match backend schema enum: office/remote
//   });

//   useEffect(() => {
//     dispatch(fetchSalesExecutives());
//   }, [dispatch]);

//   const trim = (v) => (v || "").trim();
//   const digits = (v) => (v || "").replace(/\D/g, "");
//   const panUpper = useMemo(() => trim(form.pan).toUpperCase(), [form.pan]);

//   const handleChange = (e) => {
//     setSuccessMsg("");
//     dispatch(clearError()); // ✅ clear redux errors on typing

//     const { name, value } = e.target;

//     setForm((prev) => ({
//       ...prev,
//       [name]: name === "pan" ? value.toUpperCase() : value,
//     }));

//     // clear local single field error
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const handleFileChange = (e) => {
//     dispatch(clearError()); // ✅ clear redux errors on file change
//     const file = e.target.files?.[0] || null;
//     setGovDocFile(file);
//     setErrors((prev) => ({ ...prev, govDocFile: "" }));
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

//     if (!trim(form.name)) newErrors.name = "Name is required.";
//     else if (trim(form.name).length < 3)
//       newErrors.name = "Name must be at least 3 characters.";

//     if (!trim(form.email)) newErrors.email = "Email is required.";
//     else if (!emailRegex.test(trim(form.email)))
//       newErrors.email = "Invalid email format.";

//     if (!trim(form.password)) newErrors.password = "Password is required.";
//     else if (String(form.password).length < 6)
//       newErrors.password = "Password must be at least 6 characters.";

//     if (digits(form.phone).length !== 10)
//       newErrors.phone = "Phone must be 10 digits.";

//     // altPhone optional
//     if (trim(form.altPhone)) {
//       if (digits(form.altPhone).length !== 10)
//         newErrors.altPhone = "Alternate phone must be 10 digits.";
//       if (digits(form.altPhone) === digits(form.phone))
//         newErrors.altPhone = "Alternate phone cannot be same as phone.";
//     }

//     if (digits(form.aadhaar).length !== 12)
//       newErrors.aadhaar = "Aadhaar must be 12 digits.";

//     if (!panRegex.test(panUpper))
//       newErrors.pan = "PAN format should be ABCDE1234F.";

//     if (trim(form.permanentAddress).length < 10)
//       newErrors.permanentAddress = "Permanent address too short.";

//     if (trim(form.presentAddress).length < 10)
//       newErrors.presentAddress = "Present address too short.";

//     if (!["office", "remote"].includes(trim(form.jobStatus).toLowerCase())) {
//       newErrors.jobStatus = "Job Status must be office or remote.";
//     }

//     if (!govDocFile) newErrors.govDocFile = "Government document required.";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setSuccessMsg("");
//     dispatch(clearError()); // ✅ clear old redux errors before submit

//     if (!validateForm()) return;

//     const fd = new FormData();
//     fd.append("name", trim(form.name));
//     fd.append("email", trim(form.email));
//     fd.append("password", String(form.password));

//     fd.append("phone", trim(form.phone));
//     if (trim(form.altPhone)) fd.append("altPhone", trim(form.altPhone));

//     fd.append("aadhaar", digits(form.aadhaar));
//     fd.append("pan", panUpper);

//     fd.append("permanentAddress", trim(form.permanentAddress));
//     fd.append("presentAddress", trim(form.presentAddress));
//     fd.append("jobStatus", trim(form.jobStatus).toLowerCase());

//     if (govDocFile) fd.append("govDocFile", govDocFile);
//     for (const pair of fd.entries()) {
//       console.log("FD:", pair[0], pair[1]);
//     }


//     const result = await dispatch(createSalesExecutive(fd));

//     if (createSalesExecutive.fulfilled.match(result)) {
//       setSuccessMsg("Sales Executive created successfully.");

//       // optional: you can keep form data if you want
//       setForm({
//         name: "",
//         email: "",
//         password: "",
//         phone: "",
//         altPhone: "",
//         aadhaar: "",
//         pan: "",
//         permanentAddress: "",
//         presentAddress: "",
//         jobStatus: "office",
//       });
//       setGovDocFile(null);
//       setErrors({});
//       setShowForm(false);

//       dispatch(fetchSalesExecutives());
//       return;
//     }

//     // show backend field errors ONCE (no useEffect merging)
//     if (createSalesExecutive.rejected.match(result)) {
//       const payload = result.payload;
//       if (payload?.errors && typeof payload.errors === "object") {
//         setErrors((prev) => ({ ...prev, ...payload.errors }));
//       }
//     }
//   };

//   return (
//     <div>
//       <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
//         👥 Sales Executives Management
//       </h1>

//       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
//         <div className="flex items-center justify-between mb-5">
//           <div>
//             <h2 className="text-lg font-semibold text-slate-800">
//               Sales Executives
//             </h2>
//             <p className="text-xs text-slate-500">
//               Create, manage and review OGCS CRM sales staff.
//             </p>
//           </div>

//           <button
//             onClick={() => {
//               setShowForm((prev) => !prev);
//               setSuccessMsg("");
//               // ✅ do NOT clear form data
//             }}
//             className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
//           >
//             {showForm ? "Close Form" : "+ Add Sales Executive"}
//           </button>
//         </div>

//         {showForm && (
//           <form
//             onSubmit={handleCreate}
//             className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 bg-slate-50/60 border border-slate-200 rounded-xl p-5 mb-5"
//           >
//             {[
//               { label: "Name", name: "name", type: "text" },
//               { label: "Email", name: "email", type: "email" },
//               { label: "Password", name: "password", type: "password" },
//               { label: "Phone Number", name: "phone", type: "tel" },
//               { label: "Alternate Phone", name: "altPhone", type: "tel" },
//               { label: "Aadhaar Number", name: "aadhaar", type: "text" },
//               { label: "PAN Number", name: "pan", type: "text" },
//             ].map((field) => (
//               <div key={field.name}>
//                 <label className="text-xs font-semibold text-slate-700 block mb-1">
//                   {field.label}{" "}
//                   {field.name !== "altPhone" && (
//                     <span className="text-red-500">*</span>
//                   )}
//                 </label>

//                 <input
//                   type={field.type}
//                   name={field.name}
//                   value={form[field.name]}
//                   onChange={handleChange}
//                   className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${errors[field.name]
//                       ? "border-red-400 focus:ring-red-400"
//                       : "border-slate-300 focus:ring-sky-500"
//                     }`}
//                   placeholder={field.label}
//                 />

//                 {errors[field.name] && (
//                   <p className="text-[11px] text-red-600 mt-1">
//                     {errors[field.name]}
//                   </p>
//                 )}
//               </div>
//             ))}

//             {/* Job Status */}
//             <div>
//               <label className="text-xs font-semibold text-slate-700 block mb-1">
//                 Job Status <span className="text-red-500">*</span>
//               </label>
//               <select
//                 name="jobStatus"
//                 value={form.jobStatus}
//                 onChange={handleChange}
//                 className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${errors.jobStatus
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-300 focus:ring-sky-500"
//                   }`}
//               >
//                 <option value="office">Office</option>
//                 <option value="remote">Remote</option>
//               </select>
//               {errors.jobStatus && (
//                 <p className="text-[11px] text-red-600 mt-1">
//                   {errors.jobStatus}
//                 </p>
//               )}
//             </div>

//             {/* Permanent Address */}
//             <div className="md:col-span-2 lg:col-span-3">
//               <label className="text-xs font-semibold text-slate-700 block mb-1">
//                 Permanent Address <span className="text-red-500">*</span>
//               </label>
//               <textarea
//                 name="permanentAddress"
//                 value={form.permanentAddress}
//                 onChange={handleChange}
//                 rows={2}
//                 className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${errors.permanentAddress
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-300 focus:ring-sky-500"
//                   }`}
//                 placeholder="Full permanent address"
//               />
//               {errors.permanentAddress && (
//                 <p className="text-[11px] text-red-600 mt-1">
//                   {errors.permanentAddress}
//                 </p>
//               )}
//             </div>

//             {/* Present Address */}
//             <div className="md:col-span-2 lg:col-span-3">
//               <label className="text-xs font-semibold text-slate-700 block mb-1">
//                 Present Address <span className="text-red-500">*</span>
//               </label>
//               <textarea
//                 name="presentAddress"
//                 value={form.presentAddress}
//                 onChange={handleChange}
//                 rows={2}
//                 className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${errors.presentAddress
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-300 focus:ring-sky-500"
//                   }`}
//                 placeholder="Current stay address"
//               />
//               {errors.presentAddress && (
//                 <p className="text-[11px] text-red-600 mt-1">
//                   {errors.presentAddress}
//                 </p>
//               )}
//             </div>

//             {/* Document Upload */}
//             <div className="md:col-span-2 lg:col-span-3">
//               <label className="text-xs font-semibold text-slate-700 mb-1 block">
//                 Government Document <span className="text-red-500">*</span>
//               </label>
//               <input
//                 type="file"
//                 accept="image/*,.pdf"
//                 onChange={handleFileChange}
//                 className={`w-full border border-dashed rounded-lg p-3 text-xs cursor-pointer bg-white ${errors.govDocFile ? "border-red-400" : "border-slate-300"
//                   }`}
//               />
//               {errors.govDocFile && (
//                 <p className="text-[11px] text-red-600 mt-1">
//                   {errors.govDocFile}
//                 </p>
//               )}
//               {govDocFile && (
//                 <p className="text-xs text-slate-600 mt-1">
//                   Selected: {govDocFile.name}
//                 </p>
//               )}
//             </div>

//             {/* Submit */}
//             <div className="md:col-span-2 lg:col-span-3 text-right">
//               <button
//                 type="submit"
//                 className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
//               >
//                 Save Sales Executive
//               </button>
//             </div>
//           </form>
//         )}

//         {successMsg && (
//           <p className="text-sm text-emerald-600 mb-3">{successMsg}</p>
//         )}

//         {/* error is string in slice; still safe */}
//         {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

//         {/* TABLE */}
//         <div className="mt-6">
//           <h3 className="text-sm font-semibold text-slate-700 mb-2">
//             Total Sales Executives: {salesExecutives?.length || 0}
//           </h3>

//           {salesLoading ? (
//             <p className="text-sm text-slate-500">Loading...</p>
//           ) : (
//             <div className="overflow-hidden rounded-xl border border-slate-200">
//               <table className="w-full text-sm">
//                 <thead className="bg-slate-100">
//                   <tr>
//                     <th className="text-left px-4 py-2">Name</th>
//                     <th className="text-left px-4 py-2">Email</th>
//                     <th className="text-left px-4 py-2">Status</th>
//                     <th className="text-left px-4 py-2">Created</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-slate-100">
//                   {salesExecutives?.length > 0 ? (
//                     salesExecutives.map((u) => (
//                       <tr key={u._id} className="hover:bg-slate-50 transition">
//                         <td className="px-4 py-2">{u.name}</td>
//                         <td className="px-4 py-2">{u.email}</td>
//                         <td className="px-4 py-2">
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${u.isActive !== false
//                                 ? "bg-emerald-100 text-emerald-700"
//                                 : "bg-slate-200 text-slate-700"
//                               }`}
//                           >
//                             {u.isActive !== false ? "Active" : "Inactive"}
//                           </span>
//                         </td>
//                         <td className="px-4 py-2 text-slate-600">
//                           {u.createdAt
//                             ? new Date(u.createdAt).toLocaleDateString()
//                             : "-"}
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td colSpan={4} className="text-center py-4 text-slate-500">
//                         No records found.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UsersSection;







































// import React, { useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import {
//   createSalesExecutive,
//   fetchSalesExecutives,
// } from "../../store/slices/authSlice";

// const UsersSection = () => {
//   const dispatch = useDispatch();
//   const { error, salesExecutives, salesLoading } = useSelector(
//     (state) => state.auth
//   );

//   const [showForm, setShowForm] = useState(false);
//   const [successMsg, setSuccessMsg] = useState("");
//   const [errors, setErrors] = useState({});
//   const [govDocFile, setGovDocFile] = useState(null);

//   const [form, setForm] = useState({
//     name: "",
//     email: "",
//     password: "",
//     phone: "",
//     altPhone: "",
//     aadhaar: "",
//     pan: "",
//     permanentAddress: "",
//     presentAddress: "",
//     jobStatus: "office",
//   });

//   useEffect(() => {
//     dispatch(fetchSalesExecutives());
//   }, [dispatch]);

//   const handleChange = (e) => {
//     setSuccessMsg("");
//     const { name, value } = e.target;
//     setForm((prev) => ({ ...prev, [name]: value }));
//     setErrors((prev) => ({ ...prev, [name]: "" }));
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files?.[0] || null;
//     setGovDocFile(file);
//     setErrors((prev) => ({ ...prev, govDocFile: "" }));
//   };

//   const validateForm = () => {
//     const newErrors = {};
//     const trim = (v) => (v || "").trim();
//     const digits = (v) => (v || "").replace(/\D/g, "");
//     const emailRegex = /^\S+@\S+\.\S+$/;
//     const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i;

//     if (!trim(form.name)) newErrors.name = "Name is required.";
//     else if (trim(form.name).length < 3)
//       newErrors.name = "Name must be at least 3 characters.";

//     if (!trim(form.email)) newErrors.email = "Email is required.";
//     else if (!emailRegex.test(trim(form.email)))
//       newErrors.email = "Invalid email format.";

//     if (!trim(form.password)) newErrors.password = "Password is required.";
//     else if (form.password.length < 6)
//       newErrors.password = "Password must be at least 6 characters.";

//     if (digits(form.phone).length !== 10)
//       newErrors.phone = "Phone must be 10 digits.";

//     if (digits(form.altPhone).length !== 10)
//       newErrors.altPhone = "Alternate phone must be 10 digits.";

//     if (digits(form.aadhaar).length !== 12)
//       newErrors.aadhaar = "Aadhaar must be 12 digits.";

//     if (!panRegex.test(trim(form.pan)))
//       newErrors.pan = "PAN format should be ABCDE1234F.";

//     if (trim(form.permanentAddress).length < 10)
//       newErrors.permanentAddress = "Permanent address too short.";

//     if (trim(form.presentAddress).length < 10)
//       newErrors.presentAddress = "Present address too short.";

//     if (!govDocFile) newErrors.govDocFile = "Government document required.";

//     setErrors(newErrors);
//     return Object.keys(newErrors).length === 0;
//   };

//   const handleCreate = async (e) => {
//     e.preventDefault();
//     setSuccessMsg("");

//     if (!validateForm()) return;

//     const payload = {
//       name: form.name,
//       email: form.email,
//       password: form.password,
//     };

//     const result = await dispatch(createSalesExecutive(payload));

//     if (createSalesExecutive.fulfilled.match(result)) {
//       setSuccessMsg("Sales Executive created successfully.");

//       setForm({
//         name: "",
//         email: "",
//         password: "",
//         phone: "",
//         altPhone: "",
//         aadhaar: "",
//         pan: "",
//         permanentAddress: "",
//         presentAddress: "",
//         jobStatus: "office",
//       });
//       setGovDocFile(null);
//       setErrors({});
//       setShowForm(false);
//       dispatch(fetchSalesExecutives());
//     }
//   };

//   return (
//     <div>
//       {/* Page Header */}
//       <h1 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
//         👥 Sales Executives Management
//       </h1>

//       {/* Main Card */}
//       <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">

//         {/* Top Bar */}
//         <div className="flex items-center justify-between mb-5">
//           <div>
//             <h2 className="text-lg font-semibold text-slate-800">
//               Sales Executives
//             </h2>
//             <p className="text-xs text-slate-500">
//               Create, manage and review OGCS CRM sales staff.
//             </p>
//           </div>

//           <button
//             onClick={() => setShowForm((prev) => !prev)}
//             className="px-4 py-2 text-sm font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
//           >
//             {showForm ? "Close Form" : "+ Add Sales Executive"}
//           </button>
//         </div>

//         {/* FORM */}
//         {showForm && (
//           <form
//             onSubmit={handleCreate}
//             className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 bg-slate-50/60 border border-slate-200 rounded-xl p-5 mb-5"
//           >
//             {/* Inputs */}
//             {[
//               { label: "Name", name: "name", type: "text" },
//               { label: "Email", name: "email", type: "email" },
//               { label: "Password", name: "password", type: "password" },
//               { label: "Phone Number", name: "phone", type: "tel" },
//               { label: "Alternate Phone", name: "altPhone", type: "tel" },
//               { label: "Aadhaar Number", name: "aadhaar", type: "text" },
//               { label: "PAN Number", name: "pan", type: "text" },
//             ].map((field) => (
//               <div key={field.name}>
//                 <label className="text-xs font-semibold text-slate-700 block mb-1">
//                   {field.label} <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   type={field.type}
//                   name={field.name}
//                   value={form[field.name]}
//                   onChange={handleChange}
//                   className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none ${
//                     errors[field.name]
//                       ? "border-red-400 focus:ring-red-400"
//                       : "border-slate-300 focus:ring-sky-500"
//                   }`}
//                   placeholder={field.label}
//                 />
//                 {errors[field.name] && (
//                   <p className="text-[11px] text-red-600 mt-1">
//                     {errors[field.name]}
//                   </p>
//                 )}
//               </div>
//             ))}

//             {/* Permanent Address */}
//             <div className="md:col-span-2 lg:col-span-3">
//               <label className="text-xs font-semibold text-slate-700 block mb-1">
//                 Permanent Address *
//               </label>
//               <textarea
//                 name="permanentAddress"
//                 value={form.permanentAddress}
//                 onChange={handleChange}
//                 rows={2}
//                 className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${
//                   errors.permanentAddress
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-300 focus:ring-sky-500"
//                 }`}
//                 placeholder="Full permanent address"
//               />
//             </div>

//             {/* Present Address */}
//             <div className="md:col-span-2 lg:col-span-3">
//               <label className="text-xs font-semibold text-slate-700 block mb-1">
//                 Present Address *
//               </label>
//               <textarea
//                 name="presentAddress"
//                 value={form.presentAddress}
//                 onChange={handleChange}
//                 rows={2}
//                 className={`w-full border rounded-lg px-3 py-2 text-sm resize-y focus:outline-none ${
//                   errors.presentAddress
//                     ? "border-red-400 focus:ring-red-400"
//                     : "border-slate-300 focus:ring-sky-500"
//                 }`}
//                 placeholder="Current stay address"
//               />
//             </div>

//             {/* Document Upload */}
//             <div className="md:col-span-2 lg:col-span-3">
//               <label className="text-xs font-semibold text-slate-700 mb-1 block">
//                 Government Document *
//               </label>
//               <input
//                 type="file"
//                 accept="image/*,.pdf"
//                 onChange={handleFileChange}
//                 className={`w-full border border-dashed rounded-lg p-3 text-xs cursor-pointer bg-white ${
//                   errors.govDocFile ? "border-red-400" : "border-slate-300"
//                 }`}
//               />
//               {govDocFile && (
//                 <p className="text-xs text-slate-600 mt-1">
//                   Selected: {govDocFile.name}
//                 </p>
//               )}
//             </div>

//             {/* Submit */}
//             <div className="md:col-span-2 lg:col-span-3 text-right">
//               <button
//                 type="submit"
//                 className="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
//               >
//                 Save Sales Executive
//               </button>
//             </div>
//           </form>
//         )}

//         {successMsg && (
//           <p className="text-sm text-emerald-600 mb-3">{successMsg}</p>
//         )}
//         {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

//         {/* TABLE */}
//         <div className="mt-6">
//           <h3 className="text-sm font-semibold text-slate-700 mb-2">
//             Total Sales Executives: {salesExecutives?.length || 0}
//           </h3>

//           {salesLoading ? (
//             <p className="text-sm text-slate-500">Loading...</p>
//           ) : (
//             <div className="overflow-hidden rounded-xl border border-slate-200">
//               <table className="w-full text-sm">
//                 <thead className="bg-slate-100">
//                   <tr>
//                     <th className="text-left px-4 py-2">Name</th>
//                     <th className="text-left px-4 py-2">Email</th>
//                     <th className="text-left px-4 py-2">Status</th>
//                     <th className="text-left px-4 py-2">Created</th>
//                   </tr>
//                 </thead>

//                 <tbody className="divide-y divide-slate-100">
//                   {salesExecutives?.length > 0 ? (
//                     salesExecutives.map((u) => (
//                       <tr
//                         key={u._id}
//                         className="hover:bg-slate-50 transition"
//                       >
//                         <td className="px-4 py-2">{u.name}</td>
//                         <td className="px-4 py-2">{u.email}</td>

//                         <td className="px-4 py-2">
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${
//                               u.isActive !== false
//                                 ? "bg-emerald-100 text-emerald-700"
//                                 : "bg-slate-200 text-slate-700"
//                             }`}
//                           >
//                             {u.isActive !== false ? "Active" : "Inactive"}
//                           </span>
//                         </td>

//                         <td className="px-4 py-2 text-slate-600">
//                           {u.createdAt
//                             ? new Date(u.createdAt).toLocaleDateString()
//                             : "-"}
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan={4}
//                         className="text-center py-4 text-slate-500"
//                       >
//                         No records found.
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UsersSection;
