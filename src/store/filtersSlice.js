import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  q: '',
  type: 'all',
  sort: 'default',
  onlyFree: false,
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setQ(state, action)        { state.q = action.payload; },
    setType(state, action)     { state.type = action.payload; },
    setSort(state, action)     { state.sort = action.payload; },
    setOnlyFree(state, action) { state.onlyFree = action.payload; },
    reset()                    { return initialState; },
  },
});

export const { setQ, setType, setSort, setOnlyFree, reset } = filtersSlice.actions;
export default filtersSlice.reducer;