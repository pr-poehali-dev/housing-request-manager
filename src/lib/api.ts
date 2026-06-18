const AUTH_URL = 'https://functions.poehali.dev/7a3dee3b-f88e-49de-ac84-e7fcb135b8cf';
const REQ_URL = 'https://functions.poehali.dev/9e19f16a-03f1-4add-bdd3-b78ecd679374';
const REPORT_URL = 'https://functions.poehali.dev/4f515585-be3e-4c32-9199-8341a9fed330';

function getToken() {
  return localStorage.getItem('jkh_token') || '';
}

async function callAuth(body: object) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

async function callRequests(body: object) {
  const res = await fetch(REQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

async function callReport(body: object) {
  const res = await fetch(REPORT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Auth-Token': getToken() },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка сервера');
  return data;
}

export function downloadBase64(b64: string, filename: string, mime: string) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export const api = {
  register: (p: { name: string; phone: string; password: string; role: string; address?: string }) =>
    callAuth({ action: 'register', ...p }),

  login: (p: { phone: string; password: string }) =>
    callAuth({ action: 'login', ...p }),

  me: () => callAuth({ action: 'me' }),

  listRequests: () => callRequests({ action: 'list' }),

  getNotifications: () => callRequests({ action: 'notifications' }),

  createRequest: (p: { category: string; description: string; address: string; priority: string }) =>
    callRequests({ action: 'create', ...p }),

  updateRequest: (p: { id: number; status?: string; master_id?: number; close_comment?: string }) =>
    callRequests({ action: 'update', ...p }),

  getMasters: () => callRequests({ action: 'masters' }),

  downloadReport: (p: { action: 'excel' | 'pdf'; date_from?: string; date_to?: string; status_filter?: string }) =>
    callReport(p),
};

export type User = {
  id: number;
  name: string;
  phone: string;
  role: 'resident' | 'dispatcher' | 'master';
  address: string;
};

export type Request = {
  id: number;
  category: string;
  description: string;
  address: string;
  status: string;
  status_label: string;
  priority: string;
  priority_label: string;
  created_at: string;
  closed_at: string | null;
  close_comment: string | null;
  resident_name: string;
  resident_phone: string;
  master_name: string | null;
  master_id: number | null;
  resident_id: number;
};
