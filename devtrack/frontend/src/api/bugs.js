import client from './client';

export const listBugs = (projectId) =>
  client.get('/bugs', { params: { project_id: projectId } }).then((r) => r.data);
export const createBug = (data) => client.post('/bugs', data).then((r) => r.data);
export const updateBug = (id, data) => client.put(`/bugs/${id}`, data).then((r) => r.data);
export const deleteBug = (id) => client.delete(`/bugs/${id}`);
export const updateBugStatus = (id, data) => client.post(`/bugs/${id}/status`, data).then((r) => r.data);
export const getBugHistory = (id) => client.get(`/bugs/${id}/history`).then((r) => r.data);
