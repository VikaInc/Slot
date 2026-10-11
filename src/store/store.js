import { configureStore } from '@reduxjs/toolkit';
import filters from './filtersSlice';

export const store = configureStore({
  reducer: {
    filters,
  },
});