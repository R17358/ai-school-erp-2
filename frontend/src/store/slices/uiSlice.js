// frontend/src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    darkMode: localStorage.getItem('darkMode') === 'true',
    sidebarOpen: true,
    sidebarCollapsed: false,
    activeModal: null,
    modalData: null,
  },
  reducers: {
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode);
      document.documentElement.classList.toggle('dark', state.darkMode);
    },
    setDarkMode: (state, action) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', action.payload);
      document.documentElement.classList.toggle('dark', action.payload);
    },
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    toggleSidebarCollapse: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    openModal: (state, action) => {
      state.activeModal = action.payload.modal;
      state.modalData = action.payload.data || null;
    },
    closeModal: (state) => {
      state.activeModal = null;
      state.modalData = null;
    },
  },
});

export const { toggleDarkMode, setDarkMode, toggleSidebar, toggleSidebarCollapse, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;
