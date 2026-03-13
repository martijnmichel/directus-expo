import {
  createDirectus,
  readItems,
  rest,
  staticToken,
} from "@directus/sdk";
import { ApnsClient, Notification as ApnsNotification, ApnsError } from "apns2";
import { getApps, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { initializeApp, type ServiceAccount } from "firebase-admin";
import fs from "fs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// --- Types ---

type PushAction = "create" | "update" | "delete";

interface SubscriptionEntry {
  collection: string;
  create: boolean;
  update: boolean;
  delete: boolean;
}

interface AppPushDevice {
  id: string | number;
  token: string;
  platform: "ios" | "android";
  subscriptions: SubscriptionEntry[] | null;
}

interface PushRequestBody {
  directusUrl: string;
  directusToken: string;
  collection: string;
  key: string;
  /** Optional explicit action from caller (create|update|delete). */
  action?: PushAction;
  /** Optional raw Directus event, e.g. items.create */
  event?: string;
  payload?: { title?: string; body?: string };
}

const COLLECTION = "app_push_devices";

// --- Auth ---

function getAuthSecret(req: NextRequest): string | null {
  const bearer = req.headers.get("authorization");
  if (bearer?.startsWith("Bearer ")) return bearer.slice(7).trim();
  return req.headers.get("x-push-secret")?.trim() ?? null;
}

// --- Validation ---

function parseBody(body: unknown): PushRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const directusUrl = typeof b.directusUrl === "string" ? b.directusUrl : null;
  const directusToken =
    typeof b.directusToken === "string" ? b.directusToken : null;
  const collection = typeof b.collection === "string" ? b.collection : null;
  const key = typeof b.key === "string" ? b.key : null;
  if (
    !directusUrl ||
    !directusToken ||
    !collection ||
    !key
  )
    return null;
  const event =
    typeof b.event === "string" && b.event.length > 0 ? b.event : undefined;
  const rawAction = b.action as string | undefined;
  let action: PushAction | undefined;
  if (rawAction && ["create", "update", "delete"].includes(rawAction)) {
    action = rawAction as PushAction;
  } else if (event) {
    const suffix = event.split(".").pop();
    if (suffix === "create" || suffix === "update" || suffix === "delete") {
      action = suffix;
    }
  }
  if (!action) return null;
  let payload: PushRequestBody["payload"] | undefined;
  if (b.payload && typeof b.payload === "object" && b.payload !== null) {
    const p = b.payload as Record<string, unknown>;
    payload = {};
    if (typeof p.title === "string") payload.title = p.title;
    if (typeof p.body === "string") payload.body = p.body;
  }
  return {
    directusUrl,
    directusToken,
    collection,
    action,
    event,
    key,
    payload,
  };
}

function isAllowedUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.hostname === "localhost";
  } catch {
    return false;
  }
}

// --- Directus ---

function createClient(baseUrl: string, token: string) {
  return createDirectus(baseUrl).with(rest()).with(staticToken(token));
}

function filterDevicesForEvent(
  devices: AppPushDevice[],
  collection: string,
  action: PushAction
): AppPushDevice[] {
  return devices.filter((d) => {
    const subs = d.subscriptions;
    if (!Array.isArray(subs)) return false;
    const entry = subs.find(
      (s) => typeof s?.collection === "string" && s.collection === collection
    );
    if (!entry) return false;
    return Boolean(entry[action]);
  });
}

function splitByPlatform(devices: AppPushDevice[]): {
  ios: string[];
  android: string[];
} {
  const ios: string[] = [];
  const android: string[] = [];
  for (const d of devices) {
    const t = typeof d.token === "string" ? d.token.trim() : "";
    if (!t) continue;
    if (d.platform === "ios") ios.push(t);
    else if (d.platform === "android") android.push(t);
  }
  return { ios, android };
}

// --- Deep link ---

function buildDeepLink(collection: string, key: string): string {
  return `directus://content/${encodeURIComponent(collection)}/${encodeURIComponent(key)}`;
}

// --- APNs (apns2: HTTP/2 + JWT, no legacy OpenSSL) ---

let apnsClient: ApnsClient | null = null;

