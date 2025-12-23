import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

export const fetchDailyReports = createAsyncThunk(
  "dailyReports/fetchDailyReports",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/admin/daily-reports", { params });
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const dailyReportsSlice = createSlice({
  name: "dailyReports",
  initialState: {
    summary: null,
    reports: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyReports.fulfilled, (state, action) => {
        state.loading = false;
        state.summary = action.payload.summary;
        state.reports = action.payload.reports;
      })
      .addCase(fetchDailyReports.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default dailyReportsSlice.reducer;
