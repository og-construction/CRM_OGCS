// src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosClient from "../../api/axiosClient";

/* ======================================================
   Helpers
====================================================== */
const safeJSONParse = (val, fallback = null) => {
  try {
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
};

/* ======================================================
   LOGIN (Admin + Sales)
====================================================== */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/login", { email, password });

      // ✅ Support BOTH response styles:
      // A) { status:"success", data:{ token, user } }
      // B) { status:"success", data:{ token, user } } under res.data.data
      const payload = res.data?.data ?? res.data;

      const token = payload?.token;
      const user = payload?.user;

      if (!token || !user) {
        return rejectWithValue({
          message: "Login API response missing token/user. Check backend response format.",
        });
      }

      // ✅ MUST match axiosClient key
      localStorage.setItem("ogcs_crm_token", token);
      localStorage.setItem("ogcs_crm_user", JSON.stringify(user));

      return { token, user };
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Login failed. Please try again.";
      return rejectWithValue({ message: msg, errors: err.response?.data?.errors || {} });
    }
  }
);

/* ======================================================
   FETCH SALES EXECUTIVES (Admin Only)
====================================================== */
export const fetchSalesExecutives = createAsyncThunk(
  "auth/fetchSalesExecutives",
  async (_, { rejectWithValue }) => {
    try {
      const res = await axiosClient.get("/auth/sales-executive");
      return res.data?.data ?? [];
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.message ||
        "Server error while fetching sales executives.";
      return rejectWithValue({ message: msg });
    }
  }
);

