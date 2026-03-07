import axios from "axios";
import toast from "react-hot-toast";

const isProd = import.meta.env.PROD;

const API_BASE_URL = isProd
  ? import.meta.env.VITE_API_BASE_URL_PROD
  : import.meta.env.VITE_API_BASE_URL_DEV;

// Fallback protection
if (!API_BASE_URL) {
  console.error("❌ Missing API base URL in Vite env");
}

const axiosInstance = axios.create({
  baseURL: API_BASE_URL || "http://localhost:3181/api",
  withCredentials: false,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Optional debug
if (!isProd) {
  console.log("✅ Axios Base URL:", API_BASE_URL || "http://localhost:3181/api");
}

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ogcs_crm_token");

    if (!config.headers) {
      config.headers = {};
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error("❌ Network / CORS error:", error);
      toast.error("Unable to connect to server. Please check backend and CORS.");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Something went wrong";

    const requestUrl = error.config?.url || "";
    const currentPath = window.location.pathname;

    // Do not auto-logout on login API failure
    const isLoginRequest =
      requestUrl.includes("/auth/login") || requestUrl.includes("/api/auth/login");

    if (status === 401) {
      if (!isLoginRequest) {
        localStorage.removeItem("ogcs_crm_token");
        localStorage.removeItem("ogcs_crm_user");

        if (currentPath !== "/login") {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        }
      }
    } else if (status === 403) {
      toast.error(message || "Access denied.");
    } else if (status === 404) {
      toast.error(message || "Requested resource not found.");
    } else if (status >= 500) {
      toast.error(message || "Server error. Please try later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;



































// import axios from "axios";
// import toast from "react-hot-toast";

// /*
// |--------------------------------------------------------------------------
// | Base API URL
// |--------------------------------------------------------------------------
// */
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// /*
// |--------------------------------------------------------------------------
// | Axios Instance
// |--------------------------------------------------------------------------
// */
// const axiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: false, // JWT token auth only
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
 
// /*
// |--------------------------------------------------------------------------
// | Request Interceptor
// |--------------------------------------------------------------------------
// */
// axiosInstance.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("ogcs_crm_token");

//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }

//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// /*
// |--------------------------------------------------------------------------
// | Response Interceptor
// |--------------------------------------------------------------------------
// */
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     if (!error.response) {
//       console.error("❌ Network / CORS error:", error);
//       toast.error("Unable to connect to server. Please check backend and CORS.");
//       return Promise.reject(error);
//     }

//     const status = error.response.status;

//     if (status === 401) {
//       localStorage.removeItem("ogcs_crm_token");
//       toast.error("Session expired. Please login again.");
//       window.location.href = "/login";
//     } else if (status === 403) {
//       toast.error(error.response?.data?.message || "Access denied.");
//     } else if (status >= 500) {
//       toast.error("Server error. Please try later.");
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;