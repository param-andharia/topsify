import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { songApi } from "../../api/songApi";
import { useAppData } from "../../context/AppDataContext";
import { fallbackImage, formatDuration } from "../../utils/format";
import { buildAlbumPath, buildArtistPath, buildSongPath } from "../../utils/navigation";
import { PlaylistPickerModal } from "../playlists/PlaylistPickerModal";

export const SongRow = ({
  index,
  track,
  allowRemove = false,
  onRemove,
  showAlbumLinks = true,
  showArtistLinks = true,
  showTrackLinks = true,
  currentArtistId = null,
  sourceContext = "song_list",
  searchQuery = "",
}) => {
  const { myPlaylists, refreshMyPlaylists } = useAppData();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isLiked, setIsLiked] = useState(Boolean(track.isLiked));
  const [isLiking, setIsLiking] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setIsLiked(Boolean(track.isLiked));
  }, [track.isLiked, track.trackId]);

  const artistItems = track.artistItems?.length
    ? track.artistItems
    : (track.artists ?? []).map((artistName) => ({ artistName }));

  const handleRemove = async () => {
    setIsRemoving(true);
    setErrorMessage("");

    try {
      await onRemove(track.trackId);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleLikeToggle = async () => {
    setIsLiking(true);
    setErrorMessage("");

    try {
      if (isLiked) {
        await songApi.unlikeSong(track.trackId);
        setIsLiked(false);
        await refreshMyPlaylists().catch(() => {});
      } else {
        await songApi.likeSong(track.trackId, {
          source: sourceContext,
          searchQuery,
          metadata: {
            albumName: track.albumName,
          },
        });
        setIsLiked(true);
        await refreshMyPlaylists().catch(() => {});
      }
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSpotifyClick = () => {
    songApi
      .recordPlay(track.trackId, {
        source: sourceContext,
        searchQuery,
        metadata: {
          albumName: track.albumName,
        },
      })
      .catch(() => {});
  };

  const trackTitle = showTrackLinks ? (
    <Link className="song-inline-link song-primary-link" to={buildSongPath(track.trackId)}>
      {track.trackName}
    </Link>
  ) : (
    track.trackName
  );

  return (
    <>
      <article className="song-row">
        <div className="song-row-cell song-row-index">
          <span className="song-row-label">No.</span>
          <p>{index}</p>
        </div>
        <div className="song-row-cell song-row-cover">
          <img src={track.imageUrl || fallbackImage} alt={track.trackName} />
        </div>
        <div className="song-row-cell song-row-details">
          <p id="song-name" className="song-column song-title">
            {trackTitle}
          </p>
          <p className="song-column artist-container">
            By:{" "}
            {artistItems.length ? (
              artistItems.map((artist, index_) => {
                const shouldLink =
                  showArtistLinks &&
                  artist.artistId &&
                  Number(artist.artistId) !== Number(currentArtistId);

                return (
                  <span key={`${artist.artistId ?? artist.artistName}-${index_}`}>
                    {shouldLink ? (
                      <Link className="song-inline-link" to={buildArtistPath(artist.artistId)}>
                        {artist.artistName}
                      </Link>
                    ) : (
                      <span>{artist.artistName}</span>
                    )}
                    {index_ < artistItems.length - 1 ? ", " : ""}
                  </span>
                );
              })
            ) : (
              <span>Unknown artist</span>
            )}
          </p>
          {errorMessage ? <small className="inline-error">{errorMessage}</small> : null}
        </div>
        <div className="song-row-cell song-row-album">
          <span className="song-row-label">Album</span>
          <p className="song-column">
            {showAlbumLinks && track.albumName ? (
              <Link className="song-inline-link" to={buildAlbumPath(track.albumName)}>
                {track.albumName}
              </Link>
            ) : (
              track.albumName || "Single"
            )}
          </p>
        </div>
        <div className="song-row-cell song-row-duration">
          <span className="song-row-label">Duration</span>
          <p>{formatDuration(track.durationMs)}</p>
        </div>
        <div className="song-row-cell row-actions">
          <button
            className={`song-action-button ${isLiked ? "song-action-button-active" : ""}`}
            type="button"
            onClick={handleLikeToggle}
            disabled={isLiking}
          >
            {isLiking ? "..." : isLiked ? "Liked" : "Like"}
          </button>
          <button
            className="add-button"
            type="button"
            onClick={() => setIsPickerOpen(true)}
            disabled={!myPlaylists.length}
            title={myPlaylists.length ? "Add to playlist" : "Create a playlist first"}
          >
            <img
              src="https://cdn-icons-png.flaticon.com/128/992/992651.png"
              className="add-button-icon"
              alt="Add to playlist"
            />
          </button>
          <a
            href={`https://open.spotify.com/track/${track.trackId}`}
            className="spotify-link"
            target="_blank"
            rel="noreferrer"
            onClick={handleSpotifyClick}
          >
            <img
              src="https://developer.spotify.com/images/guidelines/design/icon3.svg"
              alt="Open in Spotify"
              className="spotify-icon"
            />
          </a>
          {allowRemove ? (
            <button className="del-button" type="button" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving ? "..." : <img src="https://cdn-icons-png.flaticon.com/128/18425/18425741.png" alt="Remove" />}
            </button>
          ) : null}
        </div>
      </article>
      <PlaylistPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        track={track}
        playlists={myPlaylists}
      />
    </>
  );
};
