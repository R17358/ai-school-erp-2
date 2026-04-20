// frontend/src/store/slices/teachersSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
export const fetchTeachers = createAsyncThunk('teachers/fetchAll', async (params) => {
  const res = await api.get('/teachers', { params });
  return res.data.data;
});
const teachersSlice = createSlice({
  name: 'teachers', initialState: { list: [], loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchTeachers.pending, (s) => { s.loading = true; })
     .addCase(fetchTeachers.fulfilled, (s, a) => { s.loading = false; s.list = a.payload.teachers || a.payload; })
     .addCase(fetchTeachers.rejected, (s, a) => { s.loading = false; s.error = a.error.message; });
  },
});
export default teachersSlice.reducer;
