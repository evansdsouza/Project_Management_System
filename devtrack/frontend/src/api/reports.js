import client from './client';

export const getReport = () => client.get('/reports').then((r) => r.data);
