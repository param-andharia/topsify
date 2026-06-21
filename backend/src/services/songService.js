import { query, withTransaction } from "../config/db.js";
import { addSongToPlaylist, createPlaylist, getOwnedPlaylistByName, removeSongFromPlaylist, syncPlaylistStats } from "../repositories/playlistRepository.js";
import {
  addSongLike,
  createSongEvent,
  getSongByTrackIdForUser,
  getSongExistsByTrackId,
  removeSongLike,
} from "../repositories/songRepository.js";
import { ApiError } from "../utils/ApiError.js";

const LIKED_SONGS_PLAYLIST_NAME = "Liked Songs";

const assertSongExists = async (trackId) => {
  const exists = await getSongExistsByTrackId({ query }, trackId);

  if (!exists) {
    throw new ApiError(404, "SONG_NOT_FOUND", "Song could not be found.");
  }
};

const getOrCreateLikedSongsPlaylist = async (executor, userId) => {
  const existingPlaylist = await getOwnedPlaylistByName(executor, {
    creatorId: userId,
    playlistName: LIKED_SONGS_PLAYLIST_NAME,
  });

  if (existingPlaylist) {
    return existingPlaylist;
  }

  return createPlaylist(executor, {
    creatorId: userId,
    playlistName: LIKED_SONGS_PLAYLIST_NAME,
    description: "Automatically managed playlist for songs you like.",
    isPublic: false,
  });
};

export const getSongDetail = async (trackId, userId) => {
  if (!trackId?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "trackId is required.");
  }

  const song = await getSongByTrackIdForUser({ query }, trackId.trim(), userId);

  if (!song) {
    throw new ApiError(404, "SONG_NOT_FOUND", "Song could not be found.");
  }

  return song;
};

export const likeSongForUser = async (trackId, userId, { source, searchQuery, metadata } = {}) => {
  if (!trackId?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "trackId is required.");
  }

  const normalizedTrackId = trackId.trim();
  await assertSongExists(normalizedTrackId);

  const liked = await withTransaction(async (client) => {
    const created = await addSongLike(client, { trackId: normalizedTrackId, userId });

    if (created) {
      const likedSongsPlaylist = await getOrCreateLikedSongsPlaylist(client, userId);

      await addSongToPlaylist(client, {
        playlistId: likedSongsPlaylist.playlistId,
        trackId: normalizedTrackId,
        userId,
      });
      await syncPlaylistStats(client, likedSongsPlaylist.playlistId);

      await createSongEvent(client, {
        userId,
        trackId: normalizedTrackId,
        eventType: "like",
        source,
        searchQuery,
        metadata,
      });
    }

    return created;
  });

  if (!liked) {
    throw new ApiError(409, "SONG_ALREADY_LIKED", "You already liked this song.");
  }

  return { trackId: normalizedTrackId };
};

export const unlikeSongForUser = async (trackId, userId) => {
  if (!trackId?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "trackId is required.");
  }

  const normalizedTrackId = trackId.trim();
  await assertSongExists(normalizedTrackId);

  const removed = await withTransaction(async (client) => {
    const didRemove = await removeSongLike(client, { trackId: normalizedTrackId, userId });

    if (!didRemove) {
      return false;
    }

    const likedSongsPlaylist = await getOwnedPlaylistByName(client, {
      creatorId: userId,
      playlistName: LIKED_SONGS_PLAYLIST_NAME,
    });

    if (likedSongsPlaylist) {
      await removeSongFromPlaylist(client, {
        playlistId: likedSongsPlaylist.playlistId,
        trackId: normalizedTrackId,
      });
      await syncPlaylistStats(client, likedSongsPlaylist.playlistId);
    }

    return true;
  });

  if (!removed) {
    throw new ApiError(404, "SONG_NOT_LIKED", "You have not liked this song.");
  }
};

export const recordSongPlayForUser = async (trackId, userId, { source, searchQuery, metadata } = {}) => {
  if (!trackId?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "trackId is required.");
  }

  const normalizedTrackId = trackId.trim();
  await assertSongExists(normalizedTrackId);

  await createSongEvent(
    { query },
    {
      userId,
      trackId: normalizedTrackId,
      eventType: "play",
      source,
      searchQuery,
      metadata,
    }
  );

  return { trackId: normalizedTrackId };
};
