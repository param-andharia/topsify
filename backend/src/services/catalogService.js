import { query } from "../config/db.js";
import {
  countAlbumSongs,
  countArtistSongs,
  getAlbumByName,
  getAlbumSongs,
  getArtistById,
  getArtistSongs,
} from "../repositories/catalogRepository.js";
import { ApiError } from "../utils/ApiError.js";
import { buildMeta } from "../utils/pagination.js";

export const getArtistDetail = async (artistId, userId, page, limit, offset) => {
  const artist = await getArtistById({ query }, artistId);

  if (!artist) {
    throw new ApiError(404, "ARTIST_NOT_FOUND", "Artist could not be found.");
  }

  const [songs, total] = await Promise.all([
    getArtistSongs({ query }, artistId, limit, offset, userId),
    countArtistSongs({ query }, artistId),
  ]);

  return {
    artist,
    songs,
    meta: buildMeta({ page, limit, total }),
  };
};

export const getAlbumDetail = async (albumName, userId, page, limit, offset) => {
  if (!albumName?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Album name is required.");
  }

  const album = await getAlbumByName({ query }, albumName, userId);

  if (!album) {
    throw new ApiError(404, "ALBUM_NOT_FOUND", "Album could not be found.");
  }

  const [songs, total] = await Promise.all([
    getAlbumSongs({ query }, albumName, limit, offset, userId),
    countAlbumSongs({ query }, albumName),
  ]);

  return {
    album,
    songs,
    meta: buildMeta({ page, limit, total }),
  };
};
