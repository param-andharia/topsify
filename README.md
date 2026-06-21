# Topsify

Topsify is a full-stack music discovery and playlist application built with:

- React + Vite on the frontend
- Express on the backend
- PostgreSQL for application data and session storage

It supports session-cookie authentication, search suggestions, full catalog search, artist/album/song detail pages, user-created playlists, saved playlists, and an automatically managed `Liked Songs` playlist for each user.

## Features

- Email/password signup and login with server-side sessions
- Protected app shell with persistent session hydration
- Search with:
  - live suggestions
  - full search
  - filters for songs, artists, albums, playlists, and users
  - pagination for filtered results
- Entity detail pages for:
  - songs
  - artists
  - albums
  - playlists
  - users
- Playlist management:
  - create playlists
  - add songs to playlists
  - remove songs from owned playlists
  - save/follow public playlists
- Song engagement:
  - like / unlike songs
  - automatic `Liked Songs` playlist creation on first like
  - play-event tracking
- PostgreSQL-backed session store
- Layered backend architecture:
  - `routes -> controllers -> services -> repositories`

## Tech Stack

### Frontend

- React 18
- React Router
- Vite
- Plain CSS

### Backend

- Express
- `pg`
- `express-session`
- `connect-pg-simple`
- `bcrypt`

### Database

- PostgreSQL
- `pg_trgm`
- `unaccent`

## Project Structure

```text
music-streaming-app
├── backend
│   ├── db
│   │   └── migrations
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middlewares
│   │   ├── repositories
│   │   ├── routes
│   │   ├── services
│   │   └── utils
│   └── package.json
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── components
│   │   ├── context
│   │   ├── hooks
│   │   ├── pages
│   │   ├── styles
│   │   └── utils
│   └── package.json
├── package.json
└── package-lock.json
```

## Backend Architecture

The backend follows a strict layered structure:

- `routes`
  - define HTTP endpoints
- `controllers`
  - parse request input and shape responses
- `services`
  - implement business rules and transactions
- `repositories`
  - contain all SQL queries and DB-specific logic

This keeps the API maintainable, testable, and predictable as the app grows.

## Frontend Architecture

The frontend is a route-driven SPA using:

- `AuthProvider`
  - handles session hydration and auth state
- `AppDataProvider`
  - handles shared playlist state
- page-level data fetching through API modules in `frontend/src/api`
- reusable layout and UI components for:
  - header
  - search suggestions
  - detail hero cards
  - song lists
  - pagination
  - empty/error/success notices

## Routes

### Frontend routes

- `/login`
- `/signup`
- `/`
- `/search`
- `/songs/:trackId`
- `/artists/:artistId`
- `/albums/:albumName`
- `/playlists/:playlistId`
- `/users/:userId`
- `/profile`

### Backend API routes

- `/api/auth`
- `/api/home`
- `/api/search`
- `/api/songs`
- `/api/artists`
- `/api/albums`
- `/api/playlists`
- `/api/users`

## API Response Shape

Successful responses follow this structure:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

- `data` is always present
- `meta` is included for paginated responses

Error responses follow this structure:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": null
  }
}
```

## Database Schema Overview

The application uses a track-first catalog schema.

### Core tables

- `users`
- `user_phone_numbers`
- `songs`
- `artists`
- `song_artists`
- `genres`
- `song_genres`
- `playlists`
- `playlist_songs`
- `playlist_follows`
- `playlist_collaborators`
- `user_liked_songs`
- `song_ratings`
- `user_song_events`
- `user_follows`

### Important design notes

- songs are keyed by `track_id`
- artist relationships are normalized through `song_artists`
- genres are normalized through `song_genres`
- playlist stats are cached on the playlist row:
  - `cached_song_count`
  - `cached_duration_ms`
  - `followers_count`
- likes are stored in `user_liked_songs`
- behavioral analytics are stored in `user_song_events`

## Session Authentication

Authentication uses cookie-based server sessions.

### Session details

- cookie name: `topsify.sid`
- session store: PostgreSQL
- cookie settings:
  - `httpOnly`
  - `sameSite=lax`
  - secure in production

All app routes and API endpoints outside auth are protected by session middleware.

## Local Development

## 1. Install dependencies

From the project root:

```bash
npm install
```

## 2. Configure environment variables

Create these files if they do not already exist:

### `backend/.env`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/music_new
SESSION_SECRET=replace-me
FRONTEND_ORIGIN=http://localhost:5173
SESSION_TABLE_NAME=user_sessions
PORT=3000
NODE_ENV=development
```

