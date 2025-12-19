// src/store/slices/quoteSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

// 🔹 Admin: fetch pending quotations/invoices
export const fetchPendingQuotes = createAsyncThunk(
  "quotes/fetchPendingQuotes",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/quotes", {
        params: { status: "pending" },
      });
      return res.data.data || [];
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to load pending quotations/invoices.";
      return rejectWithValue(msg);
    }
  }
);

// 🔹 Admin: approve / reject a document
export const updateQuoteStatus = createAsyncThunk(
  "quotes/updateQuoteStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/quotes/${id}/status`, { status });
      return res.data.data; // updated quote
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to update status. Please try again.";
      return rejectWithValue(msg);
    }
  }
);

const quoteSlice = createSlice({
  name: "quotes",
  initialState: {
    pendingList: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // fetchPendingQuotes
    builder
      .addCase(fetchPendingQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.pendingList = action.payload;
      })
      .addCase(fetchPendingQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateQuoteStatus
    builder
      .addCase(updateQuoteStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateQuoteStatus.fulfilled, (state, action) => {
        // remove from pending list if approved/rejected
        const updated = action.payload;
        state.pendingList = state.pendingList.filter(
          (q) => q._id !== updated._id
        );
      })
      .addCase(updateQuoteStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default quoteSlice.reducer;
