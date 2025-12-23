import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

export const fetchAdminSettings = createAsyncThunk(
  "adminSettings/fetchAdminSettings",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/admin/settings");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const saveAdminSettings = createAsyncThunk(
  "adminSettings/saveAdminSettings",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axiosClient.put("/admin/settings", payload);
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

const adminSettingsSlice = createSlice({
  name: "adminSettings",
  initialState: {
    data: null,
    loading: false,
    saving: false,
    error: null,
    saveError: null,
    saved: false,
  },
  reducers: {
    clearSaved(state) {
      state.saved = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAdminSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load settings";
      });

    builder
      .addCase(saveAdminSettings.pending, (state) => {
        state.saving = true;
        state.saveError = null;
        state.saved = false;
      })
      .addCase(saveAdminSettings.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload;
        state.saved = true;
      })
      .addCase(saveAdminSettings.rejected, (state, action) => {
        state.saving = false;
        state.saveError = action.payload || "Failed to save settings";
      });
  },
});

export const { clearSaved } = adminSettingsSlice.actions;
export default adminSettingsSlice.reducer;
