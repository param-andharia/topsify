import { useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CreatePlaylistModal } from "../playlists/CreatePlaylistModal";
import { StateNotice } from "../ui/StateNotice";
import { useAppData } from "../../context/AppDataContext";

export const AppShell = ({ children }) => {
  const { createPlaylist } = useAppData();
  const [createOpen, setCreateOpen] = useState(false);
  const [banner, setBanner] = useState(null);

  const handleCreate = async (payload) => {
    const playlist = await createPlaylist(payload);
    setBanner({
      title: "Playlist created",
      message: `"${playlist.playlistName}" is ready to use.`,
    });
    return playlist;
  };

  return (
    <div className="app-shell">
      <div className="container">
        <Header onCreatePlaylistRequest={() => setCreateOpen(true)} />
        {banner ? (
          <StateNotice
            title={banner.title}
            message={banner.message}
            variant="success"
            action={
              <button className="dismiss-button" type="button" onClick={() => setBanner(null)}>
                Dismiss
              </button>
            }
          />
        ) : null}
        <main className="page-content">{children}</main>
        <Footer />
      </div>
      <CreatePlaylistModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={handleCreate} />
    </div>
  );
};
