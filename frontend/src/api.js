import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';

export const fetchHistory = async () => {
  const res = await axios.get(`${API_BASE}/history`);
  return res.data.sessions;
};

export const fetchMessages = async (sessionId) => {
  const res = await axios.get(`${API_BASE}/history/${sessionId}`);
  return res.data.messages;
};

export const sendMessage = async (query, sessionId) => {
  const res = await axios.post(`${API_BASE}/chat`, { query, session_id: sessionId });
  return res.data;
};

export const ingestData = async (type, content) => {
  const formData = new FormData();
  if (type === 'text') formData.append('text', content);
  else if (type === 'url') formData.append('url', content);
  else if (type === 'pdf') formData.append('file', content); // content is a File object

  const res = await axios.post(`${API_BASE}/ingest`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return res.data;
};

export const deleteHistory = async (sessionId) => {
  const res = await axios.delete(`${API_BASE}/history/${sessionId}`);
  return res.data;
};

export const fetchKnowledge = async () => {
  const res = await axios.get(`${API_BASE}/knowledge`);
  return res.data.sources;
};

export const deleteKnowledge = async (source) => {
  // Use config data object for axios delete with body, or pass as query depending on route.
  // The route is defined as @router.delete("/knowledge") with source: str, so parameter is a query param
  const res = await axios.delete(`${API_BASE}/knowledge`, { params: { source } });
  return res.data;
};

