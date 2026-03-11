import axios from "axios";
import toast from "react-hot-toast";

/*
|--------------------------------------------------------------------------
| Detect Environment
|--------------------------------------------------------------------------
*/

const isProduction = import.meta.env.PROD;

/*
|--------------------------------------------------------------------------
| Resolve API Base URL
|--------------------------------------------------------------------------
*/

let API_BASE_URL;

if (isProduction) {
  API_BASE_URL = import.meta.env.VITE_API_BASE_URL_PROD;
} else {
  API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL_DEV ||
    "http://localhost:3181/api"; // fallback for local
}

/*
|--------------------------------------------------------------------------
| Axios Instance
|--------------------------------------------------------------------------
*/

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Debug
|--------------------------------------------------------------------------
*/

console.log("🌐 API BASE URL:", API_BASE_URL);

/*
|--------------------------------------------------------------------------
| Request Interceptor
|--------------------------------------------------------------------------
*/

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("ogcs_crm_token");

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

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {

    if (!error.response) {
      console.error("❌ Network / CORS Error:", error);
      toast.error("Unable to connect to server.");
      return Promise.reject(error);
    }

    const status = error.response.status;

    if (status === 401) {
      localStorage.removeItem("ogcs_crm_token");
      localStorage.removeItem("ogcs_crm_user");

      toast.error("Session expired. Please login again.");

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 403) {
      toast.error(error.response?.data?.message || "Access denied.");
    }

    if (status === 404) {
      toast.error("API endpoint not found.");
    }

    if (status >= 500) {
      toast.error("Server error. Please try later.");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;