import { request } from "./httpClient";

export const userApi = {
  getMe: () => request("/api/users/me"),
  getMyPlaylists: () => request("/api/users/me/playlists"),
  getSavedPlaylists: () => request("/api/users/me/saved-playlists"),
  getUser: (userId) => request(`/api/users/${userId}`),
};
