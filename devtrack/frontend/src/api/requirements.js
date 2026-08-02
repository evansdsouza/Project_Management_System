import client from './client';

export const listRequirements = (projectId) =>
  client.get('/requirements', { params: { project_id: projectId } }).then((r) => r.data);
export const getRequirement = (id) => client.get(`/requirements/${id}`).then((r) => r.data);
export const createRequirement = (data) => client.post('/requirements', data).then((r) => r.data);
export const updateRequirement = (id, data) => client.put(`/requirements/${id}`, data).then((r) => r.data);
export const deleteRequirement = (id) => client.delete(`/requirements/${id}`);
