import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

export const fetchAdminOverview = createAsyncThunk(
  "adminOverview/fetchAdminOverview",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/admin/overview");
      return res.data; // { quotes: {...}, leads: {...}, ... }
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const adminOverviewSlice = createSlice({
  name: "adminOverview",
  initialState: {
    stats: null,
    loading: false,
    error: null,
  },
  reducers: {
    resetAdminOverview: (state) => {
      state.stats = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminOverview.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminOverview.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminOverview.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load overview";
      });
  },
});

export const { resetAdminOverview } = adminOverviewSlice.actions;
export default adminOverviewSlice.reducer;
