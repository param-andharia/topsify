import { useEffect, useState } from "react";
import { playlistApi } from "../../api/playlistApi";
import { StateNotice } from "../ui/StateNotice";

export const PlaylistPickerModal = ({ isOpen, onClose, track, playlists = [] }) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setSelectedIds([]);
      setIsSubmitting(false);
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const togglePlaylist = (playlistId) => {
    setSelectedIds((current) =>
      current.includes(playlistId)
        ? current.filter((id) => id !== playlistId)
        : [...current, playlistId]
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!selectedIds.length) {
      setErrorMessage("Choose at least one playlist first.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    const results = await Promise.allSettled(
      selectedIds.map((playlistId) => playlistApi.addTrackToPlaylist(playlistId, track.trackId))
    );

    const successCount = results.filter((result) => result.status === "fulfilled").length;
    const failedResult = results.find((result) => result.status === "rejected");

    if (!successCount && failedResult?.reason) {
      setErrorMessage(failedResult.reason.message);
      setIsSubmitting(false);
      return;
    }

    if (failedResult?.reason) {
      setErrorMessage(failedResult.reason.message);
    }

    setSuccessMessage(
      successCount === 1
        ? `Added "${track.trackName}" to 1 playlist.`
        : `Added "${track.trackName}" to ${successCount} playlists.`
    );

    setIsSubmitting(false);
  };

  return (
    <div className="modal modal-open" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <button className="close close-button" onClick={onClose} type="button">
          &times;
        </button>
        <form onSubmit={handleSubmit} className="modal-form">
          <label>Add "{track.trackName}" to playlist</label>

          {!playlists.length ? (
            <StateNotice
              title="No playlists yet"
              message="Create a playlist first, then come back to add songs."
              variant="empty"
            />
          ) : (
            <div className="checkbox-container">
              {playlists.map((playlist) => (
                <label className="checkbox-row" key={playlist.playlistId} htmlFor={`playlist-${playlist.playlistId}`}>
                  <input
                    id={`playlist-${playlist.playlistId}`}
                    type="checkbox"
                    checked={selectedIds.includes(playlist.playlistId)}
                    onChange={() => togglePlaylist(playlist.playlistId)}
                  />
                  <span>{playlist.playlistName}</span>
                </label>
              ))}
            </div>
          )}

          {errorMessage ? <StateNotice title="Couldn’t add song" message={errorMessage} variant="error" /> : null}
          {successMessage ? <StateNotice title="Song added" message={successMessage} variant="success" /> : null}

          <button type="submit" disabled={isSubmitting || !playlists.length}>
            {isSubmitting ? "Adding..." : "Add to Selected Playlists"}
          </button>
        </form>
      </div>
    </div>
  );
};
