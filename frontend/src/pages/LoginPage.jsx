// src/pages/LoginPage.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiLogIn } from "react-icons/fi";

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  // Redirect after login based on role
  useEffect(() => {
    if (token && user) {
      if (user.role === "admin") {
        navigate("/admin", { replace: true });
      } else if (user.role === "sales") {
        navigate("/sales", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [token, user, navigate]);

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;
    await dispatch(loginUser(formData));
  };

  return (
    <div className="min-h-screen bg-[#EFF6FF]">
      {/* soft background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Brand Panel */}
          <div className="hidden md:flex flex-col gap-4 pr-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-sky-100 px-3 py-1 shadow-sm w-fit">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-slate-600">
                Secure OGCS CRM Access
              </span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 leading-snug">
              Welcome to <span className="text-sky-700">OGCS CRM</span>
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              Centralize your leads, follow-ups, and project communication in one
              place. Login to manage your daily operations—whether you are in
              <span className="font-semibold text-slate-800"> admin</span> or
              <span className="font-semibold text-slate-800">
                {" "}
                sales & business development
              </span>
              .
            </p>

            <div className="mt-2 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                <div className="text-xs text-slate-500">Faster follow-ups</div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  Track every lead
                </div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm">
                <div className="text-xs text-slate-500">Centralized work</div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  One dashboard
                </div>
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="w-full">
            {/* Mobile brand header (so it looks premium on phone too) */}
            <div className="md:hidden mb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-3 py-1 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-semibold text-slate-700">
                  OGCS CRM Login
                </span>
              </div>
              <h1 className="mt-3 text-2xl font-extrabold text-slate-900 leading-snug">
                Welcome back
              </h1>
              <p className="mt-1 text-sm text-slate-600">
                Sign in to continue to your dashboard.
              </p>
            </div>

            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-xl border border-slate-100 p-5 sm:p-7">
              <div className="mb-5 text-center md:text-left">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  Login to OGCS CRM
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Use your registered email and password to access your account.
                </p>
              </div>

              {error && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-3 text-xs sm:text-sm text-red-700">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
                      <FiMail />
                    </span>
                    <input
                      type="email"
                      name="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-2xl pl-10 pr-3 py-3 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 transition"
                      placeholder="you@ogcs.co.in"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
                      <FiLock />
                    </span>
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-2xl pl-10 pr-3 py-3 text-sm bg-white focus:outline-none focus:ring-4 focus:ring-sky-100 focus:border-sky-400 transition"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-2xl bg-slate-900 hover:opacity-95 text-white text-sm font-semibold py-3 transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm active:scale-[0.99]"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <FiLogIn className="text-sm" />
                      <span>Sign in</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                <p className="text-[11px] sm:text-xs text-slate-600">
                  Access for authorized OGCS team members only.
                </p>
              </div>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-400">
              © {new Date().getFullYear()} OGCS CRM
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
