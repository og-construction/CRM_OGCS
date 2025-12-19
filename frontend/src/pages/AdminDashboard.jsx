// src/pages/AdminDashboard.jsx
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

// 🔹 Import tab components
import OverviewSection from "../components/admin/OverviewSection";
import LeadsSection from "../components/admin/LeadsSection";
import UsersSection from "../components/admin/UsersSection";
import ReportsSection from "../components/admin/ReportsSection";
import SettingsSection from "../components/admin/SettingsSection";

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
            label="Sales Excative"
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

export default AdminDashboard;
