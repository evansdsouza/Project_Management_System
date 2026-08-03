import client from './client';

export const listBacklog = () => client.get('/backlog').then((r) => r.data);
