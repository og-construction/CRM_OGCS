import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { createVisitApi, fetchVisitsApi, updateVisitApi, deleteVisitApi } from "../../api/visitsApi";

const normalize = (data) => {
  const items = Array.isArray(data?.items) ? data.items : [];
  return {
    items,
    page: Number(data?.page || 1),
    pages: Number(data?.pages || 1),
    total: Number(data?.total || items.length),
    limit: Number(data?.limit || 10),
  };
};

export const fetchVisits = createAsyncThunk("visits/fetch", async (params, thunkAPI) => {
  try {
    const data = await fetchVisitsApi(params);
    return normalize(data);
  } catch (e) {
    return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
  }
});

export const createVisit = createAsyncThunk("visits/create", async (formData, thunkAPI) => {
  try {
    const data = await createVisitApi(formData);
    return data?.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
  }
});

export const updateVisit = createAsyncThunk("visits/update", async ({ id, formData }, thunkAPI) => {
  try {
    const data = await updateVisitApi(id, formData);
    return data?.data;
  } catch (e) {
    return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
  }
});

export const deleteVisit = createAsyncThunk("visits/delete", async (id, thunkAPI) => {
  try {
    await deleteVisitApi(id);
    return id;
  } catch (e) {
    return thunkAPI.rejectWithValue(e?.response?.data?.message || e.message);
  }
});

const visitsSlice = createSlice({
  name: "visits",
  initialState: {
    items: [],
    loading: false,
    saving: false,
    error: null,
    page: 1,
    pages: 1,
    total: 0,
    limit: 10,
  },
  reducers: {
    clearVisitsError(s) {
      s.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchVisits.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchVisits.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload.items;
      s.page = a.payload.page;
      s.pages = a.payload.pages;
      s.total = a.payload.total;
      s.limit = a.payload.limit;
    });
    b.addCase(fetchVisits.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload || "Failed to load visits";
    });

    b.addCase(createVisit.pending, (s) => {
      s.saving = true;
      s.error = null;
    });
    b.addCase(createVisit.fulfilled, (s, a) => {
      s.saving = false;
      if (a.payload?._id) {
        s.items = [a.payload, ...s.items];
        s.total += 1;
      }
    });
    b.addCase(createVisit.rejected, (s, a) => {
      s.saving = false;
      s.error = a.payload || "Failed to save visit";
    });

    b.addCase(updateVisit.fulfilled, (s, a) => {
      const idx = s.items.findIndex((x) => x._id === a.payload?._id);
      if (idx >= 0) s.items[idx] = a.payload;
    });

    b.addCase(deleteVisit.fulfilled, (s, a) => {
      s.items = s.items.filter((x) => x._id !== a.payload);
      s.total = Math.max(0, s.total - 1);
    });
  },
});

export const { clearVisitsError } = visitsSlice.actions;
export default visitsSlice.reducer;