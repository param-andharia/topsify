import { buildSongUserStateSelectSql, songArtistJoinSql, songArtistSelectSql, songBaseSelectSql } from "./songQueryFragments.js";

const userCreatedPlaylistPredicate = `
  p.creator_id IS NOT NULL
  AND p.creator_id <> -1
`;

export const getSongByTrackIdForUser = async (executor, trackId, userId) => {
  const result = await executor.query(
    `
      SELECT
        ${songBaseSelectSql},
        ${songArtistSelectSql},
        ${buildSongUserStateSelectSql(2)},
        (
          SELECT COUNT(*)::INTEGER
          FROM user_liked_songs uls
          WHERE uls.track_id = s.track_id
        ) AS "likesCount",
        (
          SELECT COUNT(*)::INTEGER
          FROM user_song_events usev
          WHERE usev.track_id = s.track_id
            AND usev.event_type = 'play'
        ) AS "playsCount",
        (
          SELECT COUNT(DISTINCT ps.playlist_id)::INTEGER
          FROM playlist_songs ps
          INNER JOIN playlists p ON p.playlist_id = ps.playlist_id
          WHERE ps.track_id = s.track_id
            AND ${userCreatedPlaylistPredicate}
        ) AS "userPlaylistCount"
      FROM songs s
      ${songArtistJoinSql}
      WHERE s.track_id = $1
      GROUP BY s.track_id
      LIMIT 1
    `,
    [trackId, userId]
  );

  return result.rows[0] ?? null;
};

export const getSongExistsByTrackId = async (executor, trackId) => {
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

export const addSongLike = async (executor, { trackId, userId }) => {
  const result = await executor.query(
    `
      INSERT INTO user_liked_songs (user_id, track_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, track_id) DO NOTHING
      RETURNING track_id
    `,
    [userId, trackId]
  );

  return result.rowCount > 0;
};

export const removeSongLike = async (executor, { trackId, userId }) => {
  const result = await executor.query(
    `
      DELETE FROM user_liked_songs
      WHERE user_id = $1
        AND track_id = $2
    `,
    [userId, trackId]
  );

  return result.rowCount > 0;
};

export const createSongEvent = async (
  executor,
  { userId, trackId, eventType, source = null, searchQuery = null, metadata = {} }
) => {
  await executor.query(
    `
      INSERT INTO user_song_events (user_id, track_id, event_type, source, search_query, metadata)
      VALUES ($1, $2, $3, $4, $5, $6::jsonb)
    `,
    [userId, trackId, eventType, source, searchQuery, JSON.stringify(metadata)]
  );
};
