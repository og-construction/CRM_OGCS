// src/pages/SalesDashboard.jsx
import React, { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

// ✅ Location tracker hook
import useLocationTracker from "../hooks/useLocationTracker";

// Sales Components
import LeadManagement from "../components/sales/LeadManagement";
import FollowUpSystem from "../components/sales/FollowUpSystem";
import QuotationInvoice from "../components/sales/QuotationInvoice";
import ContactsCompanies from "../components/sales/ContactsCompanies";
import TeamManagement from "../components/sales/TeamManagement";
import CommunicationSystem from "../components/sales/CommunicationSystem";
import SidebarButton from "../components/sales/SidebarButton";
import VisitingPlaced from "../components/sales/VisitingPlaced";

// ✅ FIXED PATHS
import Notifications from "../components/sales/Notification.jsx";
import Reports from "../components/sales/Reports.jsx";

// ✅ Animations
import { motion, AnimatePresence } from "framer-motion";

// Icons
import {
  FiLogOut,
  FiUser,
  FiMail,
  FiHome,
  FiTrendingUp,
  FiClock,
  FiFileText,
  FiUsers,
  FiMessageCircle,
  FiShield,
  FiChevronRight,
  FiMapPin,
  FiRefreshCw,
  FiBell,
  FiBarChart2,
  FiMenu,
  FiX,
  FiChevronDown,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

/**
 * ✅ KEY FIX:
 * Keep all sections mounted, only hide/show.
 * This prevents forms from unmounting/remounting (typing stops after 1 char).
 */
const SectionWrapper = ({ show, children }) => (
  <div className={show ? "block" : "hidden"}>{children}</div>
);

const SalesDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [active, setActive] = useState("leads");
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Tracking enabled when user is logged in
  const trackingEnabled = !!user;
  const { status, lastPingAt, lastError, sendLocationOnce } = useLocationTracker({
    enabled: trackingEnabled,
  });

  const handleLogout = () => dispatch(logout());

  const tabs = useMemo(
    () => [
      { id: "leads", label: "Leads", full: "Lead Management", icon: <FiTrendingUp /> },
      {id: "visitingplaced", label: "Visiting Placed", full: "Visiting Placed", icon: <FiHome />},
      { id: "followups", label: "Follow-Ups", full: "Follow-Up System", icon: <FiClock /> },
      { id: "quotes", label: "Quotes", full: "Quotation / Invoice", icon: <FiFileText /> },
      { id: "contacts", label: "Contacts", full: "Contacts & Companies", icon: <FiUsers /> },
      { id: "team", label: "Team", full: "Upload Daily Report", icon: <FiShield /> },
      { id: "communication", label: "Comm", full: "Communication System", icon: <FiMessageCircle /> },
      { id: "notifications", label: "Notify", full: "Notifications", icon: <FiBell /> },
      { id: "reports", label: "Reports", full: "Reports Dashboard", icon: <FiBarChart2 /> },
    ],
    []
  );

  const activeTab = tabs.find((t) => t.id === active) || tabs[0];
  const activeTitle = activeTab?.full || "Lead Management";

  const initials = useMemo(() => {
    const n = String(user?.name || "Sales Executive").trim();
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "S";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [user?.name]);

  // ✅ UI-only: badge color mapping (allowed colors only)
  const trackingBadge = useMemo(() => {
    if (!trackingEnabled) return { text: "OFF", dot: "bg-slate-400" };
    if (status === "running") return { text: "ON", dot: "bg-green-600" };
    if (status === "denied") return { text: "DENIED", dot: "bg-orange-500" };
    if (status === "error") return { text: "ERROR", dot: "bg-red-500" };
    if (status === "waiting") return { text: "WAITING", dot: "bg-blue-600" };
    return { text: "STARTING", dot: "bg-blue-600" };
  }, [status, trackingEnabled]);

  // close mobile drawer on tab change
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ----- animation variants -----
  const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  const drawer = {
    hidden: { x: "-100%" },
    show: { x: 0, transition: { type: "spring", stiffness: 260, damping: 28 } },
    exit: { x: "-100%", transition: { duration: 0.2 } },
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex min-h-screen">
        {/* ===================== Sidebar (Desktop) ===================== */}
        <aside className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-col">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                    <FiHome />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-extrabold text-slate-900 leading-tight">
                      OGCS CRM
                    </h1>
                    <p className="text-xs text-slate-400">Sales Executive Panel</p>
                  </div>
                </div>
              </div>

              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
                Sales
              </span>
            </div>

            {/* User Card */}
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                  {initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-extrabold text-slate-900 truncate">
                    {user?.name || "Sales Executive"}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                    <FiMail className="shrink-0" />
                    <span className="truncate">{user?.email || "-"}</span>
                  </div>

                  {/* Tracking */}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold text-slate-900">
                      <FiMapPin className="text-slate-600" />
                      TRACK {trackingBadge.text}
                      <span className={cn("h-2 w-2 rounded-full", trackingBadge.dot)} />
                    </span>

                    <button
                      onClick={sendLocationOnce}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-900 hover:bg-slate-50 active:scale-[0.98] transition"
                      title="Send location now"
                      type="button"
                    >
                      <FiRefreshCw className="text-slate-600" />
                      Ping
                    </button>
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400 truncate">
                    Last: {lastPingAt ? lastPingAt.toLocaleString() : "-"}
                  </div>

                  {lastError ? (
                    <div className="mt-1 text-[10px] text-red-500">{lastError}</div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {tabs.map((t) => (
              <SidebarButton
                key={t.id}
                label={t.full}
                active={active === t.id}
                onClick={() => setActive(t.id)}
              />
            ))}
          </nav>

          {/* Logout */}
          <div className="px-5 py-4 border-t border-slate-200">
            <button
              onClick={handleLogout}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 active:scale-[0.99] transition"
              type="button"
            >
              <FiLogOut className="text-red-500" />
              Logout
            </button>
            <div className="mt-3 text-[11px] text-slate-400">
              <span className="font-semibold text-slate-600">Section:</span>{" "}
              <span className="text-slate-900">{activeTitle}</span>
            </div>
          </div>
        </aside>

        {/* ===================== Mobile Drawer ===================== */}
        <AnimatePresence>
          {mobileOpen ? (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/30 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
              />
              <motion.aside
                className="fixed z-50 left-0 top-0 bottom-0 w-[86%] max-w-[340px] md:hidden bg-white border-r border-slate-200 flex flex-col"
                variants={drawer}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                      <FiHome />
                    </div>
                    <div>
                      <div className="text-sm font-extrabold text-slate-900">OGCS CRM</div>
                      <div className="text-[11px] text-slate-400">Sales Panel</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50"
                    aria-label="Close"
                  >
                    <FiX className="text-slate-900" />
                  </button>
                </div>

                <div className="px-4 py-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 truncate">
                        {user?.name || "Sales Executive"}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <FiMail className="shrink-0" />
                        <span className="truncate">{user?.email || "-"}</span>
                      </div>

                      <div className="mt-2 flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold text-slate-900">
                          <FiMapPin className="text-slate-600" />
                          {trackingBadge.text}
                          <span className={cn("h-2 w-2 rounded-full", trackingBadge.dot)} />
                        </span>

                        <button
                          onClick={sendLocationOnce}
                          className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-semibold text-slate-900 hover:bg-slate-50"
                          type="button"
                        >
                          <FiRefreshCw className="text-slate-600" />
                          Ping
                        </button>
                      </div>

                      {lastError ? (
                        <div className="mt-1 text-[10px] text-red-500">{lastError}</div>
                      ) : null}
                    </div>
                  </div>
                </div>

                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActive(t.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl border transition flex items-center justify-between",
                        active === t.id
                          ? "bg-blue-600 text-white border-slate-200"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900"
                      )}
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        {t.icon} {t.full}
                      </span>
                      <FiChevronRight />
                    </button>
                  ))}
                </nav>

                <div className="px-4 py-4 border-t border-slate-200">
                  <button
                    onClick={handleLogout}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-semibold text-slate-900 hover:bg-slate-50"
                    type="button"
                  >
                    <FiLogOut className="text-red-500" />
                    Logout
                  </button>
                </div>
              </motion.aside>
            </>
          ) : null}
        </AnimatePresence>

        {/* ===================== Main Area ===================== */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* ===================== Top Header ===================== */}
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
            {/* Brand Strip (allowed colors only) */}
            <div className="h-1 w-full bg-blue-600" />

            <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
              {/* Left */}
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile menu */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="md:hidden h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
                  aria-label="Open menu"
                >
                  <FiMenu className="text-slate-900" />
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200",
                        "bg-slate-50 text-slate-900"
                      )}
                      title={activeTitle}
                    >
                      {activeTab.icon}
                    </span>

                    <div className="min-w-0">
                      <h1 className="text-base md:text-lg font-extrabold text-slate-900 truncate">
                        OGCS CRM – Sales Dashboard
                      </h1>

                      <p className="text-xs text-slate-400 truncate flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                          <FiUser />
                          {user?.name || "Sales Executive"}
                        </span>
                        {user?.email ? (
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <FiChevronRight className="text-slate-400" />
                            {user.email}
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  {/* Tracking row */}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-extrabold text-slate-900">
                      <FiMapPin className="text-slate-600" />
                      Tracking: {trackingBadge.text}
                      <span className={cn("h-2 w-2 rounded-full", trackingBadge.dot)} />
                    </span>

                    <span className="text-[11px] text-slate-400">
                      Last: {lastPingAt ? lastPingAt.toLocaleString() : "-"}
                    </span>

                    <button
                      onClick={sendLocationOnce}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-900 hover:bg-slate-50 active:scale-[0.98] transition"
                      )}
                      type="button"
                    >
                      <FiRefreshCw className="text-slate-600" />
                      Send Now
                    </button>

                    {lastError ? (
                      <span className="text-[11px] text-red-500">{lastError}</span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2">
                {/* Quick Switch (mobile) */}
                <div className="sm:hidden">
                  <select
                    value={active}
                    onChange={(e) => setActive(e.target.value)}
                    className={cn(
                      "px-3 py-2 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-900",
                      "outline-none focus:ring-4 focus:ring-blue-600/10"
                    )}
                  >
                    {tabs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quick Buttons (desktop) */}
                <button
                  onClick={() => setActive("notifications")}
                  className="group hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition"
                  title="Open notifications"
                  type="button"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-900 group-hover:rotate-6 transition">
                    <FiBell className="text-orange-500" />
                  </span>
                  Notifications
                </button>

                <button
                  onClick={() => setActive("reports")}
                  className="group hidden sm:inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-extrabold text-slate-900 hover:bg-slate-100 active:scale-[0.98] transition"
                  title="Open reports"
                  type="button"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-900 group-hover:-rotate-6 transition">
                    <FiBarChart2 className="text-blue-600" />
                  </span>
                  Reports
                </button>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-900 hover:bg-slate-50 active:scale-[0.99] transition"
                  type="button"
                >
                  <FiLogOut className="text-red-500" />
                  Logout
                </button>
              </div>
            </div>

            {/* Animated section indicator */}
            <div className="px-4 md:px-6 pb-3">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-extrabold bg-white"
              >
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-1 text-slate-900">
                  {activeTitle}
                </span>
                <span className="text-slate-400 hidden sm:inline-flex items-center gap-1">
                  <FiChevronDown />
                  Switch from sidebar
                </span>
              </motion.div>
            </div>
          </header>

          {/* ===================== Section Content ===================== */}
          <section className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
            <div className="mx-auto w-full max-w-[1200px]">
              {/* Subtle animated container */}
              <motion.div variants={fadeUp} initial="hidden" animate="show">
                <SectionWrapper show={active === "leads"}>
                  <LeadManagement />
                </SectionWrapper>

                 <SectionWrapper show={active === "visitingplaced"}>
                  <VisitingPlaced />
                </SectionWrapper>   
                  
                  



                <SectionWrapper show={active === "followups"}>
                  <FollowUpSystem />
                </SectionWrapper>

                <SectionWrapper show={active === "quotes"}>
                  <QuotationInvoice />
                </SectionWrapper>

                <SectionWrapper show={active === "contacts"}>
                  <ContactsCompanies />
                </SectionWrapper>

                <SectionWrapper show={active === "team"}>
                  <TeamManagement />
                </SectionWrapper>

                <SectionWrapper show={active === "communication"}>
                  <CommunicationSystem />
                </SectionWrapper>

                <SectionWrapper show={active === "notifications"}>
                  <Notifications />
                </SectionWrapper>

                <SectionWrapper show={active === "reports"}>
                  <Reports />
                </SectionWrapper>
              </motion.div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default SalesDashboard;
