import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { artistApi } from "../api/artistApi";
import { SongList } from "../components/songs/SongList";
import { DetailHero } from "../components/ui/DetailHero";
import { PaginationControls } from "../components/ui/PaginationControls";
import { PageSpinner } from "../components/ui/PageSpinner";
import { StateNotice } from "../components/ui/StateNotice";
import { pluralize } from "../utils/format";

const PAGE_LIMIT = 20;

export const ArtistPage = () => {
  const { artistId } = useParams();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setPage(1);
  }, [artistId]);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    artistApi
      .getArtist(artistId, { page, limit: PAGE_LIMIT })
      .then((response) => {
        if (active) {
          setData(response.data);
          setMeta(response.meta);
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
  }, [artistId, page]);

  if (isLoading) {
    return <PageSpinner label="Loading artist..." />;
  }

  if (errorMessage) {
    return <StateNotice title="Artist unavailable" message={errorMessage} variant="error" />;
  }

  if (!data?.artist) {
    return <StateNotice title="Artist missing" message="This artist could not be found." variant="empty" />;
  }

  const { artist, songs } = data;

  return (
    <>
      <DetailHero
        imageUrl={artist.artistImageUrl}
        eyebrow="Artist"
        title={artist.artistName}
        meta={[pluralize(artist.trackCount, "track")]}
      />

      <SongList
        tracks={songs}
        currentArtistId={artist.artistId}
        sourceContext="artist"
        emptyTitle="No songs found"
        emptyMessage="This artist does not have any tracks in the catalog yet."
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