async function getApnsClient(): Promise<ApnsClient | null> {
  if (apnsClient) return apnsClient;
  const keyBase64 = process.env.APNS_KEY_BASE64;
  const keyPath = process.env.APNS_KEY_PATH;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId || !keyId || !teamId) return null;
  let keyBuffer: Buffer | undefined;
  if (keyBase64) {
    try {
      const cleaned = keyBase64.replace(/[^A-Za-z0-9+/=]/g, "");
      keyBuffer = Buffer.from(cleaned, "base64");
    } catch {
      keyBuffer = undefined;
    }
  } else if (keyPath) {
    try {
      const fs = await import("fs");
      keyBuffer = fs.readFileSync(keyPath);
    } catch {
      keyBuffer = undefined;
    }
  }
  if (!keyBuffer || keyBuffer.length === 0) return null;
  // apns2/fast-jwt expect a PEM string for ES256; raw Buffer can cause "Invalid private key"
  const signingKey =
    keyBuffer[0] === 0x2d
      ? keyBuffer.toString("utf8")
      : `-----BEGIN PRIVATE KEY-----\n${keyBuffer.toString("base64").replace(/(.{64})/g, "$1\n").trim()}\n-----END PRIVATE KEY-----`;
  const production = process.env.NODE_ENV === "production";
  apnsClient = new ApnsClient({
    team: teamId,
    keyId,
    signingKey,
    defaultTopic: bundleId,
    host: production ? "api.push.apple.com" : "api.sandbox.push.apple.com",
  });
  return apnsClient;
}

async function sendApns(
  tokens: string[],
  title: string,
  body: string,
  deepLink: string,
  bundleId: string
): Promise<{ sent: number; failed: number; firstError?: string; apnsConfigured: boolean }> {
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, apnsConfigured: true };
  }
  const client = await getApnsClient();
  if (!client) {
    return {
      sent: 0,
      failed: tokens.length,
      apnsConfigured: false,
      firstError: "APNs not configured (missing APNS_KEY_BASE64/APNS_KEY_PATH, APNS_KEY_ID, APNS_TEAM_ID, or APNS_BUNDLE_ID)",
    };
  }
  let sent = 0;
  let failed = 0;
  let firstError: string | undefined;
  for (const deviceToken of tokens) {
    try {
      const notification = new ApnsNotification(deviceToken, {
        alert: { title, body },
        sound: "default",
        data: { deepLink },
      });
      await client.send(notification);
      sent += 1;
    } catch (err) {
      failed += 1;
      if (!firstError) {
        firstError = err instanceof ApnsError ? err.reason : (err instanceof Error ? err.message : String(err));
      }
    }
  }
  return { sent, failed, firstError, apnsConfigured: true };
}

// --- FCM ---

/** Trim and strip optional surrounding double quotes (e.g. from .env). */
function normalizeCredentialsPath(raw: string | undefined): string | null {
  if (raw == null || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const unquoted =
    trimmed.startsWith('"') && trimmed.endsWith('"')
      ? trimmed.slice(1, -1).trim()
      : trimmed;
  return unquoted.length > 0 ? unquoted : null;
}

/**
 * Normalize parsed service account JSON so cert() accepts it.
 * - Replaces literal \n in private_key with real newlines (common when stored in env or file).
 */
function normalizeServiceAccount(raw: Record<string, unknown>): ServiceAccount {
  const out = { ...raw };
  const key = out.private_key ?? out.privateKey;
  if (typeof key === "string") {
    out.private_key = key.replace(/\\n/g, "\n");
  }
  return out as ServiceAccount;
}

function getFcmMessaging(): {
  messaging: Messaging | null;
  configError?: string;
} {
  try {
    const existing = getApps().find(
      (a): a is App => (a as App).name === "push-fcm"
    );
    if (existing) return { messaging: getMessaging(existing) };
  } catch {
    // ignore
  }
  const creds = process.env.FCM_SERVICE_ACCOUNT_JSON;
  const path = normalizeCredentialsPath(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  if (creds) {
    try {
      const parsed = normalizeServiceAccount(JSON.parse(creds) as Record<string, unknown>);
      const app = initializeApp(
        { credential: cert(parsed) },
        "push-fcm"
      ) as App;
      return { messaging: getMessaging(app) };
    } catch (err) {
      return {
        messaging: null,
        configError:
          err instanceof Error ? err.message : String(err),
      };
    }
  }
  if (path) {
    let lastErr: string | undefined;
    try {
      const app = initializeApp(
        { credential: cert(path) },
        "push-fcm"
      ) as App;
      return { messaging: getMessaging(app) };
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
    try {
      const json = fs.readFileSync(path, "utf8");
      const parsed = normalizeServiceAccount(JSON.parse(json) as Record<string, unknown>);
      const app = initializeApp(
        { credential: cert(parsed) },
        "push-fcm"
      ) as App;
      return { messaging: getMessaging(app) };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        messaging: null,
        configError: `Path set but init failed. cert(path): ${lastErr ?? "?"}. readFile+cert: ${msg}`,
      };
    }
  }
  return {
    messaging: null,
    configError:
      "Neither FCM_SERVICE_ACCOUNT_JSON nor GOOGLE_APPLICATION_CREDENTIALS is set in this process (check env for the API route / server)",
  };
}

async function sendFcm(
  tokens: string[],
  title: string,
  body: string,
  deepLink: string,
  collection: string,
  key: string
): Promise<{
  sent: number;
  failed: number;
  fcmConfigured: boolean;
  firstError?: string;
}> {
  if (tokens.length === 0) {
    return { sent: 0, failed: 0, fcmConfigured: true };
  }
  const { messaging, configError } = getFcmMessaging();
  if (!messaging) {
    return {
      sent: 0,
      failed: tokens.length,
      fcmConfigured: false,
      firstError: configError ?? "FCM not configured",
    };
  }
  try {
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data: {
        deepLink,
        collection,
        key,
      },
    });
    let firstError: string | undefined;
    if (result.responses) {
      const failed = result.responses.find((r) => !r.success && r.error);
      if (failed?.error) {
        firstError =
          failed.error.code ?? failed.error.message ?? String(failed.error);
      }
    }
    return {
      sent: result.successCount,
      failed: result.failureCount,
      fcmConfigured: true,
      ...(firstError && { firstError }),
    };
  } catch (err) {
    return {
      sent: 0,
      failed: tokens.length,
      fcmConfigured: true,
      firstError: err instanceof Error ? err.message : String(err),
    };
  }
}

