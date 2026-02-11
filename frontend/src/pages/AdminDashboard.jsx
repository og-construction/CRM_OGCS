import React, { useMemo, useState, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

// Sections
import OverviewSection from "../components/admin/OverviewSection";
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
  FiMenu,
  FiX,
} from "react-icons/fi";

const REPORT_TABS = ["latest", "routes", "daily", "all"];
const cn = (...a) => a.filter(Boolean).join(" ");

export default function AdminDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);

  const [activeTab, setActiveTab] = useState("overview");
  const [reportsTab, setReportsTab] = useState("latest");
  const [reportsOpen, setReportsOpen] = useState(true);

  // ✅ Mobile drawer state
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleNav = useCallback(
    (key) => {
      navigate(key);
      setSidebarOpen(false); // ✅ close drawer on mobile
    },
    [navigate]
  );

  const pageTitle = useMemo(() => {
    if (activeTab === "reports") {
      if (reportsTab === "latest") return "Latest Locations";
      if (reportsTab === "routes") return "Daily Routes";
      if (reportsTab === "daily") return "Daily Reports";
      if (reportsTab === "all") return "All Reports";
      return "Reports";
    }
    if (activeTab === "overview") return "Overview";
    if (activeTab === "leads") return "Leads";
    if (activeTab === "users") return "Sales Executive";
    if (activeTab === "settings") return "Settings";
    return "Admin";
  }, [activeTab, reportsTab]);

  const content = useMemo(() => {
    switch (activeTab) {
      case "overview":
        return <OverviewSection />;
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

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ✅ TOP BAR (mobile + desktop) */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-100">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
              aria-label="Open menu"
            >
              <FiMenu className="text-lg text-slate-700" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h1 className="text-base md:text-lg font-bold text-slate-800 truncate">
                  OGCS CRM
                </h1>
                <span className="hidden sm:inline-flex text-[10px] md:text-xs px-2 py-0.5 rounded-full border border-slate-200 bg-slate-50 text-slate-600">
                  Admin
                </span>
              </div>
              <p className="text-xs text-slate-500 truncate">
                {pageTitle}
              </p>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:block text-right leading-tight">
              <p className="text-xs text-slate-500">Logged in as</p>
              <p className="text-sm font-semibold text-slate-800 truncate max-w-[220px] md:max-w-[320px]">
                {user?.name || "Admin"}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 transition text-xs md:text-sm"
            >
              <FiLogOut />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ✅ LAYOUT */}
      <div className="flex">
        {/* ✅ Desktop sidebar */}
        <aside className="hidden md:flex w-72 lg:w-80 shrink-0 h-[calc(100vh-57px)] sticky top-[57px] border-r border-slate-100 bg-white">
          <Sidebar
            user={user}
            menu={menu}
            activeTab={activeTab}
            reportsTab={reportsTab}
            reportsOpen={reportsOpen}
            setReportsOpen={setReportsOpen}
            onNavigate={handleNav}
            onLogout={handleLogout}
          />
        </aside>

        {/* ✅ Main */}
        <main className="flex-1 min-w-0">
          {/* ✅ Content wrapper (better spacing on all devices) */}
          <div className="p-3 sm:p-4 md:p-6">
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm">
              <div className="p-3 sm:p-4 md:p-6">{content}</div>
            </div>
          </div>
        </main>
      </div>

      {/* ✅ Mobile sidebar drawer */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-slate-900/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 left-0 z-50 w-[86%] max-w-sm bg-white border-r border-slate-100 shadow-xl md:hidden">
            <div className="px-4 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-800">OGCS CRM</h2>
                <p className="text-xs text-slate-500">Admin Dashboard</p>
              </div>
              <button
                onClick={() => setSidebarOpen(false)}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                aria-label="Close menu"
              >
                <FiX className="text-lg text-slate-700" />
              </button>
            </div>

            <Sidebar
              user={user}
              menu={menu}
              activeTab={activeTab}
              reportsTab={reportsTab}
              reportsOpen={reportsOpen}
              setReportsOpen={setReportsOpen}
              onNavigate={handleNav}
              onLogout={handleLogout}
              isMobile
            />
          </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------
   Sidebar Component
------------------------------------------- */
function Sidebar({
  user,
  menu,
  activeTab,
  reportsTab,
  reportsOpen,
  setReportsOpen,
  onNavigate,
  onLogout,
  isMobile = false,
}) {
  return (
    <div className="flex flex-col w-full h-full">
      {/* Nav */}
      <nav className={cn("flex-1 px-3 py-4 space-y-1", isMobile && "overflow-auto")}>
        {menu.map((item) => {
          const Icon = item.icon;

          // With children (Reports)
          if (item.children?.length) {
            const isActive = activeTab === "reports";
            return (
              <div key={item.key} className="space-y-1">
                <SidebarButton
                  label={item.label}
                  icon={Icon}
                  active={isActive}
                  rightIcon={reportsOpen ? FiChevronDown : FiChevronRight}
                  onClick={() => {
                    // toggle open but keep active
                    if (activeTab !== "reports") onNavigate("reports");
                    else setReportsOpen((v) => !v);
                  }}
                />

                {reportsOpen && (
                  <div className="pl-3 space-y-1">
                    {item.children.map((child) => (
                      <SidebarButton
                        key={child.key}
                        label={child.label}
                        icon={child.icon}
                        compact
                        active={activeTab === "reports" && reportsTab === child.key}
                        onClick={() => onNavigate(child.key)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // Normal item
          return (
            <SidebarButton
              key={item.key}
              label={item.label}
              icon={Icon}
              active={activeTab === item.key}
              onClick={() => onNavigate(item.key)}
            />
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
            {(user?.name?.[0] || "A").toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Logged in as</p>
            <p className="text-sm font-semibold text-slate-800 truncate">
              {user?.name || "Admin"}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.email || ""}</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 text-red-600 bg-white hover:bg-red-50 transition text-sm"
        >
          <FiLogOut />
          Logout
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------
   Reusable Button
------------------------------------------- */
function SidebarButton({
  label,
  icon: Icon,
  active,
  onClick,
  compact = false,
  rightIcon: RightIcon,
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left rounded-xl transition flex items-center justify-between gap-2 border",
        compact ? "px-3 py-2 text-xs" : "px-3 py-2.5 text-sm",
        active
          ? "bg-sky-600 text-white border-sky-600 font-semibold shadow-sm"
          : "bg-white text-slate-700 border-transparent hover:bg-slate-50 hover:border-slate-200"
      )}
    >
      <span className="inline-flex items-center gap-2 min-w-0">
        {Icon ? (
          <Icon className={cn(compact ? "text-base" : "text-lg", active ? "text-white" : "text-slate-600")} />
        ) : null}
        <span className="truncate">{label}</span>
      </span>

      {RightIcon ? (
        <RightIcon className={cn(compact ? "text-base" : "text-lg", "opacity-90")} />
      ) : null}
    </button>
  );
}
