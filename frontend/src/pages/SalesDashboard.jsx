// src/pages/SalesDashboard.jsx
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

import MyLeads from "../components/sales/MyLeads.jsx";
import Visits from "../components/sales/Visits";

// ✅ Location tracker hook
import useLocationTracker from "../hooks/useLocationTracker";

// Sales Components
import FollowUpSystem from "../components/sales/FollowUpSystem";
import QuotationInvoice from "../components/sales/QuotationInvoice";
import ContactsCompanies from "../components/sales/ContactsCompanies";
import TeamManagement from "../components/sales/TeamManagement";
import CommunicationSystem from "../components/sales/CommunicationSystem";
import SidebarButton from "../components/sales/SidebarButton";

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
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

const SectionWrapper = React.memo(function SectionWrapper({ show, children }) {
  return (
    <div className={show ? "block" : "hidden"} aria-hidden={!show}>
      {children}
    </div>
  );
});

export default function SalesDashboard() {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const [active, setActive] = useState("leads");
  const [mobileOpen, setMobileOpen] = useState(false);

  // ✅ Tracking enabled when user is logged in
  const trackingEnabled = !!user;
  const { status, lastPingAt, lastError, sendLocationOnce } = useLocationTracker({
    enabled: trackingEnabled,
  });

  // ✅ Location icon UI: green check if allowed/running, red cross if denied/error/off
  const locationUI = useMemo(() => {
    const ok = trackingEnabled && (status === "running" || status === "waiting");
    if (ok) return { ok: true, icon: <FiCheckCircle className="text-green-600" />, title: "Location allowed" };
    return { ok: false, icon: <FiXCircle className="text-red-500" />, title: "Location denied / off" };
  }, [status, trackingEnabled]);

  const handleLogout = useCallback(() => dispatch(logout()), [dispatch]);

  const tabs = useMemo(
    () => [
      { id: "leads", full: "My Leads", short: "Leads", icon: <FiTrendingUp /> },
      { id: "visits", full: "Visits", short: "Visits", icon: <FiMapPin /> },
      { id: "followups", full: "Follow-Up System", short: "Follow", icon: <FiClock /> },
      { id: "quotes", full: "Quotation / Invoice", short: "Quote", icon: <FiFileText /> },
      { id: "contacts", full: "Contacts & Companies", short: "Contacts", icon: <FiUsers /> },
      { id: "team", full: "Upload Daily Report", short: "Report", icon: <FiShield /> },
      { id: "communication", full: "Communication System", short: "Chat", icon: <FiMessageCircle /> },
      { id: "notifications", full: "Notifications", short: "Notify", icon: <FiBell /> },
      { id: "reports", full: "Reports Dashboard", short: "Reports", icon: <FiBarChart2 /> },
    ],
    []
  );

  const activeTab = useMemo(() => tabs.find((t) => t.id === active) || tabs[0], [tabs, active]);
  const activeTitle = activeTab?.full || "My Leads";

  const initials = useMemo(() => {
    const n = String(user?.name || "Sales Executive").trim();
    const parts = n.split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] || "S";
    const b = parts[1]?.[0] || "";
    return (a + b).toUpperCase();
  }, [user?.name]);

  // Close drawer on tab change
  useEffect(() => {
    if (mobileOpen) setMobileOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ESC close drawer
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => e.key === "Escape" && setMobileOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  // Lock body scroll when drawer open (mobile UX)
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const onSelectTab = useCallback((id) => setActive(id), []);

  const fadeUp = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  };

  const drawer = {
    hidden: { x: "-100%" },
    show: { x: 0, transition: { type: "spring", stiffness: 260, damping: 28 } },
    exit: { x: "-100%", transition: { duration: 0.2 } },
  };

  const HeaderIcon = activeTab?.icon;

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      <div className="flex min-h-[100dvh]">
        {/* ===================== Sidebar (Desktop) ===================== */}
        <aside className="hidden md:flex w-72 lg:w-80 bg-white border-r border-slate-200 flex-col">
          {/* Brand */}
          <div className="px-5 py-5 border-b border-slate-200">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                    <FiHome />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-extrabold text-slate-900 leading-tight">OGCS CRM</h1>
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
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      title={locationUI.title}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold text-slate-900"
                    >
                      <FiMapPin className="text-slate-700" />
                      {locationUI.icon}
                    </span>

                    <button
                      onClick={sendLocationOnce}
                      className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 active:scale-[0.98] transition"
                      title="Send location now"
                      type="button"
                      aria-label="Ping location"
                    >
                      <FiRefreshCw className="text-slate-700" />
                    </button>
                  </div>

                  <div className="mt-1 text-[10px] text-slate-400 truncate">
                    Last: {lastPingAt ? lastPingAt.toLocaleString("en-IN") : "-"}
                  </div>

                  {lastError ? <div className="mt-1 text-[10px] text-red-500">{lastError}</div> : null}
                </div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {tabs.map((t) => (
              <SidebarButton key={t.id} label={t.full} active={active === t.id} onClick={() => onSelectTab(t.id)} />
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
                className="fixed z-50 left-0 top-0 bottom-0 w-[88%] max-w-[360px] md:hidden bg-white border-r border-slate-200 flex flex-col"
                variants={drawer}
                initial="hidden"
                animate="show"
                exit="exit"
                role="dialog"
                aria-modal="true"
                aria-label="Navigation"
              >
                <div className="px-4 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-extrabold">
                      <FiHome />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900 truncate">OGCS CRM</div>
                      <div className="text-[11px] text-slate-400 truncate">Sales Panel</div>
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
                      <div className="text-sm font-extrabold text-slate-900 truncate">{user?.name || "Sales Executive"}</div>
                      <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                        <FiMail className="shrink-0" />
                        <span className="truncate">{user?.email || "-"}</span>
                      </div>

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          title={locationUI.title}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[10px] font-extrabold text-slate-900"
                        >
                          <FiMapPin className="text-slate-700" />
                          {locationUI.icon}
                        </span>

                        <button
                          onClick={sendLocationOnce}
                          className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50"
                          type="button"
                          aria-label="Ping location"
                          title="Send location now"
                        >
                          <FiRefreshCw className="text-slate-700" />
                        </button>
                      </div>

                      {lastError ? <div className="mt-1 text-[10px] text-red-500">{lastError}</div> : null}
                    </div>
                  </div>
                </div>

                <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTab(t.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl border transition flex items-center justify-between gap-3",
                        "focus:outline-none focus:ring-4 focus:ring-blue-600/10",
                        active === t.id
                          ? "bg-blue-600 text-white border-slate-200"
                          : "bg-white border-slate-200 hover:bg-slate-50 text-slate-900"
                      )}
                    >
                      <span className="flex items-center gap-2 font-extrabold text-sm min-w-0">
                        <span className={cn("shrink-0", active === t.id ? "text-white" : "text-slate-600")}>{t.icon}</span>
                        <span className="truncate">{t.full}</span>
                      </span>
                      <FiChevronRight className="shrink-0" />
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
            <div className="h-1 w-full bg-blue-600" />

            {/* ✅ Desktop header */}
            <div className="hidden md:flex px-4 py-3 md:px-6 md:py-4 items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={cn(
                    "inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200",
                    "bg-slate-50 text-slate-900 shrink-0"
                  )}
                  title={activeTitle}
                  aria-label="Active section"
                >
                  {HeaderIcon}
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
                        <span className="truncate">{user.email}</span>
                      </span>
                    ) : null}
                  </p>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-extrabold text-slate-900"
                      title={locationUI.title}
                    >
                      <FiMapPin className={cn("text-slate-700")} />
                      {locationUI.icon}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      Last: {lastPingAt ? lastPingAt.toLocaleString("en-IN") : "-"}
                    </span>

                    <button
                      onClick={sendLocationOnce}
                      className={cn(
                        "inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-2 py-1 hover:bg-slate-50 active:scale-[0.98] transition",
                        "focus:outline-none focus:ring-4 focus:ring-blue-600/10"
                      )}
                      type="button"
                      title="Send location now"
                      aria-label="Ping location"
                    >
                      <FiRefreshCw className="text-slate-700" />
                    </button>

                    {lastError ? <span className="text-[11px] text-red-500">{lastError}</span> : null}
                  </div>
                </div>
              </div>

              {/* Right actions */}
              <div className="flex items-center gap-2 shrink-0">
                <HeaderAction
                  active={active === "notifications"}
                  onClick={() => onSelectTab("notifications")}
                  title="Notifications"
                  aria="Open notifications"
                  icon={<FiBell className="text-slate-900" />}
                />
                <HeaderAction
                  active={active === "reports"}
                  onClick={() => onSelectTab("reports")}
                  title="Reports"
                  aria="Open reports"
                  icon={<FiBarChart2 className="text-slate-900" />}
                />
                <HeaderAction
                  danger
                  onClick={handleLogout}
                  title="Logout"
                  aria="Logout"
                  icon={<FiLogOut className="text-red-500" />}
                />
              </div>
            </div>

            {/* ✅ Mobile header: Menu + Title + right icons */}
            <div className="md:hidden px-3 py-3 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
                aria-label="Open menu"
                title="Menu"
              >
                <FiMenu className="text-slate-900" />
              </button>

              <div className="min-w-0 flex-1">
                <div className="text-sm font-extrabold text-slate-900 truncate">{activeTitle}</div>
                <div className="text-[11px] text-slate-400 truncate">
                  {user?.name || "Sales Executive"}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSelectTab("notifications")}
                  className={cn(
                    "h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition",
                    active === "notifications" ? "ring-4 ring-blue-600/10" : ""
                  )}
                  aria-label="Open notifications"
                  title="Notifications"
                >
                  <FiBell className="text-slate-900" />
                </button>

                <button
                  type="button"
                  onClick={sendLocationOnce}
                  className="h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
                  aria-label="Send location now"
                  title={locationUI.title}
                >
                  <FiMapPin className={cn("text-xl", locationUI.ok ? "text-green-600" : "text-red-500")} />
                </button>
              </div>
            </div>
          </header>

          {/* ===================== Section Content ===================== */}
          <section className="flex-1 p-3 sm:p-4 md:p-6 min-w-0">
            <div className="mx-auto w-full max-w-[1200px]">
              <motion.div initial="hidden" animate="show" variants={fadeUp}>
                <SectionWrapper show={active === "leads"}>
                  <MyLeads />
                </SectionWrapper>

                <SectionWrapper show={active === "visits"}>
                  <Visits />
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

          {/* ✅ Mobile bottom bar (Professional) */}
          <div className="md:hidden sticky bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="mx-auto max-w-[1200px] px-2 py-2 flex items-center justify-between gap-1">
              <BottomTabButton label="Leads" active={active === "leads"} onClick={() => onSelectTab("leads")} />
              <BottomTabButton label="Visits" active={active === "visits"} onClick={() => onSelectTab("visits")} />
              <BottomTabButton label="Follow" active={active === "followups"} onClick={() => onSelectTab("followups")} />
              <BottomTabButton label="Reports" active={active === "reports"} onClick={() => onSelectTab("reports")} />

              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="shrink-0 h-10 w-10 rounded-2xl border border-slate-200 bg-white flex items-center justify-center hover:bg-slate-50 transition"
                aria-label="More"
                title="More"
              >
                <FiMenu className="text-slate-900" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ------------------------------
   Small UI Components
------------------------------ */
function HeaderAction({ active, onClick, title, aria, icon, danger = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={aria}
      className={cn(
        "h-10 w-10 rounded-2xl border bg-white flex items-center justify-center transition",
        "border-slate-200 hover:bg-slate-50",
        active ? "ring-4 ring-blue-600/10" : "",
        danger ? "focus:ring-4 focus:ring-red-500/10" : "focus:ring-4 focus:ring-blue-600/10"
      )}
    >
      {icon}
    </button>
  );
}

function BottomTabButton({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-2xl px-2 py-2 text-[11px] font-extrabold border transition",
        active ? "bg-blue-600 text-white border-slate-200" : "bg-white text-slate-900 border-slate-200 hover:bg-slate-50"
      )}
    >
      {label}
    </button>
  );
}