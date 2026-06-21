import { request } from "./httpClient";

export const songApi = {
  getSong: (trackId) => request(`/api/songs/${encodeURIComponent(trackId)}`),
  likeSong: (trackId, body = {}) =>
    request(`/api/songs/${encodeURIComponent(trackId)}/like`, {
      method: "POST",
      body,
    }),
  unlikeSong: (trackId) =>
    request(`/api/songs/${encodeURIComponent(trackId)}/like`, {
      method: "DELETE",
    }),
  recordPlay: (trackId, body = {}) =>
    request(`/api/songs/${encodeURIComponent(trackId)}/play`, {
      method: "POST",
      body,
      keepalive: true,
    }),
};
