import { getMyPlaylists, getMyProfile, getMySavedPlaylists, getProfileByUsername, getUserDetail } from "../services/userService.js";
import { sendSuccess } from "../utils/responses.js";

export const getMeController = async (req, res) => {
  const user = await getMyProfile(req.auth.userId);
  return sendSuccess(res, { data: { user } });
};

export const getMyPlaylistsController = async (req, res) => {
  const playlists = await getMyPlaylists(req.auth.userId);
  return sendSuccess(res, { data: { playlists } });
};

export const getMySavedPlaylistsController = async (req, res) => {
  const playlists = await getMySavedPlaylists(req.auth.userId);
  return sendSuccess(res, { data: { playlists } });
};

export const getUserByIdController = async (req, res) => {
  const data = await getUserDetail(Number.parseInt(req.params.userId, 10), req.auth.userId);
  return sendSuccess(res, { data });
};

export const getProfileByUsernameController = async (req, res) => {
  const user = await getProfileByUsername(req.params.username);
  return sendSuccess(res, { data: { user } });
};
