import { useState, useEffect, createContext, useContext } from "react";
import {
  apiRequest,
  getToken,
  setToken,
  removeToken,
  getStoredUser,
  setStoredUser,
  clearStoredUser,
  type User,
} from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Verify token is still valid
    apiRequest<{ user: User }>("GET", "/api/auth/user")
      .then((data) => {
        if (data.user.role !== "EMPLOYEE" && data.user.role !== "ADMIN") {
          removeToken();
          clearStoredUser();
          setUser(null);
        } else {
          setUser(data.user);
          setStoredUser(data.user);
        }
      })
      .catch(() => {
        removeToken();
        clearStoredUser();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiRequest<{ token: string; user: User }>(
      "POST",
      "/api/auth/login",
      { email, password }
    );

    if (data.user.role !== "EMPLOYEE" && data.user.role !== "ADMIN") {
      throw new Error("Access denied. This portal is for employees only.");
    }

    if (!data.user.isActive) {
      throw new Error(
        "Your account is pending activation. Please contact your administrator."
      );
    }

    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
  };

  const logout = () => {
    apiRequest("POST", "/api/auth/logout").catch(() => {});
    removeToken();
    clearStoredUser();
    setUser(null);
    window.location.href = "/login";
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
