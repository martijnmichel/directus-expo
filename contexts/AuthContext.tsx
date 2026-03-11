import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  auth,
  authentication,
  AuthenticationClient,
  AuthenticationData,
  CoreSchema,
  createDashboard,
  createDirectus,
  DirectusClient,
  DirectusUser,
  readMe,
  readSettings,
  rest,
  RestClient,
} from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import { UnistylesRuntime } from "react-native-unistyles";
import { LoginFormData } from "@/components/LoginForm";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: DirectusUser | null;
  directus:
    | (DirectusClient<CoreSchema> &
        AuthenticationClient<CoreSchema> &
        RestClient<CoreSchema>)
    | null;
  login: (email: string, password: string, apiUrl: string) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
  setApiKey: (apiKey: string, apiUrl: string) => Promise<void>;
  refreshSession: (overrideApi?: { url: string }) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const getSessionStorageKey = (apiUrl?: string) => {
    // Per-instance key so multiple Directus instances don't clobber each other
    const keyPart = apiUrl ? encodeURIComponent(apiUrl) : "default";
    return `directus_session_token:${keyPart}`;
  };

  const initDirectus = (url?: string) => {
    const sessionKey = getSessionStorageKey(url);
    return createDirectus(url || "https://directus.example.com")
      .with(
        authentication("json", {
          autoRefresh: true,
          credentials: "include",
          storage: {
            get: async () => {
              try {
                return JSON.parse(
                  (await AsyncStorage.getItem(
                    sessionKey
                  )) as string
                ) as AuthenticationData;
              } catch (e) {
                console.error(e);
                return null;
              }
            },
            set: async (value) =>
              await AsyncStorage.setItem(
                sessionKey,
                JSON.stringify(value)
              ),
          },
        })
      )
      .with(
        rest({
          onResponse: async (response) => {
            if (response.status === 401) {
              console.log(response);
              await logout();
              router.push("/login");
            }
            return response;
          },
        })
      );
  };
  const [directus, setDirectus] = useState(initDirectus());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<DirectusUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    initializeDirectus();
  }, []);

  const initializeDirectus = async () => {
    try {
      const re = await AsyncStorage.getItem(
        LocalStorageKeys.DIRECTUS_API_ACTIVE
      );
      if (!re) {
        setIsLoading(false);
        return;
      }

      const activeApi = JSON.parse(re) as {
        url?: string;
        authType?: "email" | "apiKey";
      };

      switch (activeApi?.authType) {
        case "email":
          try {
            console.log({ api: activeApi });

            const directus = initDirectus(activeApi.url);
            setDirectus(directus);

            // Email/password sessions are persisted by the Directus SDK in the per-instance
            // `directus_session_token:<apiUrl>` storage key.
            const sessionRaw = await AsyncStorage.getItem(
              getSessionStorageKey(activeApi.url)
            );
            if (!sessionRaw) break;

            // Refresh if possible (will use refresh_token if present)
            await directus.refresh();

            const freshToken = await directus.getToken();
            if (!freshToken) break;

            const user = await directus.request(readMe());
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const settings = await directus.request(readSettings());

            setToken(freshToken);
            setUser(user as DirectusUser);
            setIsAuthenticated(true);
          } catch (error) {
            // Session is invalid/expired; clear it for the active instance
            try {
              await AsyncStorage.removeItem(getSessionStorageKey(activeApi?.url));
            } catch (e) {
              // ignore
            }
          }
          break;
        case "apiKey": {
          // API key is intentionally not persisted in AsyncStorage for security.
          // We still initialize the client for the active API, but require re-auth.
          const directus = initDirectus(activeApi.url);
          setDirectus(directus);
          break;
        }
        default: {
          const directus = initDirectus(activeApi.url);
          setDirectus(directus);
          break;
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to initialize Directus:", error);
    }
  };

  const login = async (email: string, password: string, apiUrl: string) => {
    try {
      const directus = initDirectus(apiUrl);
      setDirectus(directus);
      await directus.login(email, password);
      const token = await directus.getToken();
      if (!token) throw new Error("Missing access token");
      const user = await directus.request(readMe());
      setUser(user as DirectusUser);
      setToken(token);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Login failed");
    }
  };

  const refreshSession = async (overrideApi?: { url: string }) => {
    try {
      const apiUrl = overrideApi?.url;
      if (!apiUrl) {
        const activeApiRaw = await AsyncStorage.getItem(
          LocalStorageKeys.DIRECTUS_API_ACTIVE
        );
        if (!activeApiRaw) return false;
        const activeApi = JSON.parse(activeApiRaw) as { url?: string };
        if (!activeApi?.url) return false;
        return refreshSessionForUrl(activeApi.url);
      }
      return refreshSessionForUrl(apiUrl);
    } catch (e) {
      return false;
    }
  };

  const refreshSessionForUrl = async (apiUrl: string) => {
    try {
      const sessionRaw = await AsyncStorage.getItem(
        getSessionStorageKey(apiUrl)
      );
      if (!sessionRaw) return false;

      const session = JSON.parse(sessionRaw) as AuthenticationData | null;
      if (!session?.refresh_token) return false;

      const client = initDirectus(apiUrl);
      setDirectus(client);

      await client.refresh();
      const freshToken = await client.getToken();
      if (!freshToken) return false;

      const me = await client.request(readMe());
      setUser(me as DirectusUser);
      setToken(freshToken);
      setIsAuthenticated(true);
      return true;
    } catch (e) {
      return false;
    }
  };

  const setApiKey = async (apiKey: string, apiUrl: string) => {
    try {
      const directus = createDirectus(apiUrl).with(authentication()).with(rest());
      setDirectus(directus);
      await directus.setToken(apiKey);
      setToken(apiKey);
      const user = await directus.request(readMe());
      setUser(user as DirectusUser);
      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Login failed");
    }
  };

  const logout = async () => {
    try {
      // Clear the per-instance session blob the SDK uses for refresh
      const activeApi = await AsyncStorage.getItem(
        LocalStorageKeys.DIRECTUS_API_ACTIVE
      );
      if (activeApi) {
        try {
          const api = JSON.parse(activeApi) as { url?: string };
          await AsyncStorage.removeItem(getSessionStorageKey(api?.url));
        } catch (e) {
          // ignore parsing errors
        }
      }

      await directus?.logout();
      //await AsyncStorage.removeItem(LocalStorageKeys.DIRECTUS_API_ACTIVE);
      setDirectus(initDirectus());
      setIsAuthenticated(false);
      setToken(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        directus,
        login,
        logout,
        refreshSession,
        setApiKey,
        user,
        token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
