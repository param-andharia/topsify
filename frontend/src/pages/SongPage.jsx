import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { songApi } from "../api/songApi";
import { DetailHero } from "../components/ui/DetailHero";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { useAppData } from "../context/AppDataContext";
import { formatDuration, pluralize, summarizeNames } from "../utils/format";

export const SongPage = () => {
  const { trackId } = useParams();
  const { refreshMyPlaylists } = useAppData();
  const [song, setSong] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);

  const artistNames = useMemo(
    () => (song?.artistItems?.length ? song.artistItems.map((artist) => artist.artistName) : song?.artists ?? []),
    [song]
  );

  const loadSong = useCallback(async () => {
    if (!trackId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");
    setActionMessage("");

    try {
      const response = await songApi.getSong(trackId);
      setSong(response.data.song);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [trackId]);

  useEffect(() => {
    loadSong();
  }, [loadSong]);

  const handleLikeToggle = async () => {
    if (!song) {
      return;
    }

    setIsUpdatingLike(true);
    setActionMessage("");

    try {
      if (song.isLiked) {
        await songApi.unlikeSong(song.trackId);
        setSong((currentSong) =>
          currentSong
            ? {
                ...currentSong,
                isLiked: false,
                likesCount: Math.max((currentSong.likesCount ?? 0) - 1, 0),
              }
            : currentSong
        );
        await refreshMyPlaylists().catch(() => {});
        setActionMessage("Song removed from your likes.");
      } else {
        await songApi.likeSong(song.trackId, {
          source: "song_detail",
          metadata: {
            albumName: song.albumName,
          },
        });
        setSong((currentSong) =>
          currentSong
            ? {
                ...currentSong,
                isLiked: true,
                likesCount: (currentSong.likesCount ?? 0) + 1,
              }
            : currentSong
        );
        await refreshMyPlaylists().catch(() => {});
        setActionMessage("Song liked successfully.");
      }
    } catch (error) {
      setActionMessage(error.message);
    } finally {
      setIsUpdatingLike(false);
    }
  };

  const handleSpotifyClick = () => {
    if (!song) {
      return;
    }

    setSong((currentSong) =>
      currentSong
        ? {
            ...currentSong,
            playsCount: (currentSong.playsCount ?? 0) + 1,
          }
        : currentSong
    );

    songApi
      .recordPlay(song.trackId, {
        source: "song_detail",
        metadata: {
          albumName: song.albumName,
        },
      })
      .catch(() => {});
  };

  if (isLoading) {
    return <PageSpinner label="Loading song..." />;
  }

  if (errorMessage) {
    return <StateNotice title="Song unavailable" message={errorMessage} variant="error" />;
  }

  if (!song) {
    return <StateNotice title="Song missing" message="This song could not be found." variant="empty" />;
  }

  return (
    <>
      <DetailHero
        imageUrl={song.imageUrl}
        eyebrow={song.albumName ? `Song • ${song.albumName}` : "Song"}
        title={song.trackName}
        meta={[
          `Artists: ${summarizeNames(artistNames) || "Unknown artist"}`,
          pluralize(song.playsCount ?? 0, "play"),
          pluralize(song.likesCount ?? 0, "like"),
          song.userPlaylistCount === 1
            ? "1 user playlist includes this track"
            : `${song.userPlaylistCount ?? 0} user playlists include this track`,
          `Duration: ${formatDuration(song.durationMs)}`,
        ]}
        actions={
          <div className="detail-action-group">
            <button className="search-button button-text" type="button" onClick={handleLikeToggle} disabled={isUpdatingLike}>
              {isUpdatingLike ? "Updating..." : song.isLiked ? "Unlike Song" : "Like Song"}
            </button>
            <a
              className="secondary-button"
              href={`https://open.spotify.com/track/${song.trackId}`}
              target="_blank"
              rel="noreferrer"
              onClick={handleSpotifyClick}
            >
              Open in Spotify
            </a>
          </div>
        }
      />

      {actionMessage ? <StateNotice title="Song updated" message={actionMessage} variant="success" /> : null}
    </>
  );
};
