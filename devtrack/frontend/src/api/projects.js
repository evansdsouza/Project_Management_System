import client from './client';

export const listProjects = () => client.get('/projects').then((r) => r.data);
export const getProject = (id) => client.get(`/projects/${id}`).then((r) => r.data);
export const getProjectProgress = (id) => client.get(`/projects/${id}/progress`).then((r) => r.data);
export const createProject = (data) => client.post('/projects', data).then((r) => r.data);
export const updateProject = (id, data) => client.put(`/projects/${id}`, data).then((r) => r.data);
export const deleteProject = (id) => client.delete(`/projects/${id}`);
