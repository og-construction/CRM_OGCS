import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

export const fetchMyLeads = createAsyncThunk(
  "leads/fetchMyLeads",
  async ({ status = "All", search = "" } = {}, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/leads/my", {
        params: { status, search },
      });
      return res.data.items;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to load leads");
    }
  }
);

export const createMyLead = createAsyncThunk(
  "leads/createMyLead",
  async (payload, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/leads/my", payload);
      return res.data.lead;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to create lead");
    }
  }
);

export const importMyLeads = createAsyncThunk(
  "leads/importMyLeads",
  async (items, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/leads/my/import", { items });
      return res.data; // {added, skippedDuplicate, skippedInvalid}
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Import failed");
    }
  }
);

const leadsSlice = createSlice({
  name: "leads",
  initialState: {
    items: [],
    loading: false,
    error: null,
    importing: false,
    importResult: null,
  },
  reducers: {
    clearLeadsError: (state) => {
      state.error = null;
    },
    clearImportResult: (state) => {
      state.importResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetch
      .addCase(fetchMyLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMyLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // create
      .addCase(createMyLead.pending, (state) => {
        state.error = null;
      })
      .addCase(createMyLead.fulfilled, (state, action) => {
        // add new lead on top
        state.items = [action.payload, ...state.items];
      })
      .addCase(createMyLead.rejected, (state, action) => {
        state.error = action.payload;
      })

      // import
      .addCase(importMyLeads.pending, (state) => {
        state.importing = true;
        state.error = null;
        state.importResult = null;
      })
      .addCase(importMyLeads.fulfilled, (state, action) => {
        state.importing = false;
        state.importResult = action.payload;
      })
      .addCase(importMyLeads.rejected, (state, action) => {
        state.importing = false;
        state.error = action.payload;
      });
  },
});

export const { clearLeadsError, clearImportResult } = leadsSlice.actions;
export default leadsSlice.reducer;
