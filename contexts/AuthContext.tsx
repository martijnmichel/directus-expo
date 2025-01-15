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
  rest,
  RestClient,
} from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import {
  LocalStorageKeys,
  useLocalStorage,
} from "@/state/local/useLocalStorage";

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
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const initDirectus = (url?: string) => {
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
                    "directus_session_token"
                  )) as string
                ) as AuthenticationData;
              } catch (e) {
                console.error(e);
                return null;
              }
            },
            set: async (value) =>
              await AsyncStorage.setItem(
                "directus_session_token",
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

      // Try to refresh the token
      try {
        const api = JSON.parse(re);

        console.log({ api });

        const directus = initDirectus(api.url);
        setDirectus(directus);

        const token = await AsyncStorage.getItem("authToken");
        if (token) {
          await directus.refresh();
          const user = await directus.request(readMe());
          setUser(user as DirectusUser);
          setIsAuthenticated(true);
        }
      } catch (error) {
        await AsyncStorage.removeItem("authToken");
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
      const user = await directus.request(readMe());
      setUser(user as DirectusUser);
      await AsyncStorage.setItem("authToken", token || "");

      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Login failed");
    }
  };

  const logout = async () => {
    try {
      await directus?.logout();
      await AsyncStorage.removeItem("authToken");
      directus.url = new URL("");
      setIsAuthenticated(false);
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
        user,
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
