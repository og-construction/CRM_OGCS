import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosInstance from "../../api/axiosInstance";

/** GET /leads/my */
export const fetchMyLeads = createAsyncThunk(
  "leads/fetchMyLeads",
  async ({ status = "All", leadType = "All", search = "" } = {}, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/leads/my", {
        params: { status, leadType, search },
      });
      return res.data.items;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to load leads"
      );
    }
  }
);

/** POST /leads/my */
export const createMyLead = createAsyncThunk(
  "leads/createMyLead",
  async (payload, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/leads/my", payload);
      return res.data.lead;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to create lead"
      );
    }
  }
);

/** PUT /leads/my/:id */
export const updateMyLead = createAsyncThunk(
  "leads/updateMyLead",
  async ({ id, payload }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/leads/my/${id}`, payload);
      return res.data.lead;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to update lead"
      );
    }
  }
);

/** DELETE /leads/my/:id */
export const deleteMyLead = createAsyncThunk(
  "leads/deleteMyLead",
  async (id, thunkAPI) => {
    try {
      await axiosInstance.delete(`/leads/my/${id}`);
      return id;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || "Failed to delete lead"
      );
    }
  }
);

/** POST /leads/my/import */
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

    // ✅ NEW: instant patch (used by FollowUpSystem)
    patchLeadInList: (state, action) => {
      const updated = action.payload;
      if (!updated?._id) return;
      state.items = state.items.map((x) => (x._id === updated._id ? updated : x));
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyLeads.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyLeads.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchMyLeads.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to load leads";
      })

      .addCase(createMyLead.fulfilled, (state, action) => {
        if (action.payload?._id) state.items = [action.payload, ...state.items];
      })
      .addCase(createMyLead.rejected, (state, action) => {
        state.error = action.payload || "Failed to create lead";
      })

      .addCase(updateMyLead.fulfilled, (state, action) => {
        const updated = action.payload;
        state.items = state.items.map((x) => (x._id === updated._id ? updated : x));
      })
      .addCase(updateMyLead.rejected, (state, action) => {
        state.error = action.payload || "Failed to update lead";
      })

      .addCase(deleteMyLead.fulfilled, (state, action) => {
        const id = action.payload;
        state.items = state.items.filter((x) => x._id !== id);
      })
      .addCase(deleteMyLead.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete lead";
      })

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
        state.error = action.payload || "Import failed";
      });
  },
});

export const { clearLeadsError, clearImportResult, patchLeadInList } = leadsSlice.actions;
export default leadsSlice.reducer;
