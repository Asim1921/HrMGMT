import { api } from './client';

// call this to get the profile of the current user
export async function getProfile() {
  const { data } = await api.get('/profile/me');
  return data;
}

// call this to update the profile of the current user
export async function updateProfile(fields) {
  const { data } = await api.put('/profile/me', fields);
  return data;
}

// call this to upload a new profile picture for the current user
export async function uploadProfilePicture(file) {
  const form = new FormData();
  form.append('picture', file);
  const { data } = await api.post('/profile/me/picture', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
