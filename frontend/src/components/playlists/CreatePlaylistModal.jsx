import { useEffect, useState } from "react";
import { StateNotice } from "../ui/StateNotice";

const initialFormState = {
  playlistName: "",
  description: "",
  isPublic: true,
};

export const CreatePlaylistModal = ({ isOpen, onClose, onCreate }) => {
  const [form, setForm] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setForm(initialFormState);
      setIsSubmitting(false);
      setErrorMessage("");
      setSuccessMessage("");
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const playlist = await onCreate(form);
      setSuccessMessage(`Created "${playlist.playlistName}" successfully.`);

      window.setTimeout(() => {
        onClose();
      }, 500);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal modal-open" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <button className="close close-button" onClick={onClose} type="button">
          &times;
        </button>
        <form onSubmit={handleSubmit} className="modal-form">
          <label htmlFor="playlistName">Playlist Name</label>
          <input
            id="playlistName"
            name="playlistName"
            value={form.playlistName}
            onChange={(event) => setForm((current) => ({ ...current, playlistName: event.target.value }))}
            placeholder="My late night mix"
            required
          />

          <label htmlFor="playlistDescription">Description</label>
          <textarea
            id="playlistDescription"
            name="playlistDescription"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Optional description"
            rows={4}
          />

          <label className="checkbox-row" htmlFor="playlistVisibility">
            <input
              id="playlistVisibility"
              type="checkbox"
              checked={form.isPublic}
              onChange={(event) => setForm((current) => ({ ...current, isPublic: event.target.checked }))}
            />
            Make playlist public
          </label>

          {errorMessage ? <StateNotice title="Couldn’t create playlist" message={errorMessage} variant="error" /> : null}
          {successMessage ? <StateNotice title="Playlist ready" message={successMessage} variant="success" /> : null}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create Playlist"}
          </button>
        </form>
      </div>
    </div>
  );
};
