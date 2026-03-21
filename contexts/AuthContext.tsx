import { createContext, useContext, useEffect, useState } from "react";
import {
  authentication,
  AuthenticationClient,
  AuthenticationData,
  CoreSchema,
  createDirectus,
  DirectusClient,
  DirectusUser,
  readMe,
  readPolicyGlobals,
  readSettings,
  rest,
  RestClient,
} from "@directus/sdk";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { applyInitialDeepLinkFromUrl } from "@/state/linking/deepLinks";
import { LocalStorageKeys } from "@/state/local/useLocalStorage";
import {
  clearSessionStorage,
  readSessionWrapper,
  writeSessionWrapper,
} from "@/state/auth/directusSessionStorage";
import {
  readActiveSessionId,
  resolveActiveSessionContext,
} from "@/state/auth/resolveActiveSession";

export interface PolicyGlobals {
  app_access: boolean;
  admin_access: boolean;
  enforce_tfa: boolean;
}

export type RefreshSessionTarget = { url: string; sessionId: string };

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: DirectusUser | null;
  policyGlobals: PolicyGlobals | null;
  directus:
    | (DirectusClient<CoreSchema> &
        AuthenticationClient<CoreSchema> &
        RestClient<CoreSchema>)
    | null;
  login: (
    email: string,
    password: string,
    apiUrl: string,
    sessionId: string,
    apiId: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  token: string | null;
  setApiKey: (
    apiKey: string,
    apiUrl: string,
    sessionId: string,
    apiId: string,
  ) => Promise<void>;
  refreshSession: (
    override?: RefreshSessionTarget,
  ) => Promise<{ ok: boolean; authType?: "email" | "apiKey" }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PLACEHOLDER_URL = "https://directus.invalid";
const PLACEHOLDER_SESSION_ID = "__bootstrap__";
const PLACEHOLDER_API_ID = "";

function getUserLabel(me: DirectusUser): string | undefined {
  const first = String((me as { first_name?: unknown }).first_name ?? "").trim();
  const last = String((me as { last_name?: unknown }).last_name ?? "").trim();
  const full = `${first} ${last}`.trim();
  if (full) return full;
  const email = String((me as { email?: unknown }).email ?? "").trim();
  if (email) return email;
  return undefined;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [directus, setDirectus] = useState<
    DirectusClient<CoreSchema> &
      AuthenticationClient<CoreSchema> &
      RestClient<CoreSchema>
  >(() =>
    createDirectusClient(
      PLACEHOLDER_URL,
      PLACEHOLDER_SESSION_ID,
      PLACEHOLDER_API_ID,
    ),
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<DirectusUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [policyGlobals, setPolicyGlobals] = useState<PolicyGlobals | null>(
    null,
  );

  const fetchAndSetPolicyGlobals = async (
    client: DirectusClient<CoreSchema> &
      AuthenticationClient<CoreSchema> &
      RestClient<CoreSchema>,
  ) => {
    try {
      const data = await client.request(readPolicyGlobals());
      const raw = data as Record<string, unknown>;
      if (
        raw &&
        typeof raw.app_access === "boolean" &&
        typeof raw.admin_access === "boolean"
      ) {
        setPolicyGlobals({
          app_access: raw.app_access,
          admin_access: raw.admin_access,
          enforce_tfa: raw.enforce_tfa === true,
        });
      } else {
        setPolicyGlobals(null);
      }
    } catch {
      setPolicyGlobals(null);
    }
  };

  const logoutFrom401 = async () => {
    try {
      const sid = await readActiveSessionId();
      if (sid) {
        await clearSessionStorage(sid);
        await AsyncStorage.removeItem(
          LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
        );
      }
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      setPolicyGlobals(null);
      setDirectus(
        createDirectusClient(
          PLACEHOLDER_URL,
          PLACEHOLDER_SESSION_ID,
          PLACEHOLDER_API_ID,
        ),
      );
      router.push("/login");
    } catch {
      /* ignore */
    }
  };

  function createDirectusClient(
    url: string,
    sessionId: string,
    apiId: string,
  ): DirectusClient<CoreSchema> &
    AuthenticationClient<CoreSchema> &
    RestClient<CoreSchema> {
    return createDirectus(url)
      .with(
        authentication("json", {
          autoRefresh: true,
          credentials: "include",
          storage: {
            get: async () => {
              try {
                const w = await readSessionWrapper(sessionId);
                return (w?.sdk ?? null) as AuthenticationData | null;
              } catch {
                return null;
              }
            },
            set: async (value) => {
              const prev = await readSessionWrapper(sessionId);
              const next = {
                apiId: apiId || prev?.apiId || "",
                authType: "email" as const,
                sdk: value ?? null,
                apiKey: prev?.apiKey ?? null,
                userLabel: prev?.userLabel,
                instanceUrl: prev?.instanceUrl ?? url,
              };
              await writeSessionWrapper(sessionId, next);
            },
          },
        }),
      )
      .with(
        rest({
          onResponse: async (response) => {
            if (response.status === 401) {
              await logoutFrom401();
            }
            return response;
          },
        }),
      );
  }

  useEffect(() => {
    initializeDirectus();
  }, []);

  const initializeDirectus = async () => {
    try {
      await applyInitialDeepLinkFromUrl(await Linking.getInitialURL());
      const ctx = await resolveActiveSessionContext();
      if (!ctx) {
        setIsLoading(false);
        return;
      }

      const { sessionId, api, wrapper } = ctx;
      const url = api.url;
      const apiId = api.id ?? wrapper.apiId;
      const authType = wrapper.authType;

      switch (authType) {
        case "email":
          try {
            const client = createDirectusClient(url, sessionId, apiId);
            setDirectus(client);

            const wrapper = await readSessionWrapper(sessionId);
            if (!wrapper?.sdk) break;

            await client.refresh();

            const freshToken = await client.getToken();
            if (!freshToken) break;

            const me = await client.request(readMe());
            await client.request(readSettings());

            setToken(freshToken);
            setUser(me as DirectusUser);
            setIsAuthenticated(true);
            await fetchAndSetPolicyGlobals(client);
          } catch {
            try {
              await clearSessionStorage(sessionId);
            } catch {
              /* ignore */
            }
          }
          break;
        case "apiKey": {
          try {
            const wrapper = await readSessionWrapper(sessionId);
            const storedKey = wrapper?.apiKey;
            if (!storedKey) break;

            const client = createDirectus(url)
              .with(authentication())
              .with(
                rest({
                  onResponse: async (response) => {
                    if (response.status === 401) {
                      await logoutFrom401();
                    }
                    return response;
                  },
                }),
              );
            setDirectus(client as typeof client & RestClient<CoreSchema>);
            await client.setToken(storedKey);
            const me = await client.request(readMe());
            const tok = await client.getToken();
            if (!tok) break;

            setToken(tok);
            setUser(me as DirectusUser);
            setIsAuthenticated(true);
            await fetchAndSetPolicyGlobals(
              client as DirectusClient<CoreSchema> &
                AuthenticationClient<CoreSchema> &
                RestClient<CoreSchema>,
            );
          } catch {
            try {
              await clearSessionStorage(sessionId);
            } catch {
              /* ignore */
            }
          }
          break;
        }
        default: {
          setDirectus(createDirectusClient(url, sessionId, apiId));
          break;
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Failed to initialize Directus:", error);
      setIsLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string,
    apiUrl: string,
    sessionId: string,
    apiId: string,
  ) => {
    const client = createDirectusClient(apiUrl, sessionId, apiId);
    setDirectus(client);
    await client.login(email, password);
    const tok = await client.getToken();
    if (!tok) throw new Error("Missing access token");
    const me = await client.request(readMe());
    const prev = await readSessionWrapper(sessionId);
    await writeSessionWrapper(sessionId, {
      apiId,
      authType: "email",
      sdk: prev?.sdk ?? null,
      apiKey: prev?.apiKey ?? null,
      userLabel: getUserLabel(me as DirectusUser),
      instanceUrl: apiUrl,
    });
    setUser(me as DirectusUser);
    setToken(tok);
    setIsAuthenticated(true);
    await fetchAndSetPolicyGlobals(client);
  };

  const refreshSession = async (override?: RefreshSessionTarget) => {
    try {
      let sessionId: string | undefined;
      let apiUrl: string | undefined;
      if (override?.sessionId && override?.url) {
        sessionId = override.sessionId;
        apiUrl = override.url;
      } else {
        const ctx = await resolveActiveSessionContext();
        if (!ctx) return { ok: false };
        sessionId = ctx.sessionId;
        apiUrl = ctx.api.url;
      }
      if (!sessionId || !apiUrl) return { ok: false };
      return refreshSessionForSession(sessionId, apiUrl);
    } catch {
      return { ok: false };
    }
  };

  const refreshSessionForSession = async (
    sessionId: string,
    apiUrl: string,
  ): Promise<{ ok: boolean; authType?: "email" | "apiKey" }> => {
    try {
      const wrapper = await readSessionWrapper(sessionId);

      // Static-token sessions first so leftover sdk fields never trigger OAuth refresh.
      if (wrapper?.authType === "apiKey") {
        const key = wrapper.apiKey?.trim();
        if (!key) return { ok: false };
        const client = createDirectus(apiUrl)
          .with(authentication())
          .with(
            rest({
              onResponse: async (response) => {
                if (response.status === 401) {
                  await logoutFrom401();
                }
                return response;
              },
            }),
          );
        setDirectus(client as DirectusClient<CoreSchema> &
          AuthenticationClient<CoreSchema> &
          RestClient<CoreSchema>);
        await client.setToken(key);
        const tok = await client.getToken();
        if (tok) {
          const me = await client.request(readMe());
          await writeSessionWrapper(sessionId, {
            apiId: wrapper.apiId ?? "",
            authType: "apiKey",
            sdk: null,
            apiKey: key,
            userLabel: getUserLabel(me as DirectusUser),
            instanceUrl: apiUrl,
          });
          setUser(me as DirectusUser);
          setToken(tok);
          setIsAuthenticated(true);
          return { ok: true, authType: "apiKey" };
        }
        return { ok: false };
      }

      // Email / legacy: OAuth refresh via stored refresh_token only (unchanged behavior).
      const isEmailAuth =
        !wrapper?.authType || wrapper.authType === "email";
      if (isEmailAuth && wrapper?.sdk?.refresh_token) {
        const client = createDirectusClient(
          apiUrl,
          sessionId,
          wrapper.apiId ?? "",
        );
        setDirectus(client);
        await client.refresh();
        const freshToken = await client.getToken();
        if (freshToken) {
          const me = await client.request(readMe());
          const afterRefresh = await readSessionWrapper(sessionId);
          await writeSessionWrapper(sessionId, {
            apiId: wrapper.apiId ?? "",
            authType: "email",
            sdk: afterRefresh?.sdk ?? wrapper.sdk ?? null,
            apiKey: wrapper.apiKey ?? null,
            userLabel: getUserLabel(me as DirectusUser),
            instanceUrl: apiUrl,
          });
          setUser(me as DirectusUser);
          setToken(freshToken);
          setIsAuthenticated(true);
          return { ok: true, authType: "email" };
        }
      }

      return { ok: false };
    } catch {
      return { ok: false };
    }
  };

  const setApiKey = async (
    apiKey: string,
    apiUrl: string,
    sessionId: string,
    apiId: string,
  ) => {
    const client = createDirectus(apiUrl)
      .with(authentication())
      .with(
        rest({
          onResponse: async (response) => {
            if (response.status === 401) {
              await logoutFrom401();
            }
            return response;
          },
        }),
      );
    setDirectus(client as DirectusClient<CoreSchema> &
      AuthenticationClient<CoreSchema> &
      RestClient<CoreSchema>);
    await client.setToken(apiKey);
    const me = await client.request(readMe());
    setToken(apiKey);
    setUser(me as DirectusUser);
    setIsAuthenticated(true);
    await fetchAndSetPolicyGlobals(
      client as DirectusClient<CoreSchema> &
        AuthenticationClient<CoreSchema> &
        RestClient<CoreSchema>,
    );
    await writeSessionWrapper(sessionId, {
      apiId,
      authType: "apiKey",
      sdk: null,
      apiKey,
      userLabel: getUserLabel(me as DirectusUser),
      instanceUrl: apiUrl,
    });
  };

  const logout = async () => {
    try {
      const sid = await readActiveSessionId();
      const wrapper = sid ? await readSessionWrapper(sid) : null;
      if (wrapper?.authType === "email" && directus) {
        try {
          await directus.logout();
        } catch {
          /* ignore */
        }
      }
      if (sid) {
        await clearSessionStorage(sid);
        await AsyncStorage.removeItem(
          LocalStorageKeys.DIRECTUS_ACTIVE_SESSION_ID,
        );
      }

      setDirectus(
        createDirectusClient(PLACEHOLDER_URL, PLACEHOLDER_SESSION_ID, PLACEHOLDER_API_ID),
      );
      setIsAuthenticated(false);
      setToken(null);
      setUser(null);
      setPolicyGlobals(null);
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
        policyGlobals,
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
