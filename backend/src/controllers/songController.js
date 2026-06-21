import { getSongDetail, likeSongForUser, recordSongPlayForUser, unlikeSongForUser } from "../services/songService.js";
import { sendSuccess } from "../utils/responses.js";

export const getSongController = async (req, res) => {
  const song = await getSongDetail(req.params.trackId, req.auth.userId);
  return sendSuccess(res, { data: { song } });
};

export const likeSongController = async (req, res) => {
  const data = await likeSongForUser(req.params.trackId, req.auth.userId, req.body ?? {});
  return sendSuccess(res, { status: 201, data });
};

export const unlikeSongController = async (req, res) => {
  await unlikeSongForUser(req.params.trackId, req.auth.userId);
  return res.status(204).send();
};

export const recordSongPlayController = async (req, res) => {
  const data = await recordSongPlayForUser(req.params.trackId, req.auth.userId, req.body ?? {});
  return sendSuccess(res, { status: 201, data });
};
