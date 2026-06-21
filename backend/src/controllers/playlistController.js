import {
  addTrackToPlaylist,
  createPlaylistForUser,
  followPlaylist,
  getPlaylistDetail,
  removeTrackFromPlaylist,
  unfollowPlaylist,
} from "../services/playlistService.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/responses.js";

export const getPlaylistController = async (req, res) => {
  const pagination = getPagination(req.query.page, req.query.limit, 25, 100);
  const data = await getPlaylistDetail(req.params.playlistId, req.auth.userId, pagination.page, pagination.limit, pagination.offset);
  return sendSuccess(res, {
    data: {
      playlist: data.playlist,
      songs: data.songs,
    },
    meta: data.meta,
  });
};

export const createPlaylistController = async (req, res) => {
  const playlist = await createPlaylistForUser(req.auth.userId, req.body);
  return sendSuccess(res, { status: 201, data: { playlist } });
};

export const addTrackToPlaylistController = async (req, res) => {
  const data = await addTrackToPlaylist(req.params.playlistId, req.body.trackId, req.auth.userId);
  return sendSuccess(res, { status: 201, data });
};

export const removeTrackFromPlaylistController = async (req, res) => {
  await removeTrackFromPlaylist(req.params.playlistId, req.params.trackId, req.auth.userId);
  return res.status(204).send();
};

export const followPlaylistController = async (req, res) => {
  const data = await followPlaylist(req.params.playlistId, req.auth.userId);
  return sendSuccess(res, { status: 201, data });
};

export const unfollowPlaylistController = async (req, res) => {
  await unfollowPlaylist(req.params.playlistId, req.auth.userId);
  return res.status(204).send();
};
