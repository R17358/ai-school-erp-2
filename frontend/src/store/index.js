// frontend/src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import studentsReducer from './slices/studentsSlice';
import teachersReducer from './slices/teachersSlice';
import attendanceReducer from './slices/attendanceSlice';
import feesReducer from './slices/feesSlice';
import notificationsReducer from './slices/notificationsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    students: studentsReducer,
    teachers: teachersReducer,
    attendance: attendanceReducer,
    fees: feesReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false }),
});

export default store;
