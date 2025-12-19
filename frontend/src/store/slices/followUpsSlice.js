import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const fetchMyFollowUps = createAsyncThunk(
  "followups/fetchMyFollowUps",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/leads/my/followups");
      return res.data; // { today, upcoming, overdue }
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to load follow-ups"
      );
    }
  }
);

export const updateMyFollowUp = createAsyncThunk(
  "followups/updateMyFollowUp",
  async ({ id, nextFollowUpAt, status }, thunkAPI) => {
    try {
      const res = await axiosInstance.patch(`/leads/my/${id}/followup`, {
        nextFollowUpAt,
        status,
      });
      return res.data.lead;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to update follow-up"
      );
    }
  }
);

const slice = createSlice({
  name: "followups",
  initialState: {
    today: [],
    upcoming: [],
    overdue: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearFollowUpsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyFollowUps.pending, (state) => {
      state.loading = true;
      state.error = null;
    });
    b.addCase(fetchMyFollowUps.fulfilled, (state, action) => {
      state.loading = false;
      state.today = action.payload.today || [];
      state.upcoming = action.payload.upcoming || [];
      state.overdue = action.payload.overdue || [];
    });
    b.addCase(fetchMyFollowUps.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });

    b.addCase(updateMyFollowUp.fulfilled, (state) => {
      // easiest: refetch after update from UI
    });
  },
});

export const { clearFollowUpsError } = slice.actions;
export default slice.reducer;
