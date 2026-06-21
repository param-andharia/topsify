import { getHomeData } from "../services/homeService.js";
import { sendSuccess } from "../utils/responses.js";

export const getHomeController = async (req, res) => {
  const data = await getHomeData(req.auth.userId);
  return sendSuccess(res, { data });
};
