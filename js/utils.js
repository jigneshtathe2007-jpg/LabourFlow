const API_URL = 'http://localhost:3000/api';
export const money = n => '₹' + (+n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
export const today = () => new Date().toISOString().slice(0, 10);

function token() { return localStorage.getItem('labourflow_token') || sessionStorage.getItem('labourflow_token') || ''; }
export function toast(msg, ok = true) {
  const t = document.createElement('div');
  t.className = `fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl shadow text-white ${ok ? 'bg-green-600' : 'bg-red-600'}`;
  t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 3500);
}
async function request(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const t = token(); if (t) headers.Authorization = `Bearer ${t}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `API request failed (${response.status})`);
  return data;
}
export const list = async table => request(`/${encodeURIComponent(table)}`);
export const insertRow = async (table, pk, data) => {
  const result = await request(`/${encodeURIComponent(table)}`, { method: 'POST', body: JSON.stringify(data) });
  return result[pk] ?? result.id ?? result.insertId;
};
export async function updateRow(table, id, patch, _old) {
  return request(`/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(patch) });
}
export async function deleteRow(table, id, _old) {
  return request(`/${encodeURIComponent(table)}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function nextId(_name) { return null; } // MySQL AUTO_INCREMENT assigns IDs.
export async function audit(table, recordId, action, oldValues, newValues) {
  return request('/audit', { method: 'POST', body: JSON.stringify({ tableName: table, recordId: String(recordId), actionType: action, oldValues, newValues }) });
}
export async function createUser(data) {
  return request('/users', { method: 'POST', body: JSON.stringify(data) });
}
