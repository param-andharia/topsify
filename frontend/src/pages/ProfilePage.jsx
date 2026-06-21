import { useEffect, useState } from "react";
import { userApi } from "../api/userApi";
import { PlaylistCard } from "../components/playlists/PlaylistCard";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { pluralize } from "../utils/format";

export const ProfilePage = () => {
  const { user } = useAuth();
  const { myPlaylists, playlistsLoading, playlistsError } = useAppData();
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    userApi
      .getSavedPlaylists()
      .then((response) => {
        if (active) {
          setSavedPlaylists(response.data.playlists);
        }
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(error.message);
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (playlistsLoading || isLoading) {
    return <PageSpinner label="Loading your profile..." />;
  }

  if (playlistsError || errorMessage) {
    return <StateNotice title="Profile couldn’t load" message={playlistsError || errorMessage} variant="error" />;
  }

  return (
    <>
      <section className="profile-summary">
        <div className="artist-info profile-card">
          <img src={user?.profileImageUrl || "https://img.freepik.com/free-vector/futuristic-gradient-profile-picture_742173-9236.jpg?w=740"} alt={user?.username} />
          <p className="album-title">{user?.username}</p>
          <p className="followers">{user?.email}</p>
          <p className="followers">{pluralize(myPlaylists.length, "owned playlist")}</p>
          <p className="followers">{pluralize(savedPlaylists.length, "saved playlist")}</p>
        </div>
      </section>

      <section className="artists">
        {!myPlaylists.length ? (
          <StateNotice title="You don't have any playlists" message="Create one from the header action to get started." variant="empty" />
        ) : (
          <>
            <h2>Your Playlists</h2>
            <div className="grid">
              {myPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.playlistId}
                  to={`/playlists/${playlist.playlistId}`}
                  imageUrl={playlist.playlistImageUrl}
                  title={playlist.playlistName}
                  stats={`${pluralize(playlist.cachedSongCount, "song")} • ${pluralize(playlist.followersCount, "follower")}`}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="artists">
        {!savedPlaylists.length ? (
          <StateNotice title="You don't have any saved playlists" message="Save public playlists to keep them here." variant="empty" />
        ) : (
          <>
            <h2>Your Saved Playlists</h2>
            <div className="grid">
              {savedPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.playlistId}
                  to={`/playlists/${playlist.playlistId}`}
                  imageUrl={playlist.playlistImageUrl}
                  title={playlist.playlistName}
                  subtitle={playlist.creatorUsername ? `By ${playlist.creatorUsername}` : undefined}
                  stats={`${pluralize(playlist.cachedSongCount, "song")} • ${pluralize(playlist.followersCount, "follower")}`}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
};
