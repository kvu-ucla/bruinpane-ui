import { createContext, useContext, useEffect, useState } from "react";

import type { PlaceAuthOptions } from "@placeos/ts-client";
import { logout, PlaceUser, setup, showUser } from "@placeos/ts-client";
import { lastValueFrom } from "rxjs";

interface AuthData {
  user: PlaceUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  logOut: () => void;
}

// Create the context
const AuthContext = createContext<AuthData | null>(null);

export interface PlaceSettings {
  /** Protocol used by the application server */
  protocol?: "http:" | "https:";
  /** Domain that the API server lies  */
  domain?: string;
  /** Port number of the API server */
  port?: number;
  /** Route on domain application rests */
  route: string;
  /** Whether to use the settings domain for auth */
  use_domain: boolean;
  /** Whether login is handled locally by the application */
  local_login: boolean;
  /** Whether application should mock out API requests */
  mock: boolean;

  storage?: "session" | "local";
}

/**
 * Initialise the PlaceOS API library
 */
function setupPlace(settings: PlaceSettings): Promise<void> {
  const protocol = settings.protocol || location.protocol;
  const host = settings.domain || location.hostname;
  const port = settings.port || location.port;
  const url = settings.use_domain
      ? `${protocol}//${host}:${port}`
      : location.origin;
  const route = (location.pathname + "/").replace("//", "/");
  const mock =
      settings.mock ||
      location.href.includes("mock=true") ||
      localStorage.getItem("mock") === "true";
  // Generate configuration object
  const config: PlaceAuthOptions = {
    auth_type: "auth_code",
    scope: "public",
    host: `${host}${port ? ":" + port : ""}`,
    auth_uri: `${url}/auth/oauth/authorize`,
    token_uri: `${url}/auth/oauth/token`,
    redirect_uri: `${location.origin}${route}oauth-resp.html`,
    handle_login: !settings.local_login,
    use_iframe: true,
    mock,
  };
  if (localStorage) {
    localStorage.setItem(
        "mock",
        `${!!mock && !location.href.includes("mock=false")}`,
    );
  }
  return setup(config);
}

// --- The Auth Provider ---

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<PlaceUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Crucial for the initial load

  useEffect(() => {
    window.debug = true;
    const checkAuth = async () => {
      try {
        // This is the single function call on load
        await setupPlace({
          route: "/control",
          use_domain: false,
          local_login: false,
          mock: false,
        });
        const user = await lastValueFrom(showUser("current"));
        setUser(user);
        setIsAuthenticated(true);
      } catch {
        // If the API call fails, the user is not logged in
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // This is critical to unblock the UI
        setLoading(false);
      }
    };

    checkAuth();
  }, []); // Empty array ensures this runs only once on app startup

  const logOut = () => logout();

  const value = {
    user,
    isAuthenticated,
    loading,
    logOut,
  };

  return (
      <AuthContext.Provider value={value}>
        {/* Don't render children until the initial check is complete */}
        {!loading && children}
      </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
