import { StateNotice } from "../ui/StateNotice";
import { SongRow } from "./SongRow";

export const SongList = ({
  tracks,
  emptyTitle,
  emptyMessage,
  allowRemove = false,
  onRemove,
  showAlbumLinks = true,
  showArtistLinks = true,
  showTrackLinks = true,
  currentArtistId = null,
  sourceContext = "song_list",
  searchQuery = "",
}) => {
  if (!tracks.length) {
    return <StateNotice title={emptyTitle} message={emptyMessage} variant="empty" />;
  }

  return (
    <section className="song-list-shell">
      <div className="song-list-scroll">
        <div className="song-list-table">
          <div className="song-list-header">
            <span>No.</span>
            <span>Artwork</span>
            <span>Song Details</span>
            <span>Album</span>
            <span>Duration</span>
            <span>Actions</span>
          </div>

          <div className="song-list-body">
            {tracks.map((track, index) => (
              <SongRow
                key={track.trackId}
                index={index + 1}
                track={track}
                allowRemove={allowRemove}
                onRemove={onRemove}
                showAlbumLinks={showAlbumLinks}
                showArtistLinks={showArtistLinks}
                showTrackLinks={showTrackLinks}
                currentArtistId={currentArtistId}
                sourceContext={sourceContext}
                searchQuery={searchQuery}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
