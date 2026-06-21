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

export const albumApi = {
  getAlbum: (albumName, params = {}) =>
    request(`/api/albums?${toQueryString({ name: albumName, ...params })}`),
};

