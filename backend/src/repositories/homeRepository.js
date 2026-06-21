import { buildSongUserStateSelectSql, songArtistJoinSql, songArtistSelectSql, songBaseSelectSql } from "./songQueryFragments.js";

const mapPlaylistSummary = (row) => ({
  playlistId: row.playlist_id,
  playlistName: row.playlist_name,
  description: row.description,
  playlistImageUrl: row.playlist_image_url,
  isPublic: row.is_public,
  followersCount: row.followers_count,
  cachedSongCount: row.cached_song_count,
  cachedDurationMs: Number(row.cached_duration_ms ?? 0),
  playlistRating: row.playlist_rating,
  creatorId: row.creator_id,
  creatorUsername: row.creator_username,
  createdAt: row.created_at,
});

export const getPopularPlaylists = async (executor, limit) => {
  const result = await executor.query(
    `
      SELECT p.*, u.username AS creator_username
      FROM playlists p
      LEFT JOIN users u ON u.user_id = p.creator_id
      WHERE p.is_public = true
        AND p.creator_id IS NOT NULL
        AND p.creator_id <> -1
      ORDER BY p.followers_count DESC, p.cached_song_count DESC, p.created_at DESC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows.map(mapPlaylistSummary);
};

export const getFeaturedArtists = async (executor, limit) => {
  const result = await executor.query(
    `
      SELECT
        a.artist_id AS "artistId",
        a.artist_name AS "artistName",
        a.artist_image_url AS "artistImageUrl",
        COUNT(sa.track_id)::INTEGER AS "trackCount"
      FROM artists a
      LEFT JOIN song_artists sa ON sa.artist_id = a.artist_id
      GROUP BY a.artist_id
      ORDER BY COUNT(sa.track_id) DESC, a.artist_name ASC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows;
};

export const getFeaturedAlbums = async (executor, limit) => {
  const result = await executor.query(
    `
      SELECT
        s.album_name AS "albumName",
        MAX(s.image_url) AS "imageUrl",
        COUNT(*)::INTEGER AS "trackCount",
        COALESCE(AVG(s.rating), 0) AS "averageRating"
      FROM songs s
      WHERE s.album_name IS NOT NULL AND trim(s.album_name) <> ''
      GROUP BY s.album_name
      ORDER BY COUNT(*) DESC, AVG(s.rating) DESC NULLS LAST, s.album_name ASC
      LIMIT $1
    `,
    [limit]
  );

  return result.rows;
};

export const getPopularSongs = async (executor, limit, viewerId = null) => {
  const result = await executor.query(
    `
      SELECT
        ${songBaseSelectSql},
        ${songArtistSelectSql},
        ${buildSongUserStateSelectSql(2)}
      FROM songs s
      ${songArtistJoinSql}
      GROUP BY s.track_id
      ORDER BY s.rating DESC NULLS LAST, s.track_name ASC
      LIMIT $1
    `,
    [limit, viewerId]
  );

  return result.rows;
};
