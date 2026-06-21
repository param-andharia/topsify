import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { albumApi } from "../api/albumApi";
import { playlistApi } from "../api/playlistApi";
import { SongList } from "../components/songs/SongList";
import { DetailHero } from "../components/ui/DetailHero";
import { PaginationControls } from "../components/ui/PaginationControls";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { formatDuration, pluralize, summarizeNames } from "../utils/format";

const PAGE_LIMIT = 20;

export const AlbumPage = () => {
  const { albumName } = useParams();
  const decodedAlbumName = useMemo(() => decodeURIComponent(albumName ?? ""), [albumName]);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const loadAlbum = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await albumApi.getAlbum(decodedAlbumName, { page, limit: PAGE_LIMIT });
      setData(response.data);
      setMeta(response.meta);
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [decodedAlbumName, page]);

  useEffect(() => {
    setPage(1);
    setActionMessage("");
  }, [decodedAlbumName]);

  useEffect(() => {
    loadAlbum();
  }, [loadAlbum]);

  if (isLoading) {
    return <PageSpinner label="Loading album..." />;
  }

  if (errorMessage) {
    return <StateNotice title="Album unavailable" message={errorMessage} variant="error" />;
  }

  if (!data?.album) {
    return <StateNotice title="Album missing" message="This album could not be found." variant="empty" />;
  }

  const { album, songs } = data;
  const albumArtists = summarizeNames(album.artistNames ?? []);

  const handleFollowToggle = async () => {
    if (!album.playlistId) {
      return;
    }

    try {
      if (album.isFollowing) {
        await playlistApi.unfollowPlaylist(album.playlistId);
        setActionMessage("Album removed from your saved collection.");
      } else {
        await playlistApi.followPlaylist(album.playlistId);
        setActionMessage("Album saved successfully.");
      }

      await loadAlbum();
    } catch (error) {
      setActionMessage(error.message);
    }
  };

  return (
    <>
      <DetailHero
        imageUrl={album.imageUrl}
        eyebrow="Album"
        title={album.albumName}
        meta={[
          pluralize(album.trackCount, "track"),
          `Duration: ${formatDuration(album.durationMs)}`,
          albumArtists ? `Artists: ${albumArtists}` : null,
          album.playlistId ? pluralize(album.followersCount, "follower") : null,
        ].filter(Boolean)}
        actions={
          album.playlistId ? (
            <button className="search-button button-text" type="button" onClick={handleFollowToggle}>
              {album.isFollowing ? "Remove from Saved" : "Save Album"}
            </button>
          ) : null
        }
      />

      {actionMessage ? <StateNotice title="Album updated" message={actionMessage} variant="success" /> : null}

      <SongList
        tracks={songs}
        showAlbumLinks={false}
        sourceContext="album"
        emptyTitle="No songs found"
        emptyMessage="This album does not have any tracks in the catalog yet."
      />

      <PaginationControls
        page={meta?.page ?? 1}
        limit={meta?.limit ?? PAGE_LIMIT}
        total={meta?.total ?? 0}
        onPageChange={setPage}
      />
    </>
  );
};
