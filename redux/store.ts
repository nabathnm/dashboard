import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./features/authSlice";
import tasksReducer from "./features/tasksSlice";


export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      tasks: tasksReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false, // Prevents errors with non-serializable objects like Supabase Session/User details
      }),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
