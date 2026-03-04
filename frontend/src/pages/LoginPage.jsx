// src/pages/LoginPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../store/slices/authSlice";
import { useNavigate } from "react-router-dom";
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from "react-icons/fi";

const cn = (...a) => a.filter(Boolean).join(" ");

const LoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, token, user } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

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

  const canSubmit = useMemo(() => {
    return String(formData.email || "").trim() && String(formData.password || "").trim();
  }, [formData.email, formData.password]);

  const handleChange = (e) => {
    if (error) dispatch(clearError());
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;
    await dispatch(loginUser(formData));
  };

  return (
    <div className="min-h-[100dvh] bg-slate-50">
      {/* Soft background (responsive + premium) */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-28 -left-28 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
        <div className="absolute -bottom-28 -right-28 h-80 w-80 rounded-full bg-slate-100 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-100 blur-3xl" />
      </div>

      <div className="relative min-h-[100dvh] flex items-center justify-center px-3 sm:px-4 md:px-6 py-8">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          {/* Left Brand Panel (shows from lg) */}
          <div className="hidden lg:flex flex-col justify-between rounded-3xl border border-slate-200 bg-white/70 backdrop-blur-sm p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1 shadow-sm w-fit">
                <span className="h-2 w-2 rounded-full bg-green-600" />
                <span className="text-xs font-semibold text-slate-600">
                  Secure OGCS CRM Access
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-extrabold text-slate-900 leading-snug">
                Welcome to <span className="text-blue-600">OGCS CRM</span>
              </h1>

              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                Centralize leads, follow-ups, and reporting in one place. Login to manage your daily
                operations for <span className="font-semibold text-slate-900">Admin</span> and{" "}
                <span className="font-semibold text-slate-900">Sales</span> teams.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-400">Faster follow-ups</div>
                  <div className="mt-1 text-sm font-extrabold text-slate-900">
                    Track every lead
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs text-slate-400">Centralized work</div>
                  <div className="mt-1 text-sm font-extrabold text-slate-900">
                    One dashboard
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-xs font-extrabold text-slate-900">Tip</div>
              <div className="mt-1 text-sm text-slate-600">
                Use your official company email. If you face issues, contact the admin team.
              </div>
            </div>
          </div>

          {/* Right Login Card */}
          <div className="w-full flex items-center">
            <div className="w-full">
              {/* Mobile/Tablet header */}
              <div className="lg:hidden mb-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-slate-200 px-3 py-1 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-green-600" />
                  <span className="text-xs font-extrabold text-slate-900">
                    OGCS CRM Login
                  </span>
                </div>

                <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
                  Welcome back
                </h1>
                <p className="mt-1 text-sm text-slate-600">
                  Sign in to continue to your dashboard.
                </p>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-sm p-5 sm:p-7">
                <div className="mb-5">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                    Login to OGCS CRM
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">
                    Use your registered email and password.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 rounded-2xl border border-red-500/30 bg-white px-3.5 py-3 text-xs sm:text-sm text-red-500">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-xs sm:text-sm font-extrabold text-slate-900 mb-1.5">
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
                        className={cn(
                          "w-full border border-slate-200 rounded-2xl pl-10 pr-3 py-3 text-sm bg-white",
                          "text-slate-900 outline-none transition",
                          "focus:ring-4 focus:ring-slate-100 focus:border-slate-200"
                        )}
                        placeholder="you@ogcs.co.in"
                        inputMode="email"
                      />
                    </div>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Use your official email.
                    </p>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs sm:text-sm font-extrabold text-slate-900 mb-1.5">
                      Password
                    </label>

                    <div className="relative">
                      <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 text-sm">
                        <FiLock />
                      </span>

                      <input
                        type={showPass ? "text" : "password"}
                        name="password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                        className={cn(
                          "w-full border border-slate-200 rounded-2xl pl-10 pr-12 py-3 text-sm bg-white",
                          "text-slate-900 outline-none transition",
                          "focus:ring-4 focus:ring-slate-100 focus:border-slate-200"
                        )}
                        placeholder="Enter your password"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPass((v) => !v)}
                        className="absolute inset-y-0 right-2 inline-flex items-center justify-center w-10 rounded-xl border border-transparent hover:bg-slate-50 text-slate-600"
                        aria-label={showPass ? "Hide password" : "Show password"}
                        title={showPass ? "Hide password" : "Show password"}
                      >
                        {showPass ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2">
                      <p className="text-[11px] text-slate-400">
                        Keep your password secure.
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formData.password?.length ? `${formData.password.length} chars` : ""}
                      </p>
                    </div>
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading || !canSubmit}
                    className={cn(
                      "w-full inline-flex justify-center items-center gap-2 rounded-2xl",
                      "bg-blue-600 text-white text-sm font-extrabold py-3",
                      "transition disabled:opacity-60 disabled:cursor-not-allowed",
                      "active:scale-[0.99]"
                    )}
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

                  {/* Footer info */}
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-3">
                    <p className="text-[11px] sm:text-xs text-slate-600">
                      Access for authorized OGCS team members only.
                    </p>
                  </div>
                </form>
              </div>

              <p className="mt-3 text-center text-[11px] text-slate-400">
                © {new Date().getFullYear()} OGCS CRM
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;