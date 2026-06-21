export const songArtistJoinSql = `
  LEFT JOIN song_artists sa ON sa.track_id = s.track_id
  LEFT JOIN artists a ON a.artist_id = sa.artist_id
`;

export const songBaseSelectSql = `
  s.track_id AS "trackId",
  s.track_name AS "trackName",
  s.album_name AS "albumName",
  s.duration_ms AS "durationMs",
  s.image_url AS "imageUrl",
  s.rating,
  s.explicit
`;

export const songArtistSelectSql = `
  COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'artistId', a.artist_id,
        'artistName', a.artist_name
      )
      ORDER BY sa.artist_order
    ) FILTER (WHERE a.artist_id IS NOT NULL),
    '[]'::jsonb
  ) AS "artistItems",
  COALESCE(
    array_remove(array_agg(a.artist_name ORDER BY sa.artist_order), NULL),
    ARRAY[]::TEXT[]
  ) AS artists
`;

export const buildSongUserStateSelectSql = (viewerParamIndex) => `
  EXISTS(
    SELECT 1
    FROM user_liked_songs uls
    WHERE uls.track_id = s.track_id
      AND uls.user_id = $${viewerParamIndex}
  ) AS "isLiked"
`;
