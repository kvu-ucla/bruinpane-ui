import { createContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

import type { PlaceAuthOptions, PlaceUser } from "@placeos/ts-client";
import { logout, setup, currentUser } from "@placeos/ts-client";
import { lastValueFrom } from "rxjs";
import { AUTHORIZED_GROUP } from "./models";

type AuthData = {
  user: PlaceUser | null;
  isAuthenticated: boolean;
  isForbidden: boolean;
  loading: boolean;
  logOut: () => void;
};

export const AuthContext = createContext<AuthData | null>(null);

export type PlaceSettings = {
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
};

/**
 * Initialise the PlaceOS API library
 */
const setupPlace = (settings: PlaceSettings): Promise<void> => {
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
};

type AuthProviderProps = { children: ReactNode };

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<PlaceUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isForbidden, setIsForbidden] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await setupPlace({
          route: "/control",
          use_domain: false,
          local_login: false,
          mock: false,
        });
        const user = await lastValueFrom(currentUser());
        const authorized = (Object.values(AUTHORIZED_GROUP) as Array<string>).some(group => user.groups?.includes(group) ?? false);
        setUser(user);
        setIsAuthenticated(true);
        setIsForbidden(!authorized);
      } catch {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        // Unblocks the UI regardless of auth outcome
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const logOut = () => logout();

  const value = {
    user,
    isAuthenticated,
    isForbidden,
    loading,
    logOut,
  };

  return (
      <AuthContext.Provider value={value}>
        {!loading && children}
      </AuthContext.Provider>
  );
};