### `frontend/.env`

```env
VITE_API_URL=http://localhost:3000
```

## 3. Set up PostgreSQL

You can either:

- create the schema only, or
- create the schema and import a catalog from a staging database

### Option A: create the schema only

Create the target database and apply the schema:

```bash
createdb music_new
npm run db:schema
```

### Option B: create the schema and import from a staging backup

1. Create a staging DB and a target DB:

```bash
createdb music_old_staging
createdb music_new
```

2. Restore your source dump into `music_old_staging`.

3. Point `DATABASE_URL` to `music_new`.

4. Apply the schema:

```bash
npm run db:schema
```

5. Run the import pipeline:

```bash
npm run db:legacy
```

This import flow uses the scripts in `backend/db/migrations`.

## 4. Start the app

Run both frontend and backend:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:backend
npm run dev:frontend
```

## Scripts

### Root

- `npm run dev`
- `npm run dev:backend`
- `npm run dev:frontend`
- `npm run build`
- `npm run start`
- `npm run db:schema`
- `npm run db:legacy`

### Backend

- `npm run dev --workspace backend`
- `npm run start --workspace backend`

### Frontend

- `npm run dev --workspace frontend`
- `npm run build --workspace frontend`
- `npm run preview --workspace frontend`

## Search and Catalog Behavior

### Suggestions

The search bar fetches live suggestions from:

- `GET /api/search/suggest`

Suggestions can navigate directly to:

- song pages
- artist pages
- album pages
- playlist pages
- user pages

### Full search

The full catalog search endpoint supports:

- `type=all`
- `type=songs`
- `type=artists`
- `type=albums`
- `type=playlists`
- `type=users`

Filtered results are paginated and rendered with page-specific states.

## Playlist Behavior

Topsify supports two main playlist interactions:

### User-created playlists

Users can:

- create them
- add tracks
- remove tracks if they own them
- make them public or private

### Saved playlists

Users can:

- follow/save playlists
- remove playlists from saved collection

### Liked Songs

When a user likes a song:

- the song is inserted into `user_liked_songs`
- a private playlist named `Liked Songs` is created automatically if it does not already exist
- the liked track is added to that playlist

When a user unlikes a song:

- the like is removed
- the track is removed from `Liked Songs`

## Current UI Behavior

The current UI includes:

- sticky header with:
  - back button
  - forward button
  - home button
  - centered search
  - create playlist button
  - logout button
  - profile button
- entity hero cards with gradients
- responsive card grids for:
  - playlists
  - artists
  - albums
  - users
- shared song table/list layout with:
  - artwork
  - song links
  - artist links
  - album links
  - duration
  - like button
  - add-to-playlist action
  - Spotify link

## What to Commit

For a clean repository, commit:

- `backend/`
- `frontend/`
- `package.json`
- `package-lock.json`
- `.gitignore`
- `README.md`

Do not commit:

- `.env`
- `backend/.env`
- `frontend/.env`
- `node_modules/`
- `frontend/dist/`

## Future Enhancements

The current implementation is ready for future work such as:

- recommendation ranking from `user_song_events`
- richer social features
- improved search ranking
- caching
- external search/indexing integration

## License

Add a license here if you plan to open-source the project.
