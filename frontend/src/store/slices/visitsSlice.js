// src/store/slices/visitsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

/**
 * axiosClient.baseURL already has "/api"
 * so endpoints MUST NOT start with "/api"
 */

/** ✅ Normalize backend responses */
const normalizeVisitsResponse = (data) => {
  // Backend can return:
  // A) { success, data: [], page, pages, total, limit }
  // B) { items: [], page, pages, total, limit }
  // C) [] (old)
  if (Array.isArray(data)) {
    return { items: data, page: 1, pages: 1, total: data.length, limit: data.length || 50 };
  }

  const items =
    Array.isArray(data?.data) ? data.data :
    Array.isArray(data?.items) ? data.items :
    [];

  const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length;
  const limit = Number.isFinite(Number(data?.limit)) ? Number(data.limit) : 50;
  const pagesRaw =
    Number.isFinite(Number(data?.pages)) ? Number(data.pages) : Math.ceil((total || 0) / (limit || 1));
  const pages = Math.max(1, pagesRaw || 1);
  const page = Math.max(1, Number(data?.page) || 1);

  return { items, page, pages, total, limit };
};

/** ✅ POST /visits  (create visit) */
export const createMyVisit = createAsyncThunk("visits/createMyVisit", async (payload, thunkAPI) => {
  try {
    const { data } = await axiosClient.post("/visits", payload);
    // backend may return {success:true,data:visit} OR visit directly
    const visit = data?.data || data;
    return visit;
  } catch (e) {
    return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
  }
});

/** ✅ GET /visits/my */
export const fetchMyVisits = createAsyncThunk(
  "visits/fetchMyVisits",
  async ({ date = "", page = 1, limit = 50 } = {}, thunkAPI) => {
    try {
      const { data } = await axiosClient.get("/visits/my", { params: { date, page, limit } });
      return normalizeVisitsResponse(data);
    } catch (e) {
      return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
    }
  }
);

/** ✅ POST /visits/:visitId/create-lead */
export const createLeadFromMetPerson = createAsyncThunk(
  "visits/createLeadFromMetPerson",
  async ({ visitId, metIndex }, thunkAPI) => {
    try {
      const { data } = await axiosClient.post(`/visits/${visitId}/create-lead`, { metIndex });
      return { visitId, metIndex, data };
    } catch (e) {
      return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
    }
  }
);

// ✅ Optional: update location (only if you implemented backend PATCH route)
export const updateMyVisitLocation = createAsyncThunk(
  "visits/updateMyVisitLocation",
  async ({ id, location }, thunkAPI) => {
    try {
      const { data } = await axiosClient.patch(`/visits/my/${id}/location`, { location });
      return { id, location: data?.location || data?.data?.location || location };
    } catch (e) {
      return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
    }
  }
);

const visitsSlice = createSlice({
  name: "visits",
  initialState: {
    items: [],
    loading: false,
    error: null,
    saving: false,
    lastActionMsg: null,

    page: 1,
    pages: 1,
    total: 0,
    limit: 50,
  },
  reducers: {
    clearVisitsError(s) {
      s.error = null;
    },
    clearVisitsMsg(s) {
      s.lastActionMsg = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyVisits.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchMyVisits.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.items || [];
      s.page = a.payload.page || 1;
      s.pages = a.payload.pages || 1;
      s.total = a.payload.total ?? s.items.length;
      s.limit = a.payload.limit || s.limit;
    });
    b.addCase(fetchMyVisits.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || "Failed to load visits";
      s.items = [];
    });

    b.addCase(createMyVisit.pending, (s) => {
      s.saving = true;
      s.error = null;
      s.lastActionMsg = null;
    });
    b.addCase(createMyVisit.fulfilled, (s, a) => {
      s.saving = false;
      if (a.payload?._id) {
        s.items = [a.payload, ...s.items];
        s.total = (s.total || 0) + 1;
      }
      s.lastActionMsg = "Visit saved";
    });
    b.addCase(createMyVisit.rejected, (s, a) => {
      s.saving = false;
      s.error = a.payload || "Failed to save visit";
    });

    b.addCase(createLeadFromMetPerson.fulfilled, (s, a) => {
      const { visitId, metIndex, data } = a.payload;

      const v = s.items.find((x) => x._id === visitId);
      const lead = data?.lead || data?.data?.lead;

      if (v?.metPeople?.[metIndex] && lead?._id) {
        // ✅ store only id
        v.metPeople[metIndex].leadId = lead._id;
      }

      s.lastActionMsg = data?.message || data?.data?.message || "Lead linked";
    });

    b.addCase(createLeadFromMetPerson.rejected, (s, a) => {
      s.error = a.payload || "Failed to create/link lead";
    });

    b.addCase(updateMyVisitLocation.fulfilled, (s, a) => {
      const { id, location } = a.payload;
      const v = s.items.find((x) => x._id === id);
      if (v) v.location = location;
    });
  },
});

export const { clearVisitsError, clearVisitsMsg } = visitsSlice.actions;
export default visitsSlice.reducer;
