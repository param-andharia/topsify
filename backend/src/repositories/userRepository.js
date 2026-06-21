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

const mapUserRow = (row) =>
  row
    ? {
        userId: row.user_id,
        username: row.username,
        email: row.email,
        dob: row.dob,
        subscription: row.subscription,
        profileImageUrl: row.profile_image_url,
        followersCount: row.followers_count,
        followingCount: row.following_count,
        createdAt: row.created_at,
      }
    : null;

export const getUserProfileById = async (executor, userId) => {
  const result = await executor.query(
    `
      SELECT *
      FROM users
      WHERE user_id = $1
      LIMIT 1
    `,
    [userId]
  );

  return mapUserRow(result.rows[0]);
};

export const getUserProfileByUsername = async (executor, username) => {
  const result = await executor.query(
    `
      SELECT *
      FROM users
      WHERE lower(username) = lower($1)
      LIMIT 1
    `,
    [username]
  );

  return mapUserRow(result.rows[0]);
};

export const getOwnedPlaylists = async (executor, userId) => {
  const result = await executor.query(
    `
      SELECT p.*, u.username AS creator_username
      FROM playlists p
      LEFT JOIN users u ON u.user_id = p.creator_id
      WHERE p.creator_id = $1
      ORDER BY p.updated_at DESC, p.created_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapPlaylistSummary);
};

export const getVisibleOwnedPlaylists = async (executor, ownerId, viewerId) => {
  const result = await executor.query(
    `
      SELECT p.*, u.username AS creator_username
      FROM playlists p
      LEFT JOIN users u ON u.user_id = p.creator_id
      WHERE p.creator_id = $1
        AND ($2::boolean = true OR p.is_public = true)
      ORDER BY p.updated_at DESC, p.created_at DESC
    `,
    [ownerId, ownerId === viewerId]
  );

  return result.rows.map(mapPlaylistSummary);
};

export const getSavedPlaylists = async (executor, userId) => {
  const result = await executor.query(
    `
      SELECT p.*, u.username AS creator_username
      FROM playlist_follows pf
      INNER JOIN playlists p ON p.playlist_id = pf.playlist_id
      LEFT JOIN users u ON u.user_id = p.creator_id
      WHERE pf.user_id = $1
      ORDER BY pf.created_at DESC
    `,
    [userId]
  );

  return result.rows.map(mapPlaylistSummary);
};
