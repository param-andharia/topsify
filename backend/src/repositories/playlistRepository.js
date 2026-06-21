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
  updatedAt: row.updated_at,
  isOwner: row.is_owner,
  isFollowing: row.is_following,
});

export const getPlaylistByIdForUser = async (executor, playlistId, userId) => {
  const result = await executor.query(
    `
      SELECT
        p.*,
        u.username AS creator_username,
        (p.creator_id = $2) AS is_owner,
        EXISTS(
          SELECT 1
          FROM playlist_follows pf
          WHERE pf.playlist_id = p.playlist_id
            AND pf.user_id = $2
        ) AS is_following
      FROM playlists p
      LEFT JOIN users u ON u.user_id = p.creator_id
      WHERE p.playlist_id = $1
        AND (
          p.is_public = true
          OR p.creator_id = $2
          OR EXISTS (
            SELECT 1
            FROM playlist_collaborators pc
            WHERE pc.playlist_id = p.playlist_id
              AND pc.user_id = $2
          )
        )
      LIMIT 1
    `,
    [playlistId, userId]
  );

  return result.rows[0] ? mapPlaylistSummary(result.rows[0]) : null;
};

export const countPlaylistSongs = async (executor, playlistId) => {
  const result = await executor.query(
    `
      SELECT COUNT(*)::INTEGER AS total
      FROM playlist_songs
      WHERE playlist_id = $1
    `,
    [playlistId]
  );

  return result.rows[0]?.total ?? 0;
};

export const getPlaylistSongs = async (executor, playlistId, limit, offset = 0, viewerId = null) => {
  const result = await executor.query(
    `
      SELECT
        ${songBaseSelectSql},
        ps.added_at AS "addedAt",
        ${songArtistSelectSql},
        ${buildSongUserStateSelectSql(4)}
      FROM playlist_songs ps
      INNER JOIN songs s ON s.track_id = ps.track_id
      ${songArtistJoinSql}
      WHERE ps.playlist_id = $1
      GROUP BY s.track_id, ps.added_at, ps.position
      ORDER BY ps.position NULLS LAST, ps.added_at ASC
      LIMIT $2
      OFFSET $3
    `,
    [playlistId, limit, offset, viewerId]
  );

  return result.rows;
};

export const createPlaylist = async (executor, { creatorId, playlistName, description, isPublic }) => {
  const result = await executor.query(
    `
      INSERT INTO playlists (creator_id, playlist_name, description, is_public)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [creatorId, playlistName, description || null, isPublic]
  );

  return mapPlaylistSummary({ ...result.rows[0], creator_username: null, is_owner: true, is_following: false });
};

export const getOwnedPlaylistByName = async (executor, { creatorId, playlistName }) => {
  const result = await executor.query(
    `
      SELECT p.*, u.username AS creator_username
      FROM playlists p
      LEFT JOIN users u ON u.user_id = p.creator_id
      WHERE p.creator_id = $1
        AND lower(trim(p.playlist_name)) = lower(trim($2))
      LIMIT 1
    `,
    [creatorId, playlistName]
  );

  return result.rows[0] ? mapPlaylistSummary({ ...result.rows[0], is_owner: true, is_following: false }) : null;
};

export const getPlaylistOwnerId = async (executor, playlistId) => {
  const result = await executor.query(
    `
      SELECT creator_id
      FROM playlists
      WHERE playlist_id = $1
      LIMIT 1
    `,
    [playlistId]
  );

  return result.rows[0]?.creator_id ?? null;
};

export const songExists = async (executor, trackId) => {
  const result = await executor.query(
    `
      SELECT track_id
      FROM songs
      WHERE track_id = $1
      LIMIT 1
    `,
    [trackId]
  );

  return Boolean(result.rows[0]);
};

export const addSongToPlaylist = async (executor, { playlistId, trackId, userId }) => {
  const result = await executor.query(
    `
      INSERT INTO playlist_songs (playlist_id, track_id, added_by)
      VALUES ($1, $2, $3)
      ON CONFLICT (playlist_id, track_id) DO NOTHING
      RETURNING playlist_id
    `,
    [playlistId, trackId, userId]
  );

  return result.rowCount > 0;
};

export const removeSongFromPlaylist = async (executor, { playlistId, trackId }) => {
  const result = await executor.query(
    `
      DELETE FROM playlist_songs
      WHERE playlist_id = $1 AND track_id = $2
    `,
    [playlistId, trackId]
  );

  return result.rowCount > 0;
};

export const syncPlaylistStats = async (executor, playlistId) => {
  const result = await executor.query(
    `
      UPDATE playlists p
      SET
        cached_song_count = stats.song_count,
        cached_duration_ms = stats.duration_ms
      FROM (
        SELECT
          ps.playlist_id,
          COUNT(*)::INTEGER AS song_count,
          COALESCE(SUM(s.duration_ms), 0)::BIGINT AS duration_ms
        FROM playlist_songs ps
        INNER JOIN songs s ON s.track_id = ps.track_id
        WHERE ps.playlist_id = $1
        GROUP BY ps.playlist_id
      ) stats
      WHERE p.playlist_id = stats.playlist_id
      RETURNING p.cached_song_count, p.cached_duration_ms
    `,
    [playlistId]
  );

  if (!result.rows[0]) {
    await executor.query(
      `
        UPDATE playlists
        SET cached_song_count = 0, cached_duration_ms = 0
        WHERE playlist_id = $1
      `,
      [playlistId]
    );
  }
};

export const addPlaylistFollow = async (executor, { playlistId, userId }) => {
  const result = await executor.query(
    `
      INSERT INTO playlist_follows (user_id, playlist_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, playlist_id) DO NOTHING
      RETURNING playlist_id
    `,
    [userId, playlistId]
  );

  return result.rowCount > 0;
};

export const removePlaylistFollow = async (executor, { playlistId, userId }) => {
  const result = await executor.query(
    `
      DELETE FROM playlist_follows
      WHERE user_id = $1 AND playlist_id = $2
    `,
    [userId, playlistId]
  );

  return result.rowCount > 0;
};

export const syncPlaylistFollowers = async (executor, playlistId) => {
  await executor.query(
    `
      UPDATE playlists p
      SET followers_count = follower_counts.total
      FROM (
        SELECT playlist_id, COUNT(*)::INTEGER AS total
        FROM playlist_follows
        WHERE playlist_id = $1
        GROUP BY playlist_id
      ) follower_counts
      WHERE p.playlist_id = follower_counts.playlist_id
    `,
    [playlistId]
  );

  await executor.query(
    `
      UPDATE playlists
      SET followers_count = 0
      WHERE playlist_id = $1
        AND NOT EXISTS (
          SELECT 1
          FROM playlist_follows
          WHERE playlist_id = $1
        )
    `,
    [playlistId]
  );
};
