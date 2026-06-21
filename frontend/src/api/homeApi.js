import { request } from "./httpClient";

export const homeApi = {
  getHome: () => request("/api/home"),
};
