import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { homeApi } from "../api/homeApi";
import { AlbumCard, ArtistCard, PlaylistCard } from "../components/playlists/PlaylistCard";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { useAppData } from "../context/AppDataContext";
import { buildAlbumPath, buildArtistPath, buildPlaylistPath, buildSearchPath, buildSongPath } from "../utils/navigation";
import { pluralize } from "../utils/format";

export const HomePage = () => {
  const navigate = useNavigate();
  const { myPlaylists } = useAppData();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    homeApi
      .getHome()
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
  }, []);

  if (isLoading) {
    return <PageSpinner label="Loading your music universe..." />;
  }

  if (errorMessage) {
    return <StateNotice title="Home couldn’t load" message={errorMessage} variant="error" />;
  }

  return (
    <>
      <section className="artists">
        {!myPlaylists.length ? (
          <StateNotice title="You don't have any playlists yet" message="Create one from the top-right button to get started." variant="empty" />
        ) : (
          <>
            <h2>Your Playlists</h2>
            <div className="grid">
              {myPlaylists.map((playlist) => (
                <PlaylistCard
                  key={playlist.playlistId}
                  to={buildPlaylistPath(playlist.playlistId)}
                  imageUrl={playlist.playlistImageUrl}
                  title={playlist.playlistName}
                  stats={pluralize(playlist.cachedSongCount, "song")}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="playlists">
        <h2>Featured Artists</h2>
        <div className="grid">
          {data.featuredArtists.map((artist) => (
            <ArtistCard
              key={artist.artistId}
              name={artist.artistName}
              imageUrl={artist.artistImageUrl}
              trackCount={artist.trackCount}
              to={buildArtistPath(artist.artistId)}
            />
          ))}
        </div>
      </section>

      <section className="albums">
        <h2>Popular Albums</h2>
        <div className="grid">
          {data.featuredAlbums.map((album) => (
            <AlbumCard
              key={album.albumName}
              name={album.albumName}
              imageUrl={album.imageUrl}
              trackCount={album.trackCount}
              to={buildAlbumPath(album.albumName)}
            />
          ))}
        </div>
      </section>

      <section className="albums">
        <h2>Community Playlists</h2>
        {!data.popularPlaylists.length ? (
          <StateNotice title="No public playlists yet" message="Create a public playlist to make this section come alive." variant="empty" />
        ) : (
          <div className="grid">
            {data.popularPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.playlistId}
                to={buildPlaylistPath(playlist.playlistId)}
                imageUrl={playlist.playlistImageUrl}
                title={playlist.playlistName}
                subtitle={playlist.creatorUsername ? `By ${playlist.creatorUsername}` : undefined}
                stats={`${pluralize(playlist.followersCount, "follower")} • ${pluralize(playlist.cachedSongCount, "song")}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="albums">
        <div className="section-header">
          <h2>Popular Songs</h2>
          <button className="secondary-button" type="button" onClick={() => navigate(buildSearchPath({ q: "love", type: "songs" }))}>
            Explore Search
          </button>
        </div>
        <div className="compact-list">
          {data.popularSongs.map((song) => (
            <button
              className="compact-list-item"
              key={song.trackId}
              type="button"
              onClick={() => navigate(buildSongPath(song.trackId))}
            >
              <strong>{song.trackName}</strong>
              <span>{song.artists.join(", ")}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
};
