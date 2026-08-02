import client from './client';

export const listTimeLogs = (params = {}) =>
  client.get('/timelogs', { params }).then((r) => r.data);
export const getTimeLog = (id) => client.get(`/timelogs/${id}`).then((r) => r.data);
export const createTimeLog = (data) => client.post('/timelogs', data).then((r) => r.data);
export const updateTimeLog = (id, data) => client.put(`/timelogs/${id}`, data).then((r) => r.data);
export const deleteTimeLog = (id) => client.delete(`/timelogs/${id}`);
