import { useCallback, useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { playlistApi } from "../api/playlistApi";
import { SongList } from "../components/songs/SongList";
import { DetailHero } from "../components/ui/DetailHero";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { buildAlbumPath } from "../utils/navigation";
import { formatDuration, pluralize } from "../utils/format";

export const PlaylistPage = () => {
  const { playlistId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadPlaylist = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await playlistApi.getPlaylist(playlistId, { page: 1, limit: 50 });
      setData(response.data);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [playlistId]);

  useEffect(() => {
    loadPlaylist();
  }, [loadPlaylist]);

  const handleFollowToggle = async () => {
    if (!data?.playlist) {
      return;
    }

    try {
      if (data.playlist.isFollowing) {
        await playlistApi.unfollowPlaylist(playlistId);
        setActionMessage("Playlist removed from your saved collection.");
      } else {
        await playlistApi.followPlaylist(playlistId);
        setActionMessage("Playlist saved successfully.");
      }

      await loadPlaylist();
    } catch (error) {
      setActionMessage(error.message);
    }
  };

  const handleRemoveTrack = async (trackId) => {
    await playlistApi.removeTrackFromPlaylist(playlistId, trackId);
    setActionMessage("Song removed from playlist.");
    await loadPlaylist();
  };

  if (isLoading) {
    return <PageSpinner label="Loading playlist..." />;
  }

  if (errorMessage) {
    return <StateNotice title="Playlist unavailable" message={errorMessage} variant="error" />;
  }

  if (!data?.playlist) {
    return <StateNotice title="Playlist missing" message="This playlist could not be found." variant="empty" />;
  }

  const { playlist, songs } = data;

  if (playlist.creatorId === null || playlist.creatorId === -1) {
    return <Navigate to={buildAlbumPath(playlist.playlistName)} replace />;
  }

  return (
    <>
      <DetailHero
        imageUrl={playlist.playlistImageUrl}
        eyebrow={playlist.creatorUsername ? `Playlist by ${playlist.creatorUsername}` : "Playlist"}
        title={playlist.playlistName}
        meta={[
          `Total songs: ${playlist.cachedSongCount}`,
          pluralize(playlist.followersCount, "follower"),
          `Duration: ${formatDuration(playlist.cachedDurationMs)}`,
        ]}
        actions={
          !playlist.isOwner ? (
            <button className="search-button button-text" type="button" onClick={handleFollowToggle}>
              {playlist.isFollowing ? "Remove from Saved" : "Save Playlist"}
            </button>
          ) : null
        }
      />

      {actionMessage ? <StateNotice title="Playlist updated" message={actionMessage} variant="success" /> : null}

      <SongList
        tracks={songs}
        allowRemove={playlist.isOwner}
        onRemove={handleRemoveTrack}
        showAlbumLinks={false}
        sourceContext="playlist"
        emptyTitle={playlist.isOwner ? "Your playlist is empty" : "This playlist is empty"}
        emptyMessage={playlist.isOwner ? "Add some songs from search to bring it to life." : "Come back later for tracks."}
      />
    </>
  );
};
