 
import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import quotesReducer from "./slices/quoteSlice";   
import leadsReducer from "./slices/leadsSlice";
import followUpsReducer from "./slices/followUpsSlice";
import contactSimpleReducer from "./slices/contactSimpleSlice";

const store = configureStore({
  reducer: {
    auth: authReducer,
    quotes: quotesReducer,  
     leads: leadsReducer,
     followups: followUpsReducer,
   contactSimple: contactSimpleReducer,
  },
});

export default store;
