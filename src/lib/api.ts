const AUTH_URL = 'https://functions.poehali.dev/7a3dee3b-f88e-49de-ac84-e7fcb135b8cf';
const REQ_URL = 'https://functions.poehali.dev/9e19f16a-03f1-4add-bdd3-b78ecd679374';

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

export const api = {
  register: (p: { name: string; phone: string; password: string; role: string; address?: string }) =>
    callAuth({ action: 'register', ...p }),

  login: (p: { phone: string; password: string }) =>
    callAuth({ action: 'login', ...p }),

  me: () => callAuth({ action: 'me' }),

  listRequests: () => callRequests({ action: 'list' }),

  createRequest: (p: { category: string; description: string; address: string; priority: string }) =>
    callRequests({ action: 'create', ...p }),

  updateRequest: (p: { id: number; status?: string; master_id?: number }) =>
    callRequests({ action: 'update', ...p }),

  getMasters: () => callRequests({ action: 'masters' }),
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
  resident_name: string;
  resident_phone: string;
  master_name: string | null;
  master_id: number | null;
  resident_id: number;
};
