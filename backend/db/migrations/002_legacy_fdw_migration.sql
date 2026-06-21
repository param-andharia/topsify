-- FDW-based migration path from the legacy backup into the track_id-first schema.
-- This follows the staged migration approach described in:
-- /Users/paramandharia/Downloads/music project/music_service_data_migration_plan.md
--
-- Expected setup:
--   1. Restore the old dump into a separate local database named music_old_staging.
--   2. Create the new target database and apply 001_init_schema.sql there.
--   3. Run this file against the new target database.

CREATE EXTENSION IF NOT EXISTS postgres_fdw;

DROP SERVER IF EXISTS old_music_server CASCADE;

CREATE SERVER old_music_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (dbname 'music_old_staging');

DROP USER MAPPING IF EXISTS FOR CURRENT_USER SERVER old_music_server;

DO $$
BEGIN
  EXECUTE format(
    'CREATE USER MAPPING FOR %I SERVER old_music_server OPTIONS (user %L)',
    current_user,
    current_user
  );
END $$;

DROP SCHEMA IF EXISTS old_music CASCADE;
CREATE SCHEMA old_music;

IMPORT FOREIGN SCHEMA public
FROM SERVER old_music_server
INTO old_music;

CREATE TABLE IF NOT EXISTS migration_rejected_songs AS
SELECT *
FROM old_music.songs
WHERE 1 = 0;

TRUNCATE TABLE migration_rejected_songs;

INSERT INTO users (user_id, username, email, password_hash, dob, subscription, followers_count, following_count, created_at)
SELECT
  u.user_id,
  COALESCE(NULLIF(trim(u.username), ''), 'legacy_user_' || u.user_id::TEXT) AS username,
  COALESCE(NULLIF(trim(u.email_id), ''), 'legacy_user_' || u.user_id::TEXT || '@local.dev') AS email,
  COALESCE(NULLIF(u.password, ''), 'legacy-password-needs-reset') AS password_hash,
  u.dob,
  COALESCE(NULLIF(u.subscription, ''), 'Free') AS subscription,
  COALESCE(u.followers, 0),
  COALESCE(u.following, 0),
  COALESCE(u.doj, now())
FROM old_music.users u
ON CONFLICT (user_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('users', 'user_id'), COALESCE((SELECT MAX(user_id) FROM users), 1), true);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'old_music'
      AND table_name = 'mobile_numbers'
  ) THEN
    INSERT INTO user_phone_numbers (user_id, phone_no)
    SELECT DISTINCT
      m.user_id,
      m.mobile_no::TEXT
    FROM old_music.mobile_numbers m
    INNER JOIN users u ON u.user_id = m.user_id
    WHERE m.mobile_no IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

INSERT INTO songs (track_id, track_name, album_name, rating, duration_ms, explicit)
SELECT DISTINCT ON (s.track_id)
  s.track_id,
  s.track_name,
  s.album_name,
  CASE
    WHEN s.rating IS NULL THEN NULL
    ELSE ROUND((LEAST(GREATEST(s.rating, 0), 10) / 2.0)::NUMERIC, 1)
  END AS rating,
  GREATEST(0, EXTRACT(EPOCH FROM s.duration)::INTEGER * 1000),
  COALESCE(s.explicit, false)
FROM old_music.songs s
WHERE s.track_id IS NOT NULL
ORDER BY s.track_id, s.song_id
ON CONFLICT (track_id) DO NOTHING;

INSERT INTO migration_rejected_songs
SELECT *
FROM old_music.songs s
WHERE s.track_id IS NULL;

INSERT INTO genres (name)
SELECT DISTINCT trim(s.genre)
FROM old_music.songs s
WHERE s.genre IS NOT NULL
  AND trim(s.genre) <> ''
ON CONFLICT (name) DO NOTHING;

INSERT INTO song_genres (track_id, genre_id, source)
SELECT DISTINCT
  s.track_id,
  g.genre_id,
  'legacy_songs.genre'
FROM old_music.songs s
INNER JOIN genres g ON g.name = trim(s.genre)
INNER JOIN songs ns ON ns.track_id = s.track_id
WHERE s.track_id IS NOT NULL
  AND s.genre IS NOT NULL
  AND trim(s.genre) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO artists (artist_name, artist_image_url)
SELECT DISTINCT
  trim(a.song_artists) AS artist_name,
  NULLIF(trim(a.artists_images), '') AS artist_image_url
FROM old_music.artists a
WHERE a.song_artists IS NOT NULL
  AND trim(a.song_artists) <> ''
ON CONFLICT DO NOTHING;

INSERT INTO song_artists (track_id, artist_id, artist_order)
SELECT DISTINCT
  s.track_id,
  ar.artist_id,
  1
