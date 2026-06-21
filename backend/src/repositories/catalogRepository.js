import { buildSongUserStateSelectSql, songArtistJoinSql, songArtistSelectSql, songBaseSelectSql } from "./songQueryFragments.js";

export const getArtistById = async (executor, artistId) => {
  const result = await executor.query(
    `
      SELECT
        a.artist_id AS "artistId",
        a.artist_name AS "artistName",
        a.artist_image_url AS "artistImageUrl",
        COUNT(sa.track_id)::INTEGER AS "trackCount"
      FROM artists a
      LEFT JOIN song_artists sa ON sa.artist_id = a.artist_id
      WHERE a.artist_id = $1
      GROUP BY a.artist_id
      LIMIT 1
    `,
    [artistId]
  );

  return result.rows[0] ?? null;
};

export const getArtistSongs = async (executor, artistId, limit, offset = 0, viewerId = null) => {
  const result = await executor.query(
    `
      SELECT
        ${songBaseSelectSql},
        ${songArtistSelectSql},
        ${buildSongUserStateSelectSql(4)}
      FROM song_artists target_sa
      INNER JOIN songs s ON s.track_id = target_sa.track_id
      ${songArtistJoinSql}
      WHERE target_sa.artist_id = $1
      GROUP BY s.track_id
      ORDER BY s.track_name ASC
      LIMIT $2
      OFFSET $3
    `,
    [artistId, limit, offset, viewerId]
  );

  return result.rows;
};

export const countArtistSongs = async (executor, artistId) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM song_artists sa
      WHERE sa.artist_id = $1
    `,
    [artistId]
  );

  return result.rows[0]?.total ?? 0;
};

export const getAlbumByName = async (executor, albumName, viewerId = null) => {
  const result = await executor.query(
    `
      WITH album_base AS (
        SELECT
          s.album_name AS album_name,
          MAX(s.image_url) AS image_url,
          COUNT(*)::INTEGER AS track_count,
          COALESCE(SUM(s.duration_ms), 0)::BIGINT AS duration_ms,
          COALESCE(AVG(s.rating), 0) AS average_rating,
          COALESCE(
            array_remove(array_agg(DISTINCT a.artist_name), NULL),
            ARRAY[]::TEXT[]
          ) AS artist_names
        FROM songs s
        ${songArtistJoinSql}
        WHERE s.album_name IS NOT NULL
          AND lower(trim(s.album_name)) = lower(trim($1))
        GROUP BY s.album_name
      )
      SELECT
        album_base.album_name AS "albumName",
        album_base.image_url AS "imageUrl",
        album_base.track_count AS "trackCount",
        album_base.duration_ms AS "durationMs",
        album_base.average_rating AS "averageRating",
        album_base.artist_names AS "artistNames",
        album_playlist.playlist_id AS "playlistId",
        COALESCE(album_playlist.followers_count, 0)::INTEGER AS "followersCount",
        COALESCE(album_playlist.is_following, false) AS "isFollowing"
      FROM album_base
      LEFT JOIN LATERAL (
        SELECT
          p.playlist_id,
          p.followers_count,
          EXISTS(
            SELECT 1
            FROM playlist_follows pf
            WHERE pf.playlist_id = p.playlist_id
              AND pf.user_id = $2
          ) AS is_following
        FROM playlists p
        WHERE lower(trim(p.playlist_name)) = lower(trim(album_base.album_name))
          AND (p.creator_id IS NULL OR p.creator_id = -1)
        ORDER BY p.followers_count DESC, p.playlist_id DESC
        LIMIT 1
      ) album_playlist ON true
      LIMIT 1
    `,
    [albumName, viewerId]
  );

  return result.rows[0] ?? null;
};

export const getAlbumSongs = async (executor, albumName, limit, offset = 0, viewerId = null) => {
  const result = await executor.query(
    `
      SELECT
        ${songBaseSelectSql},
        ${songArtistSelectSql},
        ${buildSongUserStateSelectSql(4)}
      FROM songs s
      ${songArtistJoinSql}
      WHERE s.album_name IS NOT NULL
        AND lower(trim(s.album_name)) = lower(trim($1))
      GROUP BY s.track_id
      ORDER BY s.track_name ASC
      LIMIT $2
      OFFSET $3
    `,
    [albumName, limit, offset, viewerId]
  );

  return result.rows;
};

export const countAlbumSongs = async (executor, albumName) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM songs s
      WHERE s.album_name IS NOT NULL
        AND lower(trim(s.album_name)) = lower(trim($1))
    `,
    [albumName]
  );

  return result.rows[0]?.total ?? 0;
};
