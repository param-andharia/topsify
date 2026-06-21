import { fallbackImage } from "../../utils/format";
import { StateNotice } from "../ui/StateNotice";

export const SearchSuggestionsModal = ({ suggestions, loading, error, onSelect }) => (
  <div className="suggestions-modal">
    {loading ? <p className="suggestions-meta">Finding suggestions…</p> : null}
    {error ? <p className="suggestions-meta suggestions-error">{error}</p> : null}

    {!loading && !error && !suggestions.length ? (
      <StateNotice title="No quick matches" message="Keep typing to search songs, artists, albums, playlists, and users." variant="empty" />
    ) : null}

    {!loading &&
      suggestions.map((suggestion) => (
        <button
          className="suggestion-item"
          key={suggestion.key}
          type="button"
          onClick={() => onSelect(suggestion)}
        >
          <img src={suggestion.imageUrl || fallbackImage} alt={suggestion.label} />
          <span>
            <strong>{suggestion.label}</strong>
            <small>{suggestion.subtitle}</small>
          </span>
          <em>{suggestion.type}</em>
        </button>
      ))}
  </div>
);
