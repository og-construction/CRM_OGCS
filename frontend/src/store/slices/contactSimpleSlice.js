import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

export const fetchMyContactsSimple = createAsyncThunk(
  "contactSimple/fetchMyContactsSimple",
  async (search = "", thunkAPI) => {
    try {
      const res = await axiosClient.get("/contacts-simple", { params: { search } });
      const data = res.data?.data ?? [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to load contacts");
    }
  }
);

export const createMyContactSimple = createAsyncThunk(
  "contactSimple/createMyContactSimple",
  async (payload, thunkAPI) => {
    try {
      const res = await axiosClient.post("/contacts-simple", payload);
      return res.data?.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data?.message || "Failed to create contact");
    }
  }
);

const slice = createSlice({
  name: "contactSimple",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearContactSimpleError: (s) => {
      s.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchMyContactsSimple.pending, (s) => {
      s.loading = true;
      s.error = null;
    });
    b.addCase(fetchMyContactsSimple.fulfilled, (s, a) => {
      s.loading = false;
      s.items = a.payload || [];
    });
    b.addCase(fetchMyContactsSimple.rejected, (s, a) => {
      s.loading = false;
      s.error = a.payload;
    });

    b.addCase(createMyContactSimple.fulfilled, (s, a) => {
      if (a.payload?._id) s.items = [a.payload, ...s.items];
    });
    b.addCase(createMyContactSimple.rejected, (s, a) => {
      s.error = a.payload;
    });
  },
});

export const { clearContactSimpleError } = slice.actions;
export default slice.reducer;
