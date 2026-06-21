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

export const searchApi = {
  suggest: ({ q, limit = 10 }) => request(`/api/search/suggest?${toQueryString({ q, limit })}`),
  search: ({ q, type = "all", page = 1, limit = 20 }) =>
    request(`/api/search?${toQueryString({ q, type, page, limit })}`),
};
