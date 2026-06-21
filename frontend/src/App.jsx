import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import { PageSpinner } from "./components/ui/PageSpinner";
import { useAuth } from "./context/AuthContext";
import { AlbumPage } from "./pages/AlbumPage";
import { ArtistPage } from "./pages/ArtistPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PlaylistPage } from "./pages/PlaylistPage";
import { ProfilePage } from "./pages/ProfilePage";
import { SearchPage } from "./pages/SearchPage";
import { SongPage } from "./pages/SongPage";
import { SignupPage } from "./pages/SignupPage";
import { UserPage } from "./pages/UserPage";

const ProtectedLayout = () => {
  const { user, isHydrating } = useAuth();

  if (isHydrating) {
    return <PageSpinner label="Restoring your session..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
};

const PublicOnlyRoute = ({ children }) => {
  const { user, isHydrating } = useAuth();

  if (isHydrating) {
    return <PageSpinner label="Restoring your session..." />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const App = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <PublicOnlyRoute>
          <LoginPage />
        </PublicOnlyRoute>
      }
    />
    <Route
      path="/signup"
      element={
        <PublicOnlyRoute>
          <SignupPage />
        </PublicOnlyRoute>
      }
    />

    <Route element={<ProtectedLayout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/songs/:trackId" element={<SongPage />} />
      <Route path="/artists/:artistId" element={<ArtistPage />} />
      <Route path="/albums/:albumName" element={<AlbumPage />} />
      <Route path="/playlists/:playlistId" element={<PlaylistPage />} />
      <Route path="/users/:userId" element={<UserPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

export default App;
