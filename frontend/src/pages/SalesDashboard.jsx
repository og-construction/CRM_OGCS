// src/pages/SalesDashboard.jsx
import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../store/slices/authSlice";

const SalesDashboard = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-800">
            OGCS CRM – Sales Dashboard
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

      <main className="flex-1 p-4 md:p-6">
        <h2 className="text-base font-bold text-slate-800 mb-3">
          Welcome, {user?.name}
        </h2>
        <p className="text-sm text-slate-600">
          Here later we will show your leads, follow-ups, and daily targets.
        </p>
      </main>
    </div>
  );
};

export default SalesDashboard;