FROM old_music.artists a
INNER JOIN old_music.songs s ON s.song_id = a.song_id
INNER JOIN artists ar ON lower(ar.artist_name) = lower(trim(a.song_artists))
WHERE s.track_id IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO playlists (
  playlist_id,
  creator_id,
  playlist_name,
  created_at,
  followers_count,
  cached_song_count,
  cached_duration_ms,
  playlist_rating
)
SELECT
  p.playlist_id,
  NULLIF(p.creator_id, -1),
  p.playlist_name,
  COALESCE(p.date_created, now()),
  COALESCE(p.followers, 0),
  COALESCE(p.count_of_songs, 0),
  COALESCE(GREATEST(0, EXTRACT(EPOCH FROM p.duration)::BIGINT * 1000), 0),
  COALESCE(ROUND((LEAST(GREATEST(p.playlist_rating, 0), 10) / 2.0)::NUMERIC, 1), 0)
FROM old_music.playlists p
ON CONFLICT (playlist_id) DO NOTHING;

UPDATE playlists p
SET creator_id = up.user_id
FROM old_music.user_playlists up
WHERE p.playlist_id = up.playlist_id
  AND p.creator_id IS NULL;

INSERT INTO playlists (
  playlist_id,
  creator_id,
  playlist_name,
  is_public,
  created_at,
  followers_count,
  cached_song_count,
  cached_duration_ms,
  playlist_rating
)
SELECT DISTINCT
  up.playlist_id,
  up.user_id,
  COALESCE(NULLIF(trim(up.playlist_name), ''), 'Recovered Playlist ' || up.playlist_id::TEXT),
  false,
  now(),
  0,
  0,
  0,
  0
FROM old_music.user_playlists up
LEFT JOIN playlists p ON p.playlist_id = up.playlist_id
WHERE p.playlist_id IS NULL
ON CONFLICT (playlist_id) DO NOTHING;

INSERT INTO playlists (
  playlist_id,
  creator_id,
  playlist_name,
  is_public,
  created_at,
  followers_count,
  cached_song_count,
  cached_duration_ms,
  playlist_rating
)
SELECT DISTINCT
  ps.playlist_id,
  NULL::BIGINT,
  COALESCE(NULLIF(trim(ps.playlist_name), ''), 'Recovered Playlist ' || ps.playlist_id::TEXT),
  false,
  now(),
  0,
  0,
  0,
  0
FROM old_music.playlist_songs ps
LEFT JOIN playlists p ON p.playlist_id = ps.playlist_id
WHERE p.playlist_id IS NULL
ON CONFLICT (playlist_id) DO NOTHING;

SELECT setval(pg_get_serial_sequence('playlists', 'playlist_id'), COALESCE((SELECT MAX(playlist_id) FROM playlists), 1), true);

INSERT INTO playlist_songs (playlist_id, track_id)
SELECT DISTINCT
  ps.playlist_id,
  s.track_id
FROM old_music.playlist_songs ps
INNER JOIN old_music.songs s ON s.song_id = ps.song_id
INNER JOIN playlists p ON p.playlist_id = ps.playlist_id
INNER JOIN songs ns ON ns.track_id = s.track_id
WHERE s.track_id IS NOT NULL
ON CONFLICT DO NOTHING;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'old_music'
      AND table_name = 'songs_rating'
  ) THEN
    INSERT INTO song_ratings (user_id, track_id, rating, created_at, updated_at)
    SELECT DISTINCT
      sr.user_id,
      s.track_id,
      sr.rating,
      now(),
      now()
    FROM old_music.songs_rating sr
    INNER JOIN old_music.songs s ON s.song_id = sr.song_id
    INNER JOIN songs ns ON ns.track_id = s.track_id
    ON CONFLICT (user_id, track_id) DO NOTHING;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'old_music'
      AND table_name = 'listens_'
  ) THEN
    INSERT INTO user_song_events (user_id, track_id, event_type, source, created_at)
    SELECT
      l.user_id,
      s.track_id,
      'play',
      'legacy_listens',
      now()
    FROM old_music.listens_ l
    INNER JOIN old_music.songs s ON s.song_id = l.song_id
    WHERE s.track_id IS NOT NULL;
  END IF;
END $$;

UPDATE playlists p
SET
  cached_song_count = totals.song_count,
  cached_duration_ms = totals.duration_ms
FROM (
  SELECT
    ps.playlist_id,
    COUNT(*)::INTEGER AS song_count,
    COALESCE(SUM(s.duration_ms), 0)::BIGINT AS duration_ms
  FROM playlist_songs ps
  INNER JOIN songs s ON s.track_id = ps.track_id
  GROUP BY ps.playlist_id
) totals
WHERE p.playlist_id = totals.playlist_id;
