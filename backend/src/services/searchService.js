import { query } from "../config/db.js";
import {
  countAlbums,
  countArtists,
  countPlaylists,
  countSongs,
  countUsers,
  searchAlbums,
  searchArtists,
  searchPlaylists,
  searchSongs,
  searchUsers,
} from "../repositories/searchRepository.js";
import { buildMeta } from "../utils/pagination.js";

const VALID_TYPES = new Set(["all", "songs", "artists", "albums", "playlists", "users"]);

const previewLimit = (limit) => Math.min(limit, 8);

const buildSuggestions = ({ songs, artists, albums, playlists, users }, limit) => {
  const mixed = [
    ...songs.map((song) => ({
      type: "song",
      key: `song:${song.trackId}`,
      label: song.trackName,
      subtitle: [song.artists.join(", "), song.albumName].filter(Boolean).join(" • "),
      imageUrl: song.imageUrl,
      queryValue: song.trackName,
      target: { pathname: `/songs/${encodeURIComponent(song.trackId)}` },
    })),
    ...artists.map((artist) => ({
      type: "artist",
      key: `artist:${artist.artistId}`,
      label: artist.artistName,
      subtitle: `${artist.trackCount} tracks`,
      imageUrl: artist.artistImageUrl,
      queryValue: artist.artistName,
      target: { pathname: `/artists/${artist.artistId}` },
    })),
    ...albums.map((album) => ({
      type: "album",
      key: `album:${album.albumName}`,
      label: album.albumName,
      subtitle: `${album.trackCount} tracks`,
      imageUrl: album.imageUrl,
      queryValue: album.albumName,
      target: { pathname: `/albums/${encodeURIComponent(album.albumName)}` },
    })),
    ...playlists.map((playlist) => ({
      type: "playlist",
      key: `playlist:${playlist.playlistId}`,
      label: playlist.playlistName,
      subtitle: playlist.creatorUsername ? `By ${playlist.creatorUsername}` : "Playlist",
      imageUrl: playlist.playlistImageUrl,
      queryValue: playlist.playlistName,
      target: { pathname: `/playlists/${playlist.playlistId}` },
    })),
    ...users.map((user) => ({
      type: "user",
      key: `user:${user.userId}`,
      label: user.username,
      subtitle: "Profile",
      imageUrl: user.profileImageUrl,
      queryValue: user.username,
      target: { pathname: `/users/${user.userId}` },
    })),
  ];

  return mixed.slice(0, limit);
};

export const getSuggestions = async (rawQuery, limit) => {
  const queryText = rawQuery?.trim();

  if (!queryText) {
    return [];
  }

  const executor = { query };
  const bucketLimit = Math.max(2, Math.ceil(limit / 4));

  const [songs, artists, albums, playlists, users] = await Promise.all([
    searchSongs(executor, queryText, bucketLimit),
    searchArtists(executor, queryText, bucketLimit),
    searchAlbums(executor, queryText, bucketLimit),
    searchPlaylists(executor, queryText, bucketLimit),
    searchUsers(executor, queryText, bucketLimit),
  ]);

  return buildSuggestions({ songs, artists, albums, playlists, users }, limit);
};

export const searchCatalog = async ({ queryText, type, page, limit, offset, userId }) => {
  const normalizedType = VALID_TYPES.has(type) ? type : "all";
  const executor = { query };

  if (normalizedType === "all") {
    const sectionLimit = previewLimit(limit);
    const [songs, artists, albums, playlists, users] = await Promise.all([
      searchSongs(executor, queryText, sectionLimit, 0, userId),
      searchArtists(executor, queryText, sectionLimit),
      searchAlbums(executor, queryText, sectionLimit),
      searchPlaylists(executor, queryText, sectionLimit),
      searchUsers(executor, queryText, sectionLimit),
    ]);

    return {
      query: queryText,
      type: normalizedType,
      results: { songs, artists, albums, playlists, users },
      meta: {
        page,
        limit,
        total: songs.length + artists.length + albums.length + playlists.length + users.length,
        hasNextPage: false,
      },
    };
  }

  const handlers = {
    songs: [searchSongs, countSongs],
    artists: [searchArtists, countArtists],
    albums: [searchAlbums, countAlbums],
    playlists: [searchPlaylists, countPlaylists],
    users: [searchUsers, countUsers],
  };

  const [searchHandler, countHandler] = handlers[normalizedType];
  const [items, total] = await Promise.all([
    normalizedType === "songs"
      ? searchHandler(executor, queryText, limit, offset, userId)
      : searchHandler(executor, queryText, limit, offset),
    countHandler(executor, queryText),
  ]);

  return {
    query: queryText,
    type: normalizedType,
    results: { [normalizedType]: items },
    meta: buildMeta({ page, limit, total }),
  };
};
