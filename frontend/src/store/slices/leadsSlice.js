// src/store/slices/leadsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";
import toast from "react-hot-toast";

/**
 * env: VITE_API_BASE_URL=http://localhost:3181/api
 * axiosClient.baseURL already has "/api"
 * so endpoints MUST NOT start with "/api"
 */

const normalizeListResponse = (data, fallbackPage = 1, fallbackLimit = 20) => {
  if (Array.isArray(data)) {
    return { items: data, page: 1, pages: 1, total: data.length, limit: fallbackLimit };
  }

  const items = Array.isArray(data?.items) ? data.items : [];
  const page = Number(data?.page) || fallbackPage || 1;
  const limit = Number(data?.limit) || fallbackLimit || 20;

  const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length;
  const pages = Number.isFinite(Number(data?.pages))
    ? Number(data.pages)
    : Math.max(1, Math.ceil(total / limit) || 1);

  return { items, page, pages, total, limit };
};

const normalizePhone = (v) => String(v || "").replace(/\D/g, "").slice(-10);

/** GET /leads/my */
export const fetchMyLeads = createAsyncThunk(
  "leads/fetchMyLeads",
  async ({ status = "All", leadType = "All", search = "", page = 1, limit = 20 } = {}, thunkAPI) => {
    try {
      const { data } = await axiosClient.get("/leads/my", {
        params: { status, leadType, search, page, limit },
      });
      return normalizeListResponse(data, page, limit);
    } catch (e) {
      return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message || "Failed to load leads");
    }
  }
);

/** POST /leads/my */
export const createMyLead = createAsyncThunk("leads/createMyLead", async (payload, thunkAPI) => {
  try {
    const fixed = { ...payload };
    if (fixed.phone) fixed.phone = normalizePhone(fixed.phone);

    const { data } = await axiosClient.post("/leads/my", fixed);
    const lead = data?.lead || data;

    toast.success("Lead created");
    return lead;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Failed to create lead";
    toast.error(msg);
    return thunkAPI.rejectWithValue(msg);
  }
});

/** PUT /leads/my/:id */
export const updateMyLead = createAsyncThunk("leads/updateMyLead", async ({ id, payload }, thunkAPI) => {
  try {
    const fixed = { ...payload };
    if (fixed.phone) fixed.phone = normalizePhone(fixed.phone);

    const { data } = await axiosClient.put(`/leads/my/${id}`, fixed);
    const updated = data?.lead || data;

    toast.success("Lead updated");
    return updated;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Failed to update lead";
    toast.error(msg);
    return thunkAPI.rejectWithValue(msg);
  }
});

/** DELETE /leads/my/:id */
export const deleteMyLead = createAsyncThunk("leads/deleteMyLead", async (id, thunkAPI) => {
  try {
    await axiosClient.delete(`/leads/my/${id}`);
    toast.success("Lead deleted");
    return id;
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Failed to delete lead";
    toast.error(msg);
    return thunkAPI.rejectWithValue(msg);
  }
});

/** POST /leads/my/import */
export const importMyLeads = createAsyncThunk("leads/importMyLeads", async (arr, thunkAPI) => {
  try {
    const payloadArray = Array.isArray(arr) ? arr : [];

    // new backend array body
    try {
      const { data } = await axiosClient.post("/leads/my/import", payloadArray);
      toast.success("Import completed");
      return data;
    } catch {
      // fallback old {items}
      const { data } = await axiosClient.post("/leads/my/import", { items: payloadArray });
      toast.success("Import completed");
      return data;
    }
  } catch (e) {
    const msg = e?.response?.data?.message || e.message || "Import failed";
    toast.error(msg);
    return thunkAPI.rejectWithValue(msg);
  }
});

// ✅ PATCH /leads/my/:id/followup
export const updateLeadFollowUp = createAsyncThunk(
  "leads/updateLeadFollowUp",
  async ({ id, followUpDate, followUpNotes, status }, thunkAPI) => {
    try {
      const { data } = await axiosClient.patch(`/leads/my/${id}/followup`, {
        followUpDate,
        followUpNotes,
        status,
      });

      // ✅ Your backend response: { success, message, lead }
      return data.lead;
    } catch (err) {
      return thunkAPI.rejectWithValue(
        err.response?.data?.message || err.message || "Failed to update follow-up"
      );
    }
  }
);

const leadsSlice = createSlice({
  name: "leads",
  initialState: {
    items: [],
    loading: false,
    error: null,

    page: 1,
    pages: 1,
    total: 0,
    limit: 20,

    importing: false,
    importResult: null,
  },
  reducers: {
    clearLeadsError(state) {
      state.error = null;
    },
    clearImportResult(state) {
      state.importResult = null;
    },
    patchLeadInList(state, action) {
      const updated = action.payload;
      if (!updated?._id) return;
      state.items = state.items.map((x) => (x._id === updated._id ? updated : x));
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyLeads.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchMyLeads.fulfilled, (s, a) => {
      s.loading = false;
      const p = a.payload || {};
      s.items = p.items || [];
      s.page = p.page || 1;
      s.pages = p.pages || 1;
      s.total = Number.isFinite(p.total) ? p.total : s.items.length;
      s.limit = p.limit || s.limit;
    });
    b.addCase(fetchMyLeads.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || "Failed to load leads";
    });

    b.addCase(createMyLead.fulfilled, (s, a) => {
      if (a.payload?._id) {
        s.items = [a.payload, ...s.items];
        s.total = (s.total || 0) + 1;
      }
    });
    b.addCase(createMyLead.rejected, (s, a) => {
      s.error = a.payload || "Failed to create lead";
    });

    b.addCase(updateMyLead.fulfilled, (s, a) => {
      const updated = a.payload;
      if (!updated?._id) return;
      const idx = s.items.findIndex((x) => x._id === updated._id);
      if (idx >= 0) s.items[idx] = updated;
    });
    b.addCase(updateMyLead.rejected, (s, a) => {
      s.error = a.payload || "Failed to update lead";
    });

    b.addCase(deleteMyLead.fulfilled, (s, a) => {
      const id = a.payload;
      s.items = s.items.filter((x) => x._id !== id);
      s.total = Math.max(0, (s.total || 0) - 1);
    });
    b.addCase(deleteMyLead.rejected, (s, a) => {
      s.error = a.payload || "Failed to delete lead";
    });

    b.addCase(importMyLeads.pending, (s) => {
      s.importing = true;
      s.error = null;
      s.importResult = null;
    });
    b.addCase(importMyLeads.fulfilled, (s, a) => {
      s.importing = false;
      s.importResult = a.payload;
    });
    b.addCase(importMyLeads.rejected, (s, a) => {
      s.importing = false;
      s.error = a.payload || "Import failed";
    });

    b.addCase(updateLeadFollowUp.fulfilled, (state, action) => {
      const updated = action.payload;
      state.items = state.items.map((l) => (l._id === updated._id ? updated : l));
    })
    b.addCase(updateLeadFollowUp.rejected, (state, action) => {
      state.error = action.payload || "Failed to update follow-up";
    });
},
});

export const { clearLeadsError, clearImportResult, patchLeadInList } = leadsSlice.actions;
export default leadsSlice.reducer;
