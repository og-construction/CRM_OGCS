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

// ✅ Admin: fetch single quote by id (for detail modal)
export const fetchQuoteById = createAsyncThunk(
  "quotes/fetchQuoteById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get(`/quotes/${id}`);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(
        err.response?.data?.message || "Failed to load quote details"
      );
    }
  }
);

const quoteSlice = createSlice({
  name: "quotes",
  initialState: {
    pendingList: [],
    myQuotes: [],
    loading: false,
    error: null,

    // ✅ For quote details modal
    selectedQuote: null,
    detailsLoading: false,
    detailsError: null,
  },
  reducers: {
    // optional helper if you want to clear modal data when closing
    clearSelectedQuote(state) {
      state.selectedQuote = null;
      state.detailsLoading = false;
      state.detailsError = null;
    },
  },
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
        const updated = action.payload;
        // remove from pending list if approved/rejected
        state.pendingList = state.pendingList.filter((q) => q._id !== updated._id);

        // ✅ if modal is open for same quote, update it too
        if (state.selectedQuote?._id === updated._id) {
          state.selectedQuote = updated;
        }
      })
      .addCase(updateQuoteStatus.rejected, (state, action) => {
        state.error = action.payload;
      });

    // fetchQuoteById (DETAILS)
    builder
      .addCase(fetchQuoteById.pending, (state) => {
        state.detailsLoading = true;
        state.detailsError = null;
        state.selectedQuote = null;
      })
      .addCase(fetchQuoteById.fulfilled, (state, action) => {
        state.detailsLoading = false;
        state.selectedQuote = action.payload;
      })
      .addCase(fetchQuoteById.rejected, (state, action) => {
        state.detailsLoading = false;
        state.detailsError = action.payload || "Failed to load quote details";
      });
  },
});

export const { clearSelectedQuote } = quoteSlice.actions;
export default quoteSlice.reducer;
