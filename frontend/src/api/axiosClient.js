import axios from "axios";
import toast from "react-hot-toast";

const API_BASE_URL =
  import.meta.env.VITE_APP_ENV === "production"
    ? import.meta.env.VITE_API_BASE_URL_PROD || import.meta.env.VITE_API_BASE_URL
    : import.meta.env.VITE_API_BASE_URL;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

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

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === "Network Error" || !error.response) {
      console.error("❌ Network/CORS Error:", error);
      toast.error("Unable to connect to server. Please check API/CORS settings.");
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("ogcs_crm_token");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;