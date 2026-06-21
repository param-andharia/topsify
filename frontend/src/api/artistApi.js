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

export const artistApi = {
  getArtist: (artistId, params = {}) =>
    request(`/api/artists/${artistId}?${toQueryString(params)}`),
};

