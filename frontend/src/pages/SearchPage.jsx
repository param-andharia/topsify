import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { searchApi } from "../api/searchApi";
import { AlbumCard, ArtistCard, PlaylistCard } from "../components/playlists/PlaylistCard";
import { SongList } from "../components/songs/SongList";
import { PaginationControls } from "../components/ui/PaginationControls";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { buildAlbumPath, buildArtistPath, buildPlaylistPath, buildSearchPath, buildUserPath } from "../utils/navigation";
import { pluralize } from "../utils/format";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "songs", label: "Filter by Song" },
  { value: "artists", label: "Filter by Artist" },
  { value: "albums", label: "Filter by Album" },
  { value: "playlists", label: "Filter by Playlist" },
  { value: "users", label: "Filter by User" },
];

const PAGE_LIMITS = {
  all: 8,
  songs: 20,
  artists: 12,
  albums: 12,
  playlists: 12,
  users: 12,
};

const getSectionItems = (results, key) => results?.[key] ?? [];

export const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "all";
  const page = Math.max(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
  const [payload, setPayload] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!query.trim()) {
      setPayload(null);
      setIsLoading(false);
      setErrorMessage("");
      return;
    }

    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    searchApi
      .search({
        q: query.trim(),
        type,
        page,
        limit: PAGE_LIMITS[type] ?? PAGE_LIMITS.all,
      })
      .then((response) => {
        if (active) {
          setPayload(response);
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
  }, [page, query, type]);

  const results = payload?.data?.results ?? {};
  const meta = payload?.meta;

  const totalMatches = useMemo(() => {
    if (!payload?.data?.results) {
      return 0;
    }

    if (type !== "all") {
      return meta?.total ?? 0;
    }

    return Object.values(payload.data.results).reduce((total, items) => total + items.length, 0);
  }, [meta?.total, payload, type]);

  const goToSearch = (nextType, nextPage = 1) => {
    navigate(buildSearchPath({ q: query, type: nextType, page: nextPage }));
  };

  if (!query.trim()) {
    return (
      <StateNotice
        title="Search your library"
        message="Use the header search bar to find songs, artists, albums, playlists, and users."
        variant="empty"
      />
    );
  }

  const songs = getSectionItems(results, "songs");
  const artists = getSectionItems(results, "artists");
  const albums = getSectionItems(results, "albums");
  const playlists = getSectionItems(results, "playlists");
  const users = getSectionItems(results, "users");

  const shouldShowSongs = type === "songs" || (type === "all" && songs.length > 0);
  const shouldShowArtists = type === "artists" || (type === "all" && artists.length > 0);
  const shouldShowAlbums = type === "albums" || (type === "all" && albums.length > 0);
  const shouldShowPlaylists = type === "playlists" || (type === "all" && playlists.length > 0);
  const shouldShowUsers = type === "users" || (type === "all" && users.length > 0);

  return (
    <>
      <div className="title">
        {isLoading
          ? `Searching for "${query}"...`
          : totalMatches === 0
            ? "No items match your search."
            : `${totalMatches} results matched your search.`}
      </div>

      <div className="search">
        {FILTERS.map((filter) => (
          <div className="search-item" key={filter.value}>
            <button
              className={`search-button ${type === filter.value ? "search-button-active" : ""}`}
              type="button"
              onClick={() => goToSearch(filter.value)}
            >
              {filter.label}
            </button>
          </div>
        ))}
      </div>

      {isLoading ? <PageSpinner label="Searching the catalog..." /> : null}
      {errorMessage ? <StateNotice title="Search failed" message={errorMessage} variant="error" /> : null}

      {!isLoading && !errorMessage && payload ? (
        <>
          {shouldShowSongs ? (
            <section className="results-section">
              <div className="section-header">
                <h2>Songs</h2>
              </div>
              <SongList
                tracks={songs}
                sourceContext="search"
                searchQuery={query}
                emptyTitle="No songs found"
                emptyMessage="Try a broader keyword or switch to another filter."
              />
            </section>
          ) : null}

          {shouldShowArtists ? (
            <section className="results-section">
              <div className="section-header">
                <h2>Artists</h2>
                {type === "all" ? (
                  <button className="secondary-button" type="button" onClick={() => goToSearch("artists")}>
                    View all
                  </button>
                ) : null}
              </div>
              {artists.length ? (
                <div className="grid">
                  {artists.map((artist) => (
                    <ArtistCard
                      key={artist.artistId}
                      name={artist.artistName}
                      imageUrl={artist.artistImageUrl}
                      trackCount={artist.trackCount}
                      to={buildArtistPath(artist.artistId)}
                    />
                  ))}
                </div>
              ) : (
                <StateNotice title="No artists found" message="Try a different spelling or broader term." variant="empty" />
              )}
            </section>
          ) : null}

          {shouldShowAlbums ? (
            <section className="results-section">
              <div className="section-header">
                <h2>Albums</h2>
                {type === "all" ? (
                  <button className="secondary-button" type="button" onClick={() => goToSearch("albums")}>
                    View all
                  </button>
                ) : null}
              </div>
              {albums.length ? (
                <div className="grid">
                  {albums.map((album) => (
                    <AlbumCard
                      key={album.albumName}
                      name={album.albumName}
                      imageUrl={album.imageUrl}
                      trackCount={album.trackCount}
                      to={buildAlbumPath(album.albumName)}
                    />
                  ))}
                </div>
              ) : (
                <StateNotice title="No albums found" message="Try searching by a different album title." variant="empty" />
              )}
            </section>
          ) : null}

          {shouldShowPlaylists ? (
            <section className="results-section">
              <div className="section-header">
                <h2>Playlists</h2>
                {type === "all" ? (
                  <button className="secondary-button" type="button" onClick={() => goToSearch("playlists")}>
                    View all
                  </button>
                ) : null}
              </div>
              {playlists.length ? (
                <div className="grid">
                  {playlists.map((playlist) => (
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
              ) : (
                <StateNotice title="No playlists found" message="Try a broader playlist name." variant="empty" />
              )}
            </section>
          ) : null}

          {shouldShowUsers ? (
            <section className="results-section">
              <div className="section-header">
                <h2>Users</h2>
                {type === "all" ? (
                  <button className="secondary-button" type="button" onClick={() => goToSearch("users")}>
                    View all
                  </button>
                ) : null}
              </div>
              {users.length ? (
                <div className="grid">
                  {users.map((user) => (
                    <PlaylistCard
                      key={user.userId}
                      to={buildUserPath(user.userId)}
                      imageUrl={user.profileImageUrl}
                      title={user.username}
                      subtitle="User"
                    />
                  ))}
                </div>
              ) : (
                <StateNotice title="No users found" message="Try a different username fragment." variant="empty" />
              )}
            </section>
          ) : null}

          {type !== "all" && meta ? (
            <PaginationControls
              page={meta.page}
              limit={meta.limit}
              total={meta.total}
              onPageChange={(nextPage) => goToSearch(type, nextPage)}
            />
          ) : null}
        </>
      ) : null}
    </>
  );
};
