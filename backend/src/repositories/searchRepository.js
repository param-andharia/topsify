import { buildSongUserStateSelectSql, songArtistJoinSql, songArtistSelectSql, songBaseSelectSql } from "./songQueryFragments.js";

const songQueryClause = `
  FROM songs s
  ${songArtistJoinSql}
`;

const userCreatedPlaylistWhereClause = `
  p.is_public = true
  AND p.creator_id IS NOT NULL
  AND p.creator_id <> -1
`;

export const searchSongs = async (executor, queryText, limit, offset = 0, viewerId = null) => {
  const result = await executor.query(
    `
      SELECT
        ${songBaseSelectSql},
        ${songArtistSelectSql},
        ${buildSongUserStateSelectSql(4)}
      ${songQueryClause}
      WHERE s.track_name ILIKE '%' || $1 || '%'
         OR s.album_name ILIKE '%' || $1 || '%'
      GROUP BY s.track_id
      ORDER BY GREATEST(similarity(s.track_name, $1), similarity(COALESCE(s.album_name, ''), $1)) DESC, s.track_name ASC
      LIMIT $2
      OFFSET $3
    `,
    [queryText, limit, offset, viewerId]
  );

  return result.rows;
};

export const countSongs = async (executor, queryText) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM songs s
      WHERE s.track_name ILIKE '%' || $1 || '%'
         OR s.album_name ILIKE '%' || $1 || '%'
    `,
    [queryText]
  );

  return result.rows[0]?.total ?? 0;
};

export const searchArtists = async (executor, queryText, limit, offset = 0) => {
  const result = await executor.query(
    `
      SELECT
        a.artist_id AS "artistId",
        a.artist_name AS "artistName",
        a.artist_image_url AS "artistImageUrl",
        COUNT(sa.track_id)::INTEGER AS "trackCount"
      FROM artists a
      LEFT JOIN song_artists sa ON sa.artist_id = a.artist_id
      WHERE a.artist_name ILIKE '%' || $1 || '%'
      GROUP BY a.artist_id
      ORDER BY similarity(a.artist_name, $1) DESC, a.artist_name ASC
      LIMIT $2
      OFFSET $3
    `,
    [queryText, limit, offset]
  );

  return result.rows;
};

export const countArtists = async (executor, queryText) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM artists a
      WHERE a.artist_name ILIKE '%' || $1 || '%'
    `,
    [queryText]
  );

  return result.rows[0]?.total ?? 0;
};

export const searchAlbums = async (executor, queryText, limit, offset = 0) => {
  const result = await executor.query(
    `
      SELECT
        s.album_name AS "albumName",
        MAX(s.image_url) AS "imageUrl",
        COUNT(*)::INTEGER AS "trackCount",
        COALESCE(AVG(s.rating), 0) AS "averageRating"
      FROM songs s
      WHERE s.album_name IS NOT NULL
        AND s.album_name ILIKE '%' || $1 || '%'
      GROUP BY s.album_name
      ORDER BY similarity(s.album_name, $1) DESC, COUNT(*) DESC, s.album_name ASC
      LIMIT $2
      OFFSET $3
    `,
    [queryText, limit, offset]
  );

  return result.rows;
};

export const countAlbums = async (executor, queryText) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM (
        SELECT 1
        FROM songs s
        WHERE s.album_name IS NOT NULL
          AND s.album_name ILIKE '%' || $1 || '%'
        GROUP BY s.album_name
      ) album_matches
    `,
    [queryText]
  );

  return result.rows[0]?.total ?? 0;
};

export const searchPlaylists = async (executor, queryText, limit, offset = 0) => {
  const result = await executor.query(
    `
      SELECT
        p.playlist_id AS "playlistId",
        p.playlist_name AS "playlistName",
        p.playlist_image_url AS "playlistImageUrl",
        p.followers_count AS "followersCount",
        p.cached_song_count AS "cachedSongCount",
        p.creator_id AS "creatorId",
        u.username AS "creatorUsername"
      FROM playlists p
      LEFT JOIN users u ON u.user_id = p.creator_id
      WHERE ${userCreatedPlaylistWhereClause}
        AND p.playlist_name ILIKE '%' || $1 || '%'
      ORDER BY similarity(p.playlist_name, $1) DESC, p.followers_count DESC, p.playlist_name ASC
      LIMIT $2
      OFFSET $3
    `,
    [queryText, limit, offset]
  );

  return result.rows;
};

export const countPlaylists = async (executor, queryText) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM playlists p
      WHERE ${userCreatedPlaylistWhereClause}
        AND p.playlist_name ILIKE '%' || $1 || '%'
    `,
    [queryText]
  );

  return result.rows[0]?.total ?? 0;
};

export const searchUsers = async (executor, queryText, limit, offset = 0) => {
  const result = await executor.query(
    `
      SELECT
        u.user_id AS "userId",
        u.username,
        u.profile_image_url AS "profileImageUrl"
      FROM users u
      WHERE u.username ILIKE '%' || $1 || '%'
      ORDER BY similarity(u.username, $1) DESC, u.username ASC
      LIMIT $2
      OFFSET $3
    `,
    [queryText, limit, offset]
  );

  return result.rows;
};

export const countUsers = async (executor, queryText) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM users u
      WHERE u.username ILIKE '%' || $1 || '%'
    `,
    [queryText]
  );

  return result.rows[0]?.total ?? 0;
};
