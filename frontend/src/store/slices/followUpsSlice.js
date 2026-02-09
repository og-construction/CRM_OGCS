// src/store/slices/followUpsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

// ✅ GET /api/leads/my/followups/summary
export const fetchFollowUpSummary = createAsyncThunk(
  "followups/fetchFollowUpSummary",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/leads/my/followups/summary");
      return res.data; // { today, upcoming, overdue }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to load follow-up summary"
      );
    }
  }
);

// ✅ GET /api/leads/my/followups?bucket=today&page=1&limit=50
export const fetchFollowUpsByBucket = createAsyncThunk(
  "followups/fetchFollowUpsByBucket",
  async ({ bucket = "today", page = 1, limit = 50 }, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/leads/my/followups", {
        params: { bucket, page, limit },
      });

      return {
        bucket,
        items: res.data?.items || [],
        page: res.data?.page || 1,
        pages: res.data?.pages || 1,
        total: res.data?.total || 0,
        limit: res.data?.limit || limit,
      };
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to load follow-ups"
      );
    }
  }
);

const slice = createSlice({
  name: "followups",
  initialState: {
    summary: { today: 0, upcoming: 0, overdue: 0 },

    bucket: "today",
    items: [],
    page: 1,
    pages: 1,
    total: 0,
    limit: 50,

    loadingSummary: false,
    loadingItems: false,
    error: null,
  },
  reducers: {
    setBucket: (state, action) => {
      state.bucket = action.payload;
    },
    clearFollowUpsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    // summary
    b.addCase(fetchFollowUpSummary.pending, (state) => {
      state.loadingSummary = true;
      state.error = null;
    });
    b.addCase(fetchFollowUpSummary.fulfilled, (state, action) => {
      state.loadingSummary = false;
      state.summary = {
        today: Number(action.payload?.today || 0),
        upcoming: Number(action.payload?.upcoming || 0),
        overdue: Number(action.payload?.overdue || 0),
      };
    });
    b.addCase(fetchFollowUpSummary.rejected, (state, action) => {
      state.loadingSummary = false;
      state.error = action.payload;
    });

    // list
    b.addCase(fetchFollowUpsByBucket.pending, (state) => {
      state.loadingItems = true;
      state.error = null;
    });
    b.addCase(fetchFollowUpsByBucket.fulfilled, (state, action) => {
      state.loadingItems = false;
      state.items = Array.isArray(action.payload?.items) ? action.payload.items : [];
      state.page = action.payload?.page || 1;
      state.pages = action.payload?.pages || 1;
      state.total = action.payload?.total || 0;
      state.limit = action.payload?.limit || state.limit;
    });
    b.addCase(fetchFollowUpsByBucket.rejected, (state, action) => {
      state.loadingItems = false;
      state.items = [];
      state.error = action.payload;
    });
  },
});

export const { setBucket, clearFollowUpsError } = slice.actions;
export default slice.reducer;
