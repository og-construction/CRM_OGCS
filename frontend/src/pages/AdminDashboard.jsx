import React, { useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

// Sections
import OverviewSection from "../components/admin/OverviewSection";
import LeadsSection from "../components/admin/LeadsSection";
import AdminLeadsSection from "../components/admin/AdminLeadsSection";
import UsersSection from "../components/admin/UsersSection";
import SettingsSection from "../components/admin/SettingsSection";

// Reports
import DailyReportsSection from "../components/admin/reports/DailyReportsSection";
import AllReportsSection from "../components/admin/reports/AllReportsSection";
import DailyRoutesAllEmployees from "../components/admin/reports/DailyRoutesAllEmployees";
import LatestLocationsSection from "../components/admin/reports/LatestLocationsSection";

// Icons
import {
  FiGrid,
  FiTarget,
  FiUsers,
  FiFileText,
  FiCalendar,
  FiLayers,
  FiSettings,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiMapPin,
} from "react-icons/fi";

const REPORT_TABS = ["latest", "routes", "daily", "all"];

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [activeTab, setActiveTab] = useState("overview");
  const [reportsTab, setReportsTab] = useState("latest");
  const [reportsOpen, setReportsOpen] = useState(true);

  const handleLogout = useCallback(() => dispatch(logout()), [dispatch]);

  const menu = useMemo(
    () => [
      { key: "overview", label: "Overview", icon: FiGrid },
      { key: "leads", label: "Leads", icon: FiTarget },
      { key: "users", label: "Sales Executive", icon: FiUsers },
      {
        key: "reports",
        label: "Reports",
        icon: FiFileText,
        children: [
          { key: "latest", label: "Latest Locations", icon: FiMapPin },
          // { key: "routes", label: "Daily Routes (All)", icon: FiMapPin },
          { key: "daily", label: "Daily Reports", icon: FiCalendar },
          { key: "all", label: "All Reports", icon: FiLayers },
        ],
      },
      { key: "settings", label: "Settings", icon: FiSettings },
    ],
    []
  );

  const navigate = useCallback((key) => {
    if (key === "reports") {
      setActiveTab("reports");
      setReportsOpen((v) => !v);
      return;
    }
    if (REPORT_TABS.includes(key)) {
      setActiveTab("reports");
      setReportsTab(key);
      setReportsOpen(true);
      return;
    }
    setActiveTab(key);
  }, []);

  const content = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection />;
      // case "leads":
      //   return <LeadsSection />;
      case "leads":
        return <AdminLeadsSection />;
      case "users":
        return <UsersSection />;
      case "settings":
        return <SettingsSection />;
      case "reports":
        switch (reportsTab) {
          case "latest":
            return <LatestLocationsSection />;
          case "routes":
            return <DailyRoutesAllEmployees />;
          case "daily":
            return <DailyReportsSection />;
          case "all":
            return <AllReportsSection />;
          default:
            return <LatestLocationsSection />;
        }
      default:
        return <OverviewSection />;
    }
  }, [activeTab, reportsTab]);

  const mobileTabs = ["overview", "leads", "users", "reports", "settings"];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="w-64 bg-white shadow-md border-r border-slate-100 hidden md:flex flex-col h-auto lg:h-screen">
        <div className="px-4 py-4 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-800">OGCS CRM</h1>
          <p className="text-xs text-slate-500">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {menu.map((item) => {
            const Icon = item.icon;

            if (item.children?.length) {
              const isActive = activeTab === "reports";
              return (
                <div key={item.key} className="space-y-1">
                  <DashboardButton
                    label={item.label}
                    icon={Icon}
                    active={isActive}
                    rightIcon={reportsOpen ? FiChevronDown : FiChevronRight}
                    onClick={() => navigate("reports")}
                  />

                  {reportsOpen && (
                    <div className="pl-3 space-y-1">
                      {item.children.map((child) => (
                        <DashboardButton
                          key={child.key}
                          label={child.label}
                          icon={child.icon}
                          active={activeTab === "reports" && reportsTab === child.key}
                          compact
                          onClick={() => navigate(child.key)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <DashboardButton
                key={item.key}
                label={item.label}
                icon={Icon}
                active={activeTab === item.key}
                onClick={() => navigate(item.key)}
              />
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-100">
          <p className="text-xs text-slate-500 mb-1">Logged in as:</p>
          <p className="text-sm font-medium text-slate-800 truncate">{user?.name}</p>

          <button
            onClick={handleLogout}
            className="mt-2 w-full text-xs text-red-600 border border-red-200 rounded-md py-2 hover:bg-red-50 transition inline-flex items-center justify-center gap-2"
          >
            <FiLogOut />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col h-auto lg:h-screen overflow-auto">
        {/* Mobile header */}
        <header className="w-full bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between md:hidden">
          <div>
            <h1 className="text-base font-semibold text-slate-800">OGCS CRM – Admin</h1>
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

        {/* Mobile tabs */}
        <div className="md:hidden bg-white border-b border-slate-100 px-2 py-2 flex gap-2 overflow-x-auto">
          {mobileTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => navigate(tab)}
              className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap ${
                activeTab === tab
                  ? "bg-sky-600 text-white border-sky-600"
                  : "bg-slate-50 text-slate-700 border-slate-200"
              }`}
            >
              {tab === "users" ? "Sales Executive" : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}

          {activeTab === "reports" && (
            <>
              <MobileSubTab active={reportsTab === "latest"} onClick={() => navigate("latest")} label="Latest" Icon={FiMapPin} />
              <MobileSubTab active={reportsTab === "routes"} onClick={() => navigate("routes")} label="Routes" Icon={FiMapPin} />
              <MobileSubTab active={reportsTab === "daily"} onClick={() => navigate("daily")} label="Daily" Icon={FiCalendar} />
              <MobileSubTab active={reportsTab === "all"} onClick={() => navigate("all")} label="All" Icon={FiLayers} />
            </>
          )}
        </div>

        <section className="flex-1 p-4 md:p-6">{content}</section>
      </main>
    </div>
  );
}

const DashboardButton = ({ label, icon: Icon, active, onClick, compact = false, rightIcon: RightIcon }) => (
  <button
    onClick={onClick}
    className={`w-full text-left rounded-lg transition flex items-center justify-between gap-2
      ${compact ? "px-3 py-2 text-xs" : "px-3 py-2 text-sm"}
      ${active ? "bg-sky-600 text-white font-semibold" : "text-slate-700 hover:bg-slate-50"}`}
  >
    <span className="inline-flex items-center gap-2">
      {Icon ? <Icon className={compact ? "text-base" : "text-lg"} /> : null}
      {label}
    </span>
    {RightIcon ? <RightIcon className={compact ? "text-base opacity-90" : "text-lg opacity-90"} /> : null}
  </button>
);

const MobileSubTab = ({ active, onClick, label, Icon }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-xs rounded-full border whitespace-nowrap inline-flex items-center gap-1 ${
      active ? "bg-sky-600 text-white border-sky-600" : "bg-slate-50 text-slate-700 border-slate-200"
    }`}
  >
    <Icon />
    {label}
  </button>
);
