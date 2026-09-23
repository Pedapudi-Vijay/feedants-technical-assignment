import { apiRequest, setToken } from './client';

export async function login(email, password) {
  const data = await apiRequest('/auth/login', { method: 'POST', body: { email, password }, auth: false });
  await setToken(data.token);
  return data.user;
}

export async function register(name, email, password) {
  const data = await apiRequest('/auth/register', { method: 'POST', body: { name, email, password }, auth: false });
  await setToken(data.token);
  return data.user;
}

export async function logout() {
  await setToken(null);
}