/* ======================================================
   CREATE SALES EXECUTIVE (Admin) - FormData + file upload
====================================================== */
export const createSalesExecutive = createAsyncThunk(
  "auth/createSalesExecutive",
  async (formData, { rejectWithValue }) => {
    try {
      const res = await axiosClient.post("/auth/sales-executive", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data?.data;
    } catch (err) {
      const payload = err?.response?.data;
      return rejectWithValue(
        payload || { message: "Server error while creating sales executive." }
      );
    }
  }
);

/* ======================================================
   TOGGLE ACTIVE/INACTIVE (Admin)
====================================================== */
export const toggleSalesExecutiveStatus = createAsyncThunk(
  "auth/toggleSalesExecutiveStatus",
  async ({ id, isActive }, { rejectWithValue }) => {
    try {
      const res = await axiosClient.patch(`/auth/sales-executive/${id}/active`, {
        isActive,
      });
      return res.data?.data || res.data?.user;
    } catch (err) {
      const payload = err?.response?.data;
      return rejectWithValue(payload || { message: "Failed to update status" });
    }
  }
);

/* ======================================================
   DELETE SALES EXECUTIVE (Admin)
====================================================== */
export const deleteSalesExecutive = createAsyncThunk(
  "auth/deleteSalesExecutive",
  async (id, { rejectWithValue }) => {
    try {
      const res = await axiosClient.delete(`/auth/sales-executive/${id}`);
      return res.data?.data?.id || res.data?.id || id;
    } catch (err) {
      const payload = err?.response?.data;
      return rejectWithValue(payload || { message: "Failed to delete user" });
    }
  }
);

/* ======================================================
   INITIAL STATE
====================================================== */
const initialToken = localStorage.getItem("ogcs_crm_token");
const initialUser = safeJSONParse(localStorage.getItem("ogcs_crm_user"), null);

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initialToken || null,
    user: initialUser,

    loading: false,
    error: null,
    fieldErrors: {},

    salesExecutives: [],
    salesLoading: false,
  },

  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      state.fieldErrors = {};
      state.salesExecutives = [];
      state.salesLoading = false;

      localStorage.removeItem("ogcs_crm_token");
      localStorage.removeItem("ogcs_crm_user");
    },

    clearError(state) {
      state.error = null;
      state.fieldErrors = {};
    },
  },

  extraReducers: (builder) => {
    /* -------------------------
       LOGIN USER
    ------------------------- */
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload?.message || "Login failed. Please try again.";
        state.fieldErrors = action.payload?.errors || {};
      });

    /* -------------------------
       FETCH SALES EXECUTIVES
    ------------------------- */
    builder
      .addCase(fetchSalesExecutives.pending, (state) => {
        state.salesLoading = true;
        state.error = null;
      })
      .addCase(fetchSalesExecutives.fulfilled, (state, action) => {
        state.salesLoading = false;
        state.salesExecutives = action.payload || [];
      })
      .addCase(fetchSalesExecutives.rejected, (state, action) => {
        state.salesLoading = false;
        state.error =
          action.payload?.message ||
          "Server error while fetching sales executives.";
      });

    /* -------------------------
       CREATE SALES EXECUTIVE
    ------------------------- */
    builder
      .addCase(createSalesExecutive.pending, (state) => {
        state.error = null;
        state.fieldErrors = {};
      })
      .addCase(createSalesExecutive.fulfilled, (state, action) => {
        if (action.payload) {
          state.salesExecutives = [action.payload, ...state.salesExecutives];
        }
      })
      .addCase(createSalesExecutive.rejected, (state, action) => {
        state.error = action.payload?.message || "Request failed";
        state.fieldErrors = action.payload?.errors || {};
      });

    /* -------------------------
       TOGGLE ACTIVE/INACTIVE
    ------------------------- */
    builder
      .addCase(toggleSalesExecutiveStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(toggleSalesExecutiveStatus.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated?._id) return;

        state.salesExecutives = state.salesExecutives.map((u) =>
          u._id === updated._id ? { ...u, ...updated } : u
        );
      })
      .addCase(toggleSalesExecutiveStatus.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to update status";
      });

    /* -------------------------
       DELETE SALES EXECUTIVE
    ------------------------- */
    builder
      .addCase(deleteSalesExecutive.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteSalesExecutive.fulfilled, (state, action) => {
        const id = action.payload;
        state.salesExecutives = state.salesExecutives.filter((u) => u._id !== id);
      })
      .addCase(deleteSalesExecutive.rejected, (state, action) => {
        state.error = action.payload?.message || "Failed to delete user";
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;












































// // src/store/slices/authSlice.js
// import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
// import axiosClient from "../../api/axiosClient";

// /* ======================================================
//    LOGIN (Admin + Sales)
// ====================================================== */
// export const loginUser = createAsyncThunk(
//   "auth/loginUser",
//   async ({ email, password }, { rejectWithValue }) => {
//     try {
//       const res = await axiosClient.post("/auth/login", { email, password });
//       // backend: { status: "success", data: { token, user } }
//       const { token, user } = res.data.data;

//       localStorage.setItem("ogcs_crm_token", token);
//       localStorage.setItem("ogcs_crm_user", JSON.stringify(user));

//       return { token, user };
//     } catch (err) {
//       const msg =
//         err.response?.data?.message || "Login failed. Please try again.";
//       return rejectWithValue(msg);
//     }
//   }
// );

// /* ======================================================
//    FETCH SALES EXECUTIVES (Admin Only)
// ====================================================== */
// export const fetchSalesExecutives = createAsyncThunk(
//   "auth/fetchSalesExecutives",
//   async (_, { rejectWithValue }) => {
//     try {
//       const res = await axiosClient.get("/auth/sales-executive");
//       // backend: { status: "success", data: [ ... ] }
//       return res.data.data;
//     } catch (err) {
//       const msg =
//         err.response?.data?.message ||
//         "Server error while fetching sales executives.";
//       return rejectWithValue(msg);
//     }
//   }
// );

// /* ======================================================
//    CREATE SALES EXECUTIVE (Admin)
// ====================================================== */
// export const createSalesExecutive = createAsyncThunk(
//   "auth/createSalesExecutive",
//   async (formData, { rejectWithValue }) => {
//     try {
//       const res = await axiosClient.post("/auth/sales-executive", formData, {
//         // Let browser set boundary automatically; do NOT manually set it
//         headers: { "Content-Type": "multipart/form-data" },
//       });
//       return res.data;
//     } catch (err) {
//       return rejectWithValue(err?.response?.data || { message: "Request failed" });
//     }
//   }
// );


// // export const createSalesExecutive = createAsyncThunk(
// //   "auth/createSalesExecutive",
// //   async (payload, { rejectWithValue }) => {
// //     try {
// //       // payload = form data from UsersSection (name, email, phone, aadhaar, etc.)
// //       const res = await axiosClient.post("/auth/sales-executive", payload);
// //       // backend: { status: "success", data: { ...user } }
// //       return res.data.data;
// //     } catch (err) {
// //       const msg =
// //         err.response?.data?.message ||
// //         "Server error while creating sales executive.";
// //       return rejectWithValue(msg);
// //     }
// //   }
// // );




// /* ======================================================
//    INITIAL STATE
// ====================================================== */
// const initialToken = localStorage.getItem("ogcs_crm_token");
// const initialUser = localStorage.getItem("ogcs_crm_user");

// const authSlice = createSlice({
//   name: "auth",
//   initialState: {
//     token: initialToken || null,
//     user: initialUser ? JSON.parse(initialUser) : null,
//     loading: false,
//     error: null,

//     // Sales executives data
//     salesExecutives: [],
//     salesLoading: false,
//   },

//   reducers: {
//     logout(state) {
//       state.token = null;
//       state.user = null;
//       state.error = null;

//       localStorage.removeItem("ogcs_crm_token");
//       localStorage.removeItem("ogcs_crm_user");
//     },

//     clearError(state) {
//       state.error = null;
//     },
//   },

//   extraReducers: (builder) => {
//     /* -------------------------
//        LOGIN USER
//     ------------------------- */
//     builder
//       .addCase(loginUser.pending, (state) => {
//         state.loading = true;
//         state.error = null;
//       })
//       .addCase(loginUser.fulfilled, (state, action) => {
//         state.loading = false;
//         state.token = action.payload.token;
//         state.user = action.payload.user;
//       })
//       .addCase(loginUser.rejected, (state, action) => {
//         state.loading = false;
//         state.error = action.payload;
//       });

//     /* -------------------------
//        FETCH SALES EXECUTIVES
//     ------------------------- */
//     builder
//       .addCase(fetchSalesExecutives.pending, (state) => {
//         state.salesLoading = true;
//         state.error = null;
//       })
//       .addCase(fetchSalesExecutives.fulfilled, (state, action) => {
//         state.salesLoading = false;
//         state.salesExecutives = action.payload || [];
//       })
//       .addCase(fetchSalesExecutives.rejected, (state, action) => {
//         state.salesLoading = false;
//         state.error = action.payload;
//       });

//     /* -------------------------
//        CREATE SALES EXECUTIVE
//     ------------------------- */
//     builder
//       .addCase(createSalesExecutive.pending, (state) => {
//         state.error = null;
//       })
//       .addCase(createSalesExecutive.fulfilled, (state, action) => {
//         // Instantly add created user to the list
//         if (action.payload) {
//           state.salesExecutives = [action.payload, ...state.salesExecutives];
//         }
//       })
//       .addCase(createSalesExecutive.rejected, (state, action) => {
//         state.error = action.payload;
//       });
//   },
// });

// export const { logout, clearError } = authSlice.actions;
// export default authSlice.reducer;
