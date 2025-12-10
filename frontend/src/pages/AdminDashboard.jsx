// src/pages/AdminDashboard.jsx
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout, createSalesExecutive } from "../store/slices/authSlice";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState("overview");

  const handleLogout = () => {
    dispatch(logout());
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection />;
      case "leads":
        return <LeadsSection />;
      case "users":
        return <UsersSection />;
      case "reports":
        return <ReportsSection />;
      case "settings":
        return <SettingsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md border-r border-slate-100 hidden md:flex flex-col">
        <div className="px-4 py-4 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-800">OGCS CRM</h1>
          <p className="text-xs text-slate-500">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-2">
          <DashboardButton
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />
          <DashboardButton
            label="Leads"
            active={activeTab === "leads"}
            onClick={() => setActiveTab("leads")}
          />
          <DashboardButton
            label="Users"
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          />
          <DashboardButton
            label="Reports"
            active={activeTab === "reports"}
            onClick={() => setActiveTab("reports")}
          />
          <DashboardButton
            label="Settings"
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
          />
        </nav>

        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Logged in as:</p>
          <p className="text-sm font-medium text-slate-800 truncate">
            {user?.name}
          </p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-xs text-red-600 border border-red-200 rounded-md py-1.5 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col">
        {/* Top bar for mobile + title */}
        <header className="w-full bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between md:hidden">
          <div>
            <h1 className="text-base font-semibold text-slate-800">
              OGCS CRM – Admin
            </h1>
            <p className="text-xs text-slate-500">
              {user?.name} ({user?.email})
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs text-red-600 border border-red-200 rounded-md px-3 py-1 hover:bg-red-50 transition"
          >
            Logout
          </button>
        </header>

        {/* Tab buttons on mobile */}
        <div className="md:hidden bg-white border-b border-slate-100 px-2 py-2 flex gap-2 overflow-x-auto">
          {["overview", "leads", "users", "reports", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs rounded-full border ${
                activeTab === tab
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content area */}
        <section className="flex-1 p-4 md:p-6">{renderContent()}</section>
      </main>
    </div>
  );
};

const DashboardButton = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 text-sm rounded-lg transition ${
      active
        ? "bg-sky-600 text-white font-semibold"
        : "text-slate-700 hover:bg-slate-50"
    }`}
  >
    {label}
  </button>
);

// 🔹 Reusable card
const Card = ({ title, children }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
    <h2 className="text-sm font-semibold text-slate-800 mb-2">{title}</h2>
    {children}
  </div>
);

const OverviewSection = () => (
  <div>
    <h1 className="text-xl font-bold text-slate-800 mb-4">Overview</h1>
    <div className="grid gap-4 md:grid-cols-3">
      <Card title="Total Leads">
        <p className="text-2xl font-bold text-slate-800">0</p>
        <p className="text-xs text-slate-500 mt-1">Coming from CRM module</p>
      </Card>
      <Card title="Active Users">
        <p className="text-2xl font-bold text-slate-800">0</p>
      </Card>
      <Card title="This Week Activity">
        <p className="text-xs text-slate-500">
          Once we add leads / follow-ups, summary will appear here.
        </p>
      </Card>
    </div>
  </div>
);

const LeadsSection = () => (
  <div>
    <h1 className="text-xl font-bold text-slate-800 mb-4">
      Leads Management (coming next)
    </h1>
    <p className="text-sm text-slate-600">
      Here we will show leads table, filters, and create lead form in next
      steps.
    </p>
  </div>
);

/* 🔴 UPDATED SECTION: Admin can create Sales Executive here */
const UsersSection = () => {
  const dispatch = useDispatch();
  const { error } = useSelector((state) => state.auth);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [successMsg, setSuccessMsg] = useState("");

  const handleChange = (e) => {
    setSuccessMsg("");
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSuccessMsg("");

    const result = await dispatch(createSalesExecutive(form));

    if (createSalesExecutive.fulfilled.match(result)) {
      setSuccessMsg("Sales Executive created successfully.");
      setForm({ name: "", email: "", password: "" });
      setShowForm(false);
    }
  };

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-4">
        Users Management
      </h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">
            Sales Executives
          </h2>
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="text-xs bg-sky-600 text-white px-3 py-1.5 rounded-lg hover:bg-sky-700 transition"
          >
            {showForm ? "Cancel" : "Create Sales Executive"}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="grid gap-3 md:grid-cols-3 items-end"
          >
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Sales Executive Name"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="sales@ogcs.co.in"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="Set login password"
              />
            </div>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="mt-1 inline-flex items-center px-4 py-1.5 text-xs font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Save Sales Executive
              </button>
            </div>
          </form>
        )}

        {error && (
          <p className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
        {successMsg && (
          <p className="mt-2 text-xs text-emerald-600">
            {successMsg}
          </p>
        )}

        <p className="mt-3 text-xs text-slate-500">
          Later we will show full user list with edit / deactivate options.
        </p>
      </div>
    </div>
  );
};

const ReportsSection = () => (
  <div>
    <h1 className="text-xl font-bold text-slate-800 mb-4">
      Reports & Analytics
    </h1>
    <p className="text-sm text-slate-600">
      Later we will add charts and metrics (leads status, conversions, etc.).
    </p>
  </div>
);

const SettingsSection = () => (
  <div>
    <h1 className="text-xl font-bold text-slate-800 mb-4">
      System Settings
    </h1>
    <p className="text-sm text-slate-600">
      Configure CRM settings like sources, lead statuses, and more.
    </p>
  </div>
);

export default AdminDashboard;
