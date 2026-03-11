import axios from "axios";
import toast from "react-hot-toast";

/*
|--------------------------------------------------------------------------
| Detect Environment
|--------------------------------------------------------------------------
*/

const isProd = import.meta.env.PROD;

/*
|--------------------------------------------------------------------------
| Resolve API Base URL
|--------------------------------------------------------------------------
*/

let API_BASE_URL;

if (isProd) {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PROD;
} else {
  API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL_DEV || "http://localhost:3181/api";
}

/*
|--------------------------------------------------------------------------
| Axios Instance
|--------------------------------------------------------------------------
*/

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Debug Log
|--------------------------------------------------------------------------
*/

console.log("🌐 API BASE URL:", API_BASE_URL);

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Response Interceptor
|--------------------------------------------------------------------------
*/

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {

    if (!error.response) {
      console.error("❌ Network / CORS error:", error);
      toast.error("Unable to connect to server.");
      return Promise.reject(error);
    }

    const status = error.response.status;
    const message =
      error.response?.data?.message ||
      error.response?.data?.error ||
      "Something went wrong";

    const requestUrl = error.config?.url || "";
    const currentPath = window.location.pathname;

    const isLoginRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/api/auth/login");

    if (status === 401) {
      if (!isLoginRequest) {
        localStorage.removeItem("ogcs_crm_token");
        localStorage.removeItem("ogcs_crm_user");

        if (currentPath !== "/login") {
          toast.error("Session expired. Please login again.");
          window.location.href = "/login";
        }
      }
    } 
    else if (status === 403) {
      toast.error(message || "Access denied.");
    } 
    else if (status === 404) {
      toast.error(message || "Requested resource not found.");
    } 
    else if (status >= 500) {
      toast.error(message || "Server error. Please try later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;