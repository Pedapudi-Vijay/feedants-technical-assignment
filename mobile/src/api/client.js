import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const TOKEN_KEY = 'feedants_auth_token';

export async function getToken() {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token) {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

/**
 * Thin fetch wrapper: attaches the auth token when present, parses JSON,
 * and throws a normalized Error (with `.status` and `.code`) on failure so
 * screens can branch on specific error codes (e.g. SPOTS_FULL, ALREADY_REGISTERED).
 */
export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = new Error(json.message || `Request failed (${response.status})`);
    err.status = response.status;
    err.code = json.code;
    throw err;
  }

  return json.data;
}
