export const buildSearchPath = ({ q, type = "all", page } = {}) => {
  const params = new URLSearchParams();

  if (q?.trim()) {
    params.set("q", q.trim());
  }

  if (type && type !== "all") {
    params.set("type", type);
  } else if (type) {
    params.set("type", "all");
  }

  if (page && Number(page) > 1) {
    params.set("page", String(page));
  }

  const queryString = params.toString();
  return queryString ? `/search?${queryString}` : "/search";
};

export const buildArtistPath = (artistId) => `/artists/${artistId}`;
export const buildAlbumPath = (albumName) => `/albums/${encodeURIComponent(albumName)}`;
export const buildPlaylistPath = (playlistId) => `/playlists/${playlistId}`;
export const buildSongPath = (trackId) => `/songs/${encodeURIComponent(trackId)}`;
export const buildUserPath = (userId) => `/users/${userId}`;
