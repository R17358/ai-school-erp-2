import { createSlice } from '@reduxjs/toolkit';
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState: { list: [], unread: 0 },
  reducers: {
    setNotifications: (s, a) => { s.list = a.payload; s.unread = a.payload.filter(n => !n.isRead).length; },
    markRead: (s, a) => { const n = s.list.find(x => x.id === a.payload); if(n) { n.isRead = true; s.unread = Math.max(0, s.unread - 1); } },
  }
});
export const { setNotifications, markRead } = notificationsSlice.actions;
export default notificationsSlice.reducer;
