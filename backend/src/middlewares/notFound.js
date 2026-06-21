import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req, _res, next) => {
  next(new ApiError(404, "NOT_FOUND", `No route found for ${req.method} ${req.originalUrl}`));
};
