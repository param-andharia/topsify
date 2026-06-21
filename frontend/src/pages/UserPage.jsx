import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { userApi } from "../api/userApi";
import { PlaylistCard } from "../components/playlists/PlaylistCard";
import { DetailHero } from "../components/ui/DetailHero";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { buildPlaylistPath } from "../utils/navigation";
import { pluralize } from "../utils/format";

export const UserPage = () => {
  const { userId } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!userId) {
      return undefined;
    }

    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    userApi
      .getUser(userId)
      .then((response) => {
        if (active) {
          setData(response.data);
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
  }, [userId]);

  if (isLoading) {
    return <PageSpinner label="Loading user..." />;
  }

  if (errorMessage) {
    return <StateNotice title="User unavailable" message={errorMessage} variant="error" />;
  }

  if (!data?.user) {
    return <StateNotice title="User missing" message="This user could not be found." variant="empty" />;
  }

  const { user, playlists } = data;

  return (
    <>
      <DetailHero
        imageUrl={user.profileImageUrl}
        eyebrow={user.isSelf ? "Your profile" : "User"}
        title={user.username}
        meta={[
          user.email || null,
          pluralize(playlists.length, user.isSelf ? "playlist" : "public playlist"),
        ].filter(Boolean)}
      />

      <section className="results-section">
        <h2>{user.isSelf ? "Your Playlists" : `${user.username}'s Public Playlists`}</h2>
        {!playlists.length ? (
          <StateNotice
            title={user.isSelf ? "You don't have any playlists" : "No public playlists yet"}
            message={user.isSelf ? "Create one from the header action to get started." : "This user has not shared any playlists yet."}
            variant="empty"
          />
        ) : (
          <div className="grid">
            {playlists.map((playlist) => (
              <PlaylistCard
                key={playlist.playlistId}
                to={buildPlaylistPath(playlist.playlistId)}
                imageUrl={playlist.playlistImageUrl}
                title={playlist.playlistName}
                stats={`${pluralize(playlist.cachedSongCount, "song")} • ${pluralize(playlist.followersCount, "follower")}`}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
};
