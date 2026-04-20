// frontend/src/store/slices/attendanceSlice.js
import { createSlice } from '@reduxjs/toolkit';
const attendanceSlice = createSlice({
  name: 'attendance', initialState: { data: [], loading: false },
  reducers: { setAttendance: (s, a) => { s.data = a.payload; } },
});
export const { setAttendance } = attendanceSlice.actions;
export default attendanceSlice.reducer;
