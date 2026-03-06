import axios from "axios";
import toast from "react-hot-toast";

/*
|--------------------------------------------------------------------------
| Base API URL
| Automatically works for both local and production
|--------------------------------------------------------------------------
*/
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

/*
|--------------------------------------------------------------------------
| Axios Instance
|--------------------------------------------------------------------------
*/
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false, // Not required for JWT token auth
  headers: {
    "Content-Type": "application/json",
  },
});

/*
|--------------------------------------------------------------------------
| Request Interceptor
| Attach JWT token automatically
|--------------------------------------------------------------------------
*/
axiosInstance.interceptors.request.use(
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
| Global Error Handling
|--------------------------------------------------------------------------
*/
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network / CORS Errors
    if (!error.response) {
      console.error("❌ Network or CORS error:", error);
      toast.error("Unable to connect to server. Please try again.");
      return Promise.reject(error);
    }

    const status = error.response.status;

    // Unauthorized
    if (status === 401) {
      localStorage.removeItem("ogcs_crm_token");
      toast.error("Session expired. Please login again.");
      window.location.href = "/login";
    }

    // Forbidden
    if (status === 403) {
      toast.error("Access denied.");
    }

    // Server error
    if (status >= 500) {
      toast.error("Server error. Please try later.");
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;