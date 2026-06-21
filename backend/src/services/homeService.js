import { query } from "../config/db.js";
import { getFeaturedAlbums, getFeaturedArtists, getPopularPlaylists, getPopularSongs } from "../repositories/homeRepository.js";
import { getOwnedPlaylists } from "../repositories/userRepository.js";

export const getHomeData = async (userId) => {
  const executor = { query };

  const [userPlaylists, popularPlaylists, featuredArtists, featuredAlbums, popularSongs] = await Promise.all([
    getOwnedPlaylists(executor, userId),
    getPopularPlaylists(executor, 6),
    getFeaturedArtists(executor, 6),
    getFeaturedAlbums(executor, 6),
    getPopularSongs(executor, 8, userId),
  ]);

  return {
    userPlaylists,
    popularPlaylists,
    featuredArtists,
    featuredAlbums,
    popularSongs,
  };
};
