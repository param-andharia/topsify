import { login, signup, getCurrentUser } from "../services/authService.js";
import { sendSuccess } from "../utils/responses.js";

export const signupController = async (req, res) => {
  const result = await signup(req.body);
  req.session.user = result.sessionUser;
  return sendSuccess(res, { status: 201, data: { user: result.user } });
};

export const loginController = async (req, res) => {
  const result = await login(req.body);
  req.session.user = result.sessionUser;
  return sendSuccess(res, { data: { user: result.user } });
};

export const logoutController = async (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      return next(error);
    }

    res.clearCookie("topsify.sid");
    return res.status(204).send();
  });
};

export const meController = async (req, res) => {
  const user = await getCurrentUser(req.auth.userId);
  return sendSuccess(res, { data: { user } });
};
