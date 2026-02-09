// src/store/slices/visitsSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

/**
 * axiosClient.baseURL already has "/api"
 * so endpoints MUST NOT start with "/api"
 */

/** ✅ Normalize backend responses */
const normalizeVisitsResponse = (data) => {
  if (Array.isArray(data)) {
    return { items: data, page: 1, pages: 1, total: data.length, limit: data.length || 10 };
  }

  const items =
    Array.isArray(data?.items) ? data.items :
    Array.isArray(data?.data) ? data.data :
    [];

  const total = Number.isFinite(Number(data?.total)) ? Number(data.total) : items.length;
  const limit = Number.isFinite(Number(data?.limit)) ? Number(data.limit) : 10;

  // ✅ support pages OR totalPages
  const pagesRaw =
    Number.isFinite(Number(data?.pages)) ? Number(data.pages) :
    Number.isFinite(Number(data?.totalPages)) ? Number(data.totalPages) :
    Math.ceil((total || 0) / (limit || 1));

  const pages = Math.max(1, pagesRaw || 1);
  const page = Math.max(1, Number(data?.page) || 1);

  return { items, page, pages, total, limit };
};

/** ✅ POST /visits (create) */
export const createMyVisit = createAsyncThunk("visits/createMyVisit", async (payload, thunkAPI) => {
  try {
    const isFormData = payload instanceof FormData;

    const { data } = await axiosClient.post("/visits", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });

    return data?.data || data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
  }
});

/** ✅ GET /visits (list) */
export const fetchMyVisits = createAsyncThunk(
  "visits/fetchMyVisits",
  async (
    {
      q = "",
      status = "",
      partyType = "",
      from = "",
      to = "",
      onlyMine = "1",
      page = 1,
      limit = 10,
    } = {},
    thunkAPI
  ) => {
    try {
      const { data } = await axiosClient.get("/visits", {
        params: { q, status, partyType, from, to, onlyMine, page, limit },
      });
      return normalizeVisitsResponse(data);
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
    limit: 10,
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
  },
});

export const { clearVisitsError, clearVisitsMsg } = visitsSlice.actions;
export default visitsSlice.reducer;
