import { apiRequest } from './client';

export function fetchCompetitionDetails(id) {
  return apiRequest(`/competitions/${id}`, { auth: true }); // auth optional server-side; sent if we have a token
}

export function registerForCompetition(id) {
  return apiRequest(`/competitions/${id}/register`, { method: 'POST' });
}

export function cancelRegistration(id) {
  return apiRequest(`/competitions/${id}/register`, { method: 'DELETE' });
}

export function submitEntry(id, fileUrl, fileType = 'video') {
  return apiRequest(`/competitions/${id}/submissions`, {
    method: 'POST',
    body: { fileUrl, fileType },
  });
}
