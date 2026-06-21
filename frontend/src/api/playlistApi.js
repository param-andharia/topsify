import { request } from "./httpClient";

const toQueryString = (params) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  return searchParams.toString();
};

export const playlistApi = {
  getPlaylist: (playlistId, params = {}) =>
    request(`/api/playlists/${playlistId}?${toQueryString(params)}`),
  createPlaylist: (payload) => request("/api/playlists", { method: "POST", body: payload }),
  addTrackToPlaylist: (playlistId, trackId) =>
    request(`/api/playlists/${playlistId}/songs`, {
      method: "POST",
      body: { trackId },
    }),
  removeTrackFromPlaylist: (playlistId, trackId) =>
    request(`/api/playlists/${playlistId}/songs/${trackId}`, {
      method: "DELETE",
    }),
  followPlaylist: (playlistId) =>
    request(`/api/playlists/${playlistId}/follow`, {
      method: "POST",
    }),
  unfollowPlaylist: (playlistId) =>
    request(`/api/playlists/${playlistId}/follow`, {
      method: "DELETE",
    }),
};
