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
      .with(rest());
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
      const apiUrl = await AsyncStorage.getItem("apiUrl");
      if (!apiUrl) {
        setIsLoading(false);
        return;
      }

      const directus = initDirectus(apiUrl);
      setDirectus(directus);

      // Try to refresh the token
      try {
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
      await AsyncStorage.setItem("apiUrl", apiUrl);

      setIsAuthenticated(true);
    } catch (error) {
      throw new Error("Login failed");
    }
  };

  const logout = async () => {
    try {
      await directus?.logout();
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("apiUrl");
      directus.url = new URL("");
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

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
