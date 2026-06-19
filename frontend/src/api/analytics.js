import { api } from './index';

export const getCategorySummary = () =>
  api.get('/analytics/category-summary').then((r) => r.data);

export const getMonthlyTrend = () =>
  api.get('/analytics/monthly-trend').then((r) => r.data);
