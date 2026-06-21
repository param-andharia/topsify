import { useEffect, useState } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { SearchBar } from "../search/SearchBar";

const HISTORY_MAX_INDEX_KEY = "topsify-history-max-idx";

export const Header = ({ onCreatePlaylistRequest }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const { logout } = useAuth();
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    const currentIndex = Number(window.history.state?.idx ?? 0);
    const storedMaxIndex = Number(sessionStorage.getItem(HISTORY_MAX_INDEX_KEY) ?? currentIndex);
    const maxIndex = navigationType === "PUSH" ? currentIndex : Math.max(storedMaxIndex, currentIndex);

    sessionStorage.setItem(HISTORY_MAX_INDEX_KEY, String(maxIndex));
    setCanGoBack(currentIndex > 0);
    setCanGoForward(currentIndex < maxIndex);
  }, [location.key, navigationType]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="header-bar">
      <div className="header-nav">
        <button className="icon-button history-button" type="button" onClick={() => navigate(-1)} disabled={!canGoBack}>
          <span>&lt;</span>
        </button>
        <button className="icon-button history-button" type="button" onClick={() => navigate(1)} disabled={!canGoForward}>
          <span>&gt;</span>
        </button>
        <button className="icon-button" type="button" onClick={() => navigate("/")}>
          <img src="https://cdn-icons-png.flaticon.com/128/14035/14035684.png" alt="Home" />
        </button>
      </div>

      <div className="header-search">
        <SearchBar />
      </div>

      <div className="header-actions">
        <button className="icon-button" type="button" onClick={onCreatePlaylistRequest}>
          <img src="https://cdn-icons-png.flaticon.com/128/10015/10015328.png" alt="Create playlist" />
        </button>
        <button className="icon-button" type="button" onClick={handleLogout}>
          <img src="https://cdn-icons-png.flaticon.com/128/6711/6711560.png" alt="Log out" />
        </button>
        <button className="icon-button" type="button" onClick={() => navigate("/profile")}>
          <img src="https://cdn-icons-png.flaticon.com/128/5582/5582872.png" alt="Profile" />
        </button>
      </div>
    </header>
  );
};
