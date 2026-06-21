-- Source of truth:
-- /Users/paramandharia/Downloads/music project/music_service_schema_recommendation_v2_track_id.sql
-- Track-first schema. Songs are keyed by track_id and genre data lives in genres + song_genres.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  username VARCHAR(80) NOT NULL,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  dob DATE,
  subscription VARCHAR(50) NOT NULL DEFAULT 'Free',
  profile_image_url TEXT,
  followers_count INTEGER NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
  following_count INTEGER NOT NULL DEFAULT 0 CHECK (following_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email_lower ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username_lower ON users (lower(username));
CREATE INDEX IF NOT EXISTS ix_users_username_trgm ON users USING GIN (username gin_trgm_ops);

CREATE TABLE IF NOT EXISTS user_phone_numbers (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  phone_no VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, phone_no)
);

CREATE TABLE IF NOT EXISTS songs (
  track_id VARCHAR(64) PRIMARY KEY,
  track_name VARCHAR(500) NOT NULL,
  album_name VARCHAR(500),
  rating NUMERIC(3,1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  explicit BOOLEAN NOT NULL DEFAULT false,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_songs_track_name_trgm ON songs USING GIN (track_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_songs_album_name_trgm ON songs USING GIN (album_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS ix_songs_rating ON songs(rating DESC);

CREATE TABLE IF NOT EXISTS artists (
  artist_id BIGSERIAL PRIMARY KEY,
  artist_name VARCHAR(500) NOT NULL,
  artist_image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_artists_name_lower ON artists (lower(artist_name));
CREATE INDEX IF NOT EXISTS ix_artists_name_trgm ON artists USING GIN (artist_name gin_trgm_ops);

CREATE TABLE IF NOT EXISTS song_artists (
  track_id VARCHAR(64) NOT NULL REFERENCES songs(track_id) ON DELETE CASCADE,
  artist_id BIGINT NOT NULL REFERENCES artists(artist_id) ON DELETE CASCADE,
  artist_order SMALLINT NOT NULL DEFAULT 1 CHECK (artist_order > 0),
  PRIMARY KEY (track_id, artist_id)
);

CREATE INDEX IF NOT EXISTS ix_song_artists_artist_id ON song_artists(artist_id);
CREATE INDEX IF NOT EXISTS ix_song_artists_track_order ON song_artists(track_id, artist_order);

CREATE TABLE IF NOT EXISTS genres (
  genre_id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS song_genres (
  track_id VARCHAR(64) NOT NULL REFERENCES songs(track_id) ON DELETE CASCADE,
  genre_id BIGINT NOT NULL REFERENCES genres(genre_id) ON DELETE CASCADE,
  source VARCHAR(40) NOT NULL DEFAULT 'legacy',
  PRIMARY KEY (track_id, genre_id)
);

CREATE INDEX IF NOT EXISTS ix_song_genres_genre_id ON song_genres(genre_id);

CREATE TABLE IF NOT EXISTS playlists (
  playlist_id BIGSERIAL PRIMARY KEY,
  creator_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  playlist_name VARCHAR(500) NOT NULL,
  description TEXT,
  playlist_image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  followers_count INTEGER NOT NULL DEFAULT 0 CHECK (followers_count >= 0),
  cached_song_count INTEGER NOT NULL DEFAULT 0 CHECK (cached_song_count >= 0),
  cached_duration_ms BIGINT NOT NULL DEFAULT 0 CHECK (cached_duration_ms >= 0),
  playlist_rating NUMERIC(3,1) NOT NULL DEFAULT 0 CHECK (playlist_rating >= 0 AND playlist_rating <= 5),
  CONSTRAINT ux_creator_playlist_name UNIQUE (creator_id, playlist_name)
);

CREATE INDEX IF NOT EXISTS ix_playlists_creator_id ON playlists(creator_id);
CREATE INDEX IF NOT EXISTS ix_playlists_public_name_trgm ON playlists USING GIN (playlist_name gin_trgm_ops) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS ix_playlists_followers ON playlists(followers_count DESC);

CREATE TABLE IF NOT EXISTS playlist_songs (
  playlist_id BIGINT NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
  track_id VARCHAR(64) NOT NULL REFERENCES songs(track_id) ON DELETE CASCADE,
  added_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  position INTEGER,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, track_id)
);

CREATE INDEX IF NOT EXISTS ix_playlist_songs_track_id ON playlist_songs(track_id);
CREATE INDEX IF NOT EXISTS ix_playlist_songs_playlist_position ON playlist_songs(playlist_id, position NULLS LAST, added_at);

CREATE TABLE IF NOT EXISTS playlist_follows (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  playlist_id BIGINT NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, playlist_id)
);

CREATE INDEX IF NOT EXISTS ix_playlist_follows_playlist_id ON playlist_follows(playlist_id);

CREATE TABLE IF NOT EXISTS playlist_collaborators (
  playlist_id BIGINT NOT NULL REFERENCES playlists(playlist_id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role VARCHAR(30) NOT NULL DEFAULT 'editor' CHECK (role IN ('viewer', 'editor', 'owner')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (playlist_id, user_id)
);

CREATE TABLE IF NOT EXISTS user_liked_songs (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  track_id VARCHAR(64) NOT NULL REFERENCES songs(track_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS ix_user_liked_songs_track_id ON user_liked_songs(track_id);

CREATE TABLE IF NOT EXISTS song_ratings (
  user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  track_id VARCHAR(64) NOT NULL REFERENCES songs(track_id) ON DELETE CASCADE,
  rating NUMERIC(3,1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, track_id)
);

CREATE INDEX IF NOT EXISTS ix_song_ratings_track_id ON song_ratings(track_id);

CREATE TABLE IF NOT EXISTS user_song_events (
  event_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  track_id VARCHAR(64) REFERENCES songs(track_id) ON DELETE SET NULL,
  event_type VARCHAR(40) NOT NULL CHECK (event_type IN ('search_impression', 'search_click', 'spotify_redirect', 'play', 'like', 'add_to_playlist')),
  search_query TEXT,
  source VARCHAR(80),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ix_user_song_events_user_time ON user_song_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_user_song_events_track_time ON user_song_events(track_id, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_user_song_events_type_time ON user_song_events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS ix_user_song_events_metadata_gin ON user_song_events USING GIN (metadata);

CREATE TABLE IF NOT EXISTS user_follows (
  follower_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  following_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS ix_user_follows_following_id ON user_follows(following_id);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['users', 'songs', 'artists', 'playlists', 'song_ratings'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%I_updated_at ON %I', tbl, tbl);
    EXECUTE format('CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', tbl, tbl);
  END LOOP;
END $$;
