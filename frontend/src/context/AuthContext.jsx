import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isHydrating, setIsHydrating] = useState(true);

  const refreshSession = async () => {
    try {
      const response = await authApi.me();
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        return null;
      }

      throw error;
    } finally {
      setIsHydrating(false);
    }
  };

  useEffect(() => {
    refreshSession().catch((error) => {
      console.error("Failed to hydrate session", error);
      setUser(null);
      setIsHydrating(false);
    });
  }, []);

  const login = async (payload) => {
    const response = await authApi.login(payload);
    setUser(response.data.user);
    return response.data.user;
  };

  const signup = async (payload) => {
    const response = await authApi.signup(payload);
    setUser(response.data.user);
    return response.data.user;
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      isHydrating,
      login,
      signup,
      logout,
      refreshSession,
    }),
    [user, isHydrating]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
