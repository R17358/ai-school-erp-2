// fees slice
import { createSlice } from '@reduxjs/toolkit';
const feesSlice = createSlice({ name: 'fees', initialState: { list: [], loading: false }, reducers: { setFees: (s,a) => { s.list = a.payload; } } });
export const { setFees } = feesSlice.actions;
export default feesSlice.reducer;
