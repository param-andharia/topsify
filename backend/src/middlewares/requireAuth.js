import { ApiError } from "../utils/ApiError.js";

export const requireAuth = (req, _res, next) => {
  if (!req.session?.user) {
    return next(new ApiError(401, "UNAUTHENTICATED", "Please log in to continue."));
  }

  req.auth = req.session.user;
  return next();
};
