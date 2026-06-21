import { query, withTransaction } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import { buildMeta } from "../utils/pagination.js";
import {
  addPlaylistFollow,
  addSongToPlaylist,
  countPlaylistSongs,
  createPlaylist,
  getPlaylistByIdForUser,
  getPlaylistOwnerId,
  getPlaylistSongs,
  removePlaylistFollow,
  removeSongFromPlaylist,
  songExists,
  syncPlaylistFollowers,
  syncPlaylistStats,
} from "../repositories/playlistRepository.js";

const assertEditableByOwner = async (playlistId, userId) => {
  const ownerId = await getPlaylistOwnerId({ query }, playlistId);

  if (ownerId === null) {
    throw new ApiError(404, "PLAYLIST_NOT_FOUND", "Playlist could not be found.");
  }

  if (ownerId !== userId) {
    throw new ApiError(403, "FORBIDDEN", "Only the playlist owner can modify this playlist.");
  }
};

export const createPlaylistForUser = async (userId, { playlistName, description, isPublic }) => {
  if (!playlistName?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Playlist name is required.");
  }

  try {
    return await withTransaction((client) =>
      createPlaylist(client, {
        creatorId: userId,
        playlistName: playlistName.trim(),
        description: description?.trim(),
        isPublic: isPublic ?? true,
      })
    );
  } catch (error) {
    if (error.code === "23505") {
      throw new ApiError(409, "PLAYLIST_NAME_TAKEN", "You already have a playlist with that name.");
    }

    throw error;
  }
};

export const getPlaylistDetail = async (playlistId, userId, page, limit, offset) => {
  const playlist = await getPlaylistByIdForUser({ query }, playlistId, userId);

  if (!playlist) {
    throw new ApiError(404, "PLAYLIST_NOT_FOUND", "Playlist could not be found.");
  }

  const [songs, total] = await Promise.all([
    getPlaylistSongs({ query }, playlistId, limit, offset, userId),
    countPlaylistSongs({ query }, playlistId),
  ]);

  return {
    playlist,
    songs,
    meta: buildMeta({ page, limit, total }),
  };
};

export const addTrackToPlaylist = async (playlistId, trackId, userId) => {
  if (!trackId?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "trackId is required.");
  }

  await assertEditableByOwner(playlistId, userId);

  const exists = await songExists({ query }, trackId.trim());
  if (!exists) {
    throw new ApiError(404, "TRACK_NOT_FOUND", "Track could not be found.");
  }

  const created = await withTransaction(async (client) => {
    const inserted = await addSongToPlaylist(client, {
      playlistId,
      trackId: trackId.trim(),
      userId,
    });

    await syncPlaylistStats(client, playlistId);
    return inserted;
  });

  if (!created) {
    throw new ApiError(409, "TRACK_ALREADY_IN_PLAYLIST", "That track is already in the playlist.");
  }

  return { playlistId, trackId: trackId.trim() };
};

export const removeTrackFromPlaylist = async (playlistId, trackId, userId) => {
  await assertEditableByOwner(playlistId, userId);

  const removed = await withTransaction(async (client) => {
    const didRemove = await removeSongFromPlaylist(client, { playlistId, trackId });
    await syncPlaylistStats(client, playlistId);
    return didRemove;
  });

  if (!removed) {
    throw new ApiError(404, "TRACK_NOT_IN_PLAYLIST", "That track is not in the playlist.");
  }
};

export const followPlaylist = async (playlistId, userId) => {
  const playlist = await getPlaylistByIdForUser({ query }, playlistId, userId);

  if (!playlist) {
    throw new ApiError(404, "PLAYLIST_NOT_FOUND", "Playlist could not be found.");
  }

  if (playlist.isOwner) {
    throw new ApiError(400, "OWN_PLAYLIST", "You already own this playlist.");
  }

  const didFollow = await withTransaction(async (client) => {
    const created = await addPlaylistFollow(client, { playlistId, userId });
    await syncPlaylistFollowers(client, playlistId);
    return created;
  });

  if (!didFollow) {
    throw new ApiError(409, "ALREADY_FOLLOWING", "You already saved this playlist.");
  }

  return { playlistId };
};

export const unfollowPlaylist = async (playlistId, userId) => {
  const playlist = await getPlaylistByIdForUser({ query }, playlistId, userId);

  if (!playlist) {
    throw new ApiError(404, "PLAYLIST_NOT_FOUND", "Playlist could not be found.");
  }

  const didUnfollow = await withTransaction(async (client) => {
    const removed = await removePlaylistFollow(client, { playlistId, userId });
    await syncPlaylistFollowers(client, playlistId);
    return removed;
  });

  if (!didUnfollow) {
    throw new ApiError(404, "NOT_FOLLOWING", "You have not saved this playlist.");
  }
};
