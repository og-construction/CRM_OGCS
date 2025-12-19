// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

/* ======================================================
   LOGIN (Admin + Sales)
====================================================== */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/login", { email, password });
      // backend: { status: "success", data: { token, user } }
      const { token, user } = res.data.data;

      localStorage.setItem("ogcs_crm_token", token);
      localStorage.setItem("ogcs_crm_user", JSON.stringify(user));

      return { token, user };
    } catch (err) {
      const msg =
        err.response?.data?.message || "Login failed. Please try again.";
      return rejectWithValue(msg);
    }
  }
);

/* ======================================================
   FETCH SALES EXECUTIVES (Admin Only)
====================================================== */
export const fetchSalesExecutives = createAsyncThunk(
  "auth/fetchSalesExecutives",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/auth/sales-executive");
      // backend: { status: "success", data: [ ... ] }
      return res.data.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Server error while fetching sales executives.";
      return rejectWithValue(msg);
    }
  }
);

/* ======================================================
   CREATE SALES EXECUTIVE (Admin)
====================================================== */
export const createSalesExecutive = createAsyncThunk(
  "auth/createSalesExecutive",
  async (payload, { rejectWithValue }) => {
    try {
      // payload = form data from UsersSection (name, email, phone, aadhaar, etc.)
      const res = await axiosClient.post("/auth/sales-executive", payload);
      // backend: { status: "success", data: { ...user } }
      return res.data.data;
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Server error while creating sales executive.";
      return rejectWithValue(msg);
    }
  }
);

/* ======================================================
   INITIAL STATE
====================================================== */
const initialToken = localStorage.getItem("ogcs_crm_token");
const initialUser = localStorage.getItem("ogcs_crm_user");

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialToken || null,
    user: initialUser ? JSON.parse(initialUser) : null,
    loading: false,
    error: null,

    // Sales executives data
    salesExecutives: [],
    salesLoading: false,
  },

  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;

      localStorage.removeItem("ogcs_crm_token");
      localStorage.removeItem("ogcs_crm_user");
    },

    clearError(state) {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    /* -------------------------
       LOGIN USER
    ------------------------- */
    builder
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
      });

    /* -------------------------
       FETCH SALES EXECUTIVES
    ------------------------- */
    builder
      .addCase(fetchSalesExecutives.pending, (state) => {
        state.salesLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesExecutives.fulfilled, (state, action) => {
        state.salesLoading = false;
        state.salesExecutives = action.payload || [];
      })
      .addCase(fetchSalesExecutives.rejected, (state, action) => {
        state.salesLoading = false;
        state.error = action.payload;
      });

    /* -------------------------
       CREATE SALES EXECUTIVE
    ------------------------- */
    builder
      .addCase(createSalesExecutive.pending, (state) => {
        state.error = null;
      })
      .addCase(createSalesExecutive.fulfilled, (state, action) => {
        // Instantly add created user to the list
        if (action.payload) {
          state.salesExecutives = [action.payload, ...state.salesExecutives];
        }
      })
      .addCase(createSalesExecutive.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
