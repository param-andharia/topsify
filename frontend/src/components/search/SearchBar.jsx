import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { searchApi } from "../../api/searchApi";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { buildSearchPath } from "../../utils/navigation";
import { SearchSuggestionsModal } from "./SearchSuggestionsModal";

export const SearchBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const debouncedQuery = useDebouncedValue(query, 250);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [location.search]);

  useEffect(() => {
    if (!showSuggestions || !debouncedQuery.trim()) {
      setSuggestions([]);
      setIsLoading(false);
      setErrorMessage("");
      return;
    }

    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    searchApi
      .suggest({ q: debouncedQuery.trim(), limit: 8 })
      .then((response) => {
        if (active) {
          setSuggestions(response.data.suggestions);
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
  }, [debouncedQuery, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const submitSearch = (value, type = "all") => {
    const nextQuery = value.trim();

    if (!nextQuery) {
      navigate("/");
      return;
    }

    setShowSuggestions(false);
    navigate(buildSearchPath({ q: nextQuery, type }));
  };

  const handleSuggestionSelect = (suggestion) => {
    navigate(`${suggestion.target.pathname}${suggestion.target.search ?? ""}`);
    setShowSuggestions(false);
  };

  return (
    <div className="search-bar-shell" ref={wrapperRef}>
      <form
        className="search-form"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch(query);
        }}
      >
        <input
          type="text"
          value={query}
          name="search"
          onFocus={() => setShowSuggestions(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setShowSuggestions(true);
          }}
          placeholder="Search songs, albums, artists..."
        />
      </form>

      {showSuggestions ? (
        <SearchSuggestionsModal
          suggestions={suggestions}
          loading={isLoading}
          error={errorMessage}
          onSelect={handleSuggestionSelect}
        />
      ) : null}
    </div>
  );
};
