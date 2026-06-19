import { api } from './index';

export const categorize = (description) =>
  api.post('/categorize', { description }).then((r) => r.data);

export const askQuestion = (question) =>
  api.post('/ask', { question }).then((r) => r.data);
