// src/store/index.js (or src/store/store.js - whichever you use)
import { configureStore } from "@reduxjs/toolkit";

import authReducer from "./slices/authSlice";
import quotesReducer from "./slices/quoteSlice";
import leadsReducer from "./slices/leadsSlice";
import followUpsReducer from "./slices/followUpsSlice";
import contactSimpleReducer from "./slices/contactSimpleSlice";
import adminOverviewReducer from "./slices/adminOverviewSlice";
import adminSettingsReducer from "./slices/adminSettingsSlice";
import dailyReportsReducer from "./slices/dailyReportsSlice";


const store = configureStore({
  reducer: {
    auth: authReducer,
    quotes: quotesReducer,              // ✅ ONLY ONCE
    leads: leadsReducer,
    followups: followUpsReducer,
    contactSimple: contactSimpleReducer,
    adminOverview: adminOverviewReducer, // ✅ REQUIRED
    adminSettings: adminSettingsReducer,
    dailyReports: dailyReportsReducer,
  },
});

export default store;
