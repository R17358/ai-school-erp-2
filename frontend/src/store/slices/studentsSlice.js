// frontend/src/store/slices/studentsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchStudents = createAsyncThunk('students/fetchAll', async (params) => {
  const res = await api.get('/students', { params });
  return res.data.data;
});

const studentsSlice = createSlice({
  name: 'students',
  initialState: { list: [], total: 0, loading: false, error: null, selected: null },
  reducers: {
    setSelectedStudent: (state, action) => { state.selected = action.payload; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => { state.loading = true; })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.students || action.payload;
        state.total = action.payload.total || action.payload.length;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});
export const { setSelectedStudent } = studentsSlice.actions;
export default studentsSlice.reducer;

// frontend/src/store/slices/teachersSlice.js - inline export
