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
| Select API Base URL
|--------------------------------------------------------------------------
*/

const API_BASE_URL = isProduction
  ? import.meta.env.VITE_API_BASE_URL_PROD
  : import.meta.env.VITE_API_BASE_URL_DEV;

/*
|--------------------------------------------------------------------------
| Axios Instance
|--------------------------------------------------------------------------
*/

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: false,
  headers: {
    "Content-Type": "application/json",
  },
});

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

    if (status >= 500) {
      toast.error("Server error. Please try later.");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;













// import axios from "axios";
// import toast from "react-hot-toast";

// const axiosClient = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL,
//   withCredentials: false,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// axiosClient.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem("ogcs_crm_token");
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// axiosClient.interceptors.response.use(
//   (response) => response, 
//   (error) => {
//     if (!error.response) {
//       console.error("❌ CORS or Network Error:", error);
//       toast.error("Unable to connect to server. Please check backend and CORS.");
//       return Promise.reject(error);
//     }

//     if (error.response?.status === 401) {
//       localStorage.removeItem("ogcs_crm_token");
//       toast.error("Session expired. Please login again.");
//       window.location.href = "/login";
//     }

//     if (error.response?.status === 403) {
//       toast.error(error.response?.data?.message || "Access denied.");
//     }

//     if (error.response?.status >= 500) {
//       toast.error("Server error. Please try later.");
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosClient;