// frontend/src/store/slices/authSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', credentials);
    const { accessToken, user } = res.data.data;
    localStorage.setItem('accessToken', accessToken);
    return { accessToken, user };
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  try { await api.post('/auth/logout'); } catch {}
  localStorage.removeItem('accessToken');
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    accessToken: localStorage.getItem('accessToken') || null,
    loading: false,
    initialized: false,
    error: null,
  },
  reducers: {
    setToken: (state, action) => { state.accessToken = action.payload; },
    clearAuth: (state) => {
      state.user = null;
      state.accessToken = null;
      localStorage.removeItem('accessToken');
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.initialized = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Get Me
      .addCase(getMe.fulfilled, (state, action) => {
        state.user = action.payload;
        state.initialized = true;
      })
      .addCase(getMe.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
        localStorage.removeItem('accessToken');
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.initialized = true;
      });
  },
});

export const { setToken, clearAuth } = authSlice.actions;

// Selectors
export const selectUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => !!state.auth.user;
export const selectUserRole = (state) => state.auth.user?.role;
export const selectSchool = (state) => state.auth.user?.school;

export default authSlice.reducer;
