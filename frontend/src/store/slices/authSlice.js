// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../store/slices/authSlice";

// ✅ Login for both admin & sales
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/auth/login", credentials);
      localStorage.setItem("ogcs_crm_token", data.token);
      localStorage.setItem("ogcs_crm_user", JSON.stringify(data.user));
      return data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Login failed"
      );
    }
  }
);

// ✅ Admin creates Sales Executive
export const createSalesExecutive = createAsyncThunk(
  "auth/createSalesExecutive",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const token = getState().auth.token;
      const { data } = await axiosInstance.post(
        "/auth/sales-executive",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return data.user;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to create Sales Executive"
      );
    }
  }
);

const storedToken = localStorage.getItem("ogcs_crm_token");
const storedUser = localStorage.getItem("ogcs_crm_user");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: storedToken || null,
    user: storedUser ? JSON.parse(storedUser) : null,
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem("ogcs_crm_token");
      localStorage.removeItem("ogcs_crm_user");
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create Sales Executive
      .addCase(createSalesExecutive.pending, (state) => {
        state.error = null;
      })
      .addCase(createSalesExecutive.fulfilled, (state) => {
        // later you can push into users list if you manage it in redux
      })
      .addCase(createSalesExecutive.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
