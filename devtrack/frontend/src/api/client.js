import axios from 'axios';

const client = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

// FastAPI/Pydantic returns 422 errors as { detail: [{ loc: [...], msg: "..." }] }.
// This turns that into a flat { fieldName: message } map that FormField
// can render directly.
function extractFieldErrors(detail) {
  if (!Array.isArray(detail)) return {};
  return detail.reduce((acc, err) => {
    const field = err.loc?.[err.loc.length - 1];
    if (field) acc[field] = err.msg;
    return acc;
  }, {});
}

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 422) {
      error.fieldErrors = extractFieldErrors(error.response.data?.detail);
    }
    return Promise.reject(error);
  }
);

export default client;
