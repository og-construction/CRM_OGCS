// src/api/axiosClient.js
import axios from "axios";

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  
});

// 🔐 Attach token if available
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

export default axiosClient;
