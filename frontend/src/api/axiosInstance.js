import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, // dev/prod handled by Vite env
});

// 🔐 Attach token if available
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

export default axiosInstance;
