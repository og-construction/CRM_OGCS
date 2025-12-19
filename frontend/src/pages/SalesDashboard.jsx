// src/pages/SalesDashboard.jsx
import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

// Sales Components
import LeadManagement from "../components/sales/LeadManagement";
import FollowUpSystem from "../components/sales/FollowUpSystem";
import QuotationInvoice from "../components/sales/QuotationInvoice";
import ContactsCompanies from "../components/sales/ContactsCompanies";
import TeamManagement from "../components/sales/TeamManagement";
import CommunicationSystem from "../components/sales/CommunicationSystem";
import SidebarButton from "../components/sales/SidebarButton";

const SalesDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [active, setActive] = useState("leads");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false); // UI only

  const handleLogout = () => {
    dispatch(logout());
  };

  const renderSection = () => {
    switch (active) {
      case "leads":
        return <LeadManagement />;
      case "followups":
        return <FollowUpSystem />;
      case "quotes":
        return <QuotationInvoice />;
      case "contacts":
        return <ContactsCompanies />;
      case "team":
        return <TeamManagement />;
      case "communication":
        return <CommunicationSystem />;
      default:
        return <LeadManagement />;
    }
  };

  const tabs = [
    { id: "leads", label: "Leads", full: "Lead Management" },
    { id: "followups", label: "Follow-Ups", full: "Follow-Up System" },
    { id: "quotes", label: "Quotes", full: "Quotation & Invoice" },
    { id: "contacts", label: "Contacts", full: "Contacts & Companies" },
    { id: "team", label: "Team", full: "Upload daily report" },
    { id: "communication", label: "Comm", full: "Communication System" },
  ];

  const activeTitle =
    tabs.find((t) => t.id === active)?.full || "Lead Management";

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      <div className="flex min-h-screen">
        {/* Sidebar (Desktop) */}
        <aside className="hidden md:flex w-72 bg-white/90 backdrop-blur border-r border-slate-200 flex-col">
          <div className="px-5 py-5 border-b border-slate-100">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-lg font-extrabold text-slate-900">
                  OGCS CRM
                </h1>
                <p className="text-xs text-slate-500">
                  Sales Executive Panel
                </p>
              </div>
              <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-700">
                Sales
              </span>
            </div>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1">
            <SidebarButton
              label="Lead Management"
              active={active === "leads"}
              onClick={() => setActive("leads")}
            />
            <SidebarButton
              label="Follow-Up System"
              active={active === "followups"}
              onClick={() => setActive("followups")}
            />
            <SidebarButton
              label="Quotation & Invoice"
              active={active === "quotes"}
              onClick={() => setActive("quotes")}
            />
            <SidebarButton
              label="Contacts & Companies"
              active={active === "contacts"}
              onClick={() => setActive("contacts")}
            />
            <SidebarButton
              label="Upload daily report"
              active={active === "team"}
              onClick={() => setActive("team")}
            />
            <SidebarButton
              label="Communication System"
              active={active === "communication"}
              onClick={() => setActive("communication")}
            />
          </nav>

          <div className="px-5 py-4 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-1">Logged in as</p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {user?.name || "Sales Executive"}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {user?.email || ""}
            </p>

            <button
              onClick={handleLogout}
              className="mt-3 w-full text-xs font-semibold text-red-700 border border-red-200 rounded-2xl py-2 hover:bg-red-50 active:scale-[0.99] transition"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main area */}
        <main className="flex-1 flex flex-col min-w-0">
          {/* Top header */}
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
            <div className="px-4 py-3 md:px-6 md:py-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-base md:text-lg font-extrabold text-slate-900 truncate">
                  OGCS CRM – Sales Dashboard
                </h1>
                <p className="text-xs text-slate-500 truncate">
                  <span className="font-semibold text-slate-700">
                    {user?.name || "Sales Executive"}
                  </span>{" "}
                  {user?.email ? <>(• {user.email})</> : null}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(true)}
                  className="md:hidden inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                >
                  Menu
                </button>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center rounded-2xl border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 active:scale-[0.99] transition"
                >
                  Logout
                </button>
              </div>
            </div>

            {/* Mobile: scroll tabs (bigger touch targets, no cut) */}
            <div className="md:hidden border-t border-slate-100 px-3 py-2">
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={`shrink-0 px-3 py-2 text-[12px] font-semibold rounded-2xl border whitespace-nowrap transition ${
                      active === tab.id
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="text-[11px] text-slate-500 truncate">
                  Section:
                </div>
                <div className="min-w-0 text-[11px] font-semibold text-slate-800 truncate">
                  {activeTitle}
                </div>
              </div>
            </div>
          </header>

          {/* Mobile menu drawer (UI only) */}
          {mobileMenuOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/40"
                onClick={() => setMobileMenuOpen(false)}
              />
              <div className="absolute right-0 top-0 h-full w-[86%] max-w-sm bg-white shadow-2xl border-l border-slate-200">
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-extrabold text-slate-900">
                        OGCS CRM
                      </div>
                      <div className="text-xs text-slate-500">
                        Sales Executive Panel
                      </div>
                    </div>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.99]"
                    >
                      Close
                    </button>
                  </div>

                  <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">Logged in as</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900 truncate">
                      {user?.name || "Sales Executive"}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {user?.email || ""}
                    </div>
                  </div>
                </div>

                <div className="p-3 space-y-1">
                  {tabs.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActive(t.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full text-left rounded-2xl border px-3 py-3 text-sm font-semibold transition ${
                        active === t.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      {t.full}
                    </button>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 active:scale-[0.99]"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Section content */}
          <section className="flex-1 p-4 md:p-6 min-w-0">
            <div className="mx-auto w-full max-w-[1200px]">
              {renderSection()}
            </div>
          </section>

          {/* Mobile bottom nav (optional UI upgrade, no logic change) */}
          <div className="md:hidden sticky bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur">
            <div className="px-2 py-2">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "leads", label: "Leads" },
                  { id: "followups", label: "Follow-Ups" },
                  { id: "quotes", label: "Quotes" },
                  { id: "contacts", label: "Contacts" },
                  { id: "team", label: "Team" },
                  { id: "communication", label: "Comm" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActive(tab.id)}
                    className={`rounded-2xl border px-2 py-2 text-[11px] font-semibold transition ${
                      active === tab.id
                        ? "bg-slate-900 text-white border-slate-900"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SalesDashboard;
