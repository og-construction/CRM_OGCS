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
    <div className="min-h-screen bg-[#EFF6FF] flex items-center justify-center px-4">
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
        </div>

        {/* Right Login Card */}
        <div className="w-full">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8">
            <div className="mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Login to OGCS CRM
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Use your registered email and password to access your account.
              </p>
            </div>

            {error && (
              <div className="mb-4 text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    placeholder="you@ogcs.co.in"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1.5">
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
                    className="w-full border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full inline-flex justify-center items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-semibold py-2.5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
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

            <p className="mt-4 text-[11px] sm:text-xs text-slate-400 text-center">
              Access for authorized OGCS team members only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