// --- Handler ---

export async function POST(req: NextRequest) {
  const secret = getAuthSecret(req);
  const expected = process.env.PUSH_SECRET;
  if (!expected || secret !== expected) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: PushRequestBody;
  try {
    const raw = await req.json();
    body = parseBody(raw) as PushRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }
  if (!body) {
    return NextResponse.json(
      { error: "Missing or invalid body fields" },
      { status: 400 }
    );
  }

  if (!isAllowedUrl(body.directusUrl)) {
    return NextResponse.json(
      { error: "directusUrl must be HTTPS or localhost" },
      { status: 400 }
    );
  }

  const getBody = () => {
    if (body.event?.endsWith("create")) return "Item created";
    if (body.event?.endsWith("update")) return "Item updated";
    if (body.event?.endsWith("delete")) return "Item deleted";
    return "Item";
  }

  const title = body.collection
    .replaceAll("_", " ")
    .split(" ")
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
  const bodyText = getBody();

  const deepLink = buildDeepLink(body.collection, body.key);

  const client = createClient(body.directusUrl, body.directusToken);
  let devices: AppPushDevice[];
  try {
    const raw = await client.request(
      readItems(COLLECTION as "app_push_devices", { limit: -1 })
    );
    if (Array.isArray(raw)) devices = raw as AppPushDevice[];
    else if (raw && typeof raw === "object" && Array.isArray((raw as { data?: unknown }).data))
      devices = (raw as { data: AppPushDevice[] }).data;
    else devices = [];
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch devices" },
      { status: 502 }
    );
  }

  const filtered = filterDevicesForEvent(
    devices,
    body.collection,
    body.action as PushAction
  );
  const { ios, android } = splitByPlatform(filtered);

  const bundleId =
    process.env.APNS_BUNDLE_ID ?? "com.martijnmichel.directusexpo";

  const [apnResult, fcmResult] = await Promise.all([
    sendApns(ios, title, bodyText, deepLink, bundleId),
    sendFcm(
      android,
      title,
      bodyText,
      deepLink,
      body.collection,
      body.key
    ),
  ]);

  const sent = apnResult.sent + fcmResult.sent;
  const failed = apnResult.failed + fcmResult.failed;

  return NextResponse.json({
    ok: true,
    sent,
    failed,
    ios: {
      sent: apnResult.sent,
      failed: apnResult.failed,
      configured: apnResult.apnsConfigured,
      ...(apnResult.firstError && { error: apnResult.firstError }),
    },
    android: {
      sent: fcmResult.sent,
      failed: fcmResult.failed,
      configured: fcmResult.fcmConfigured,
      ...(fcmResult.firstError && { error: fcmResult.firstError }),
    },
  });
}
