import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { playlistApi } from "../api/playlistApi";
import { userApi } from "../api/userApi";
import { useAuth } from "./AuthContext";

const AppDataContext = createContext(null);

export const AppDataProvider = ({ children }) => {
  const { user } = useAuth();
  const [myPlaylists, setMyPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState("");

  const refreshMyPlaylists = async () => {
    if (!user) {
      setMyPlaylists([]);
      setPlaylistsError("");
      return [];
    }

    setPlaylistsLoading(true);
    setPlaylistsError("");

    try {
      const response = await userApi.getMyPlaylists();
      setMyPlaylists(response.data.playlists);
      return response.data.playlists;
    } catch (error) {
      setPlaylistsError(error.message);
      throw error;
    } finally {
      setPlaylistsLoading(false);
    }
  };

  useEffect(() => {
    refreshMyPlaylists().catch(() => {});
  }, [user?.userId]);

  const createPlaylist = async (payload) => {
    const response = await playlistApi.createPlaylist(payload);
    await refreshMyPlaylists();
    return response.data.playlist;
  };

  const value = useMemo(
    () => ({
      myPlaylists,
      playlistsLoading,
      playlistsError,
      refreshMyPlaylists,
      createPlaylist,
    }),
    [myPlaylists, playlistsLoading, playlistsError]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export const useAppData = () => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error("useAppData must be used within AppDataProvider");
  }

  return context;
};
