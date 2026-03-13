import {
  createDirectus,
  readItems,
  rest,
  staticToken,
} from "@directus/sdk";
import apn from "apn";
import { getApps, cert, type App } from "firebase-admin/app";
import { getMessaging, type Messaging } from "firebase-admin/messaging";
import { initializeApp, type ServiceAccount } from "firebase-admin";
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

// --- APNs ---

let apnProvider: apn.Provider | null = null;

function getApnProvider(): apn.Provider | null {
  if (apnProvider) return apnProvider;
  const keyBase64 = process.env.APNS_KEY_BASE64;
  const keyPath = process.env.APNS_KEY_PATH;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const bundleId = process.env.APNS_BUNDLE_ID;
  if (!bundleId || !keyId || !teamId) return null;
  let key: Buffer | string | undefined;
  if (keyBase64) {
    try {
      key = Buffer.from(keyBase64, "base64");
    } catch {
      key = undefined;
    }
  } else if (keyPath) {
    key = keyPath;
  }
  if (!key) return null;
  apnProvider = new apn.Provider({
    token: { key, keyId, teamId },
    production: process.env.NODE_ENV === "production",
  });
  return apnProvider;
}

async function sendApns(
  tokens: string[],
  title: string,
  body: string,
  deepLink: string,
  bundleId: string
): Promise<{ sent: number; failed: number }> {
  if (tokens.length === 0) return { sent: 0, failed: 0 };
  const provider = getApnProvider();
  if (!provider) {
    return { sent: 0, failed: tokens.length };
  }
  const notification = new apn.Notification();
  notification.topic = bundleId;
  notification.alert = { title, body };
  notification.sound = "default";
  notification.payload = { deepLink };
  const result = await provider.send(notification, tokens);
  return {
    sent: result.sent.length,
    failed: result.failed.length,
  };
}

// --- FCM ---

function getFcmMessaging(): Messaging | null {
  try {
    const existing = getApps().find(
      (a): a is App => (a as App).name === "push-fcm"
    );
    if (existing) return getMessaging(existing);
  } catch {
    // ignore
  }
  const creds = process.env.FCM_SERVICE_ACCOUNT_JSON;
  const path = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (creds) {
    try {
      const parsed = JSON.parse(creds) as ServiceAccount;
      const app = initializeApp(
        { credential: cert(parsed) },
        "push-fcm"
      ) as App;
      return getMessaging(app);
    } catch {
      return null;
    }
  }
  if (path) {
    try {
      const app = initializeApp(
        { credential: cert(path) },
        "push-fcm"
      ) as App;
      return getMessaging(app);
    } catch {
      return null;
    }
  }
  return null;
}

async function sendFcm(
  tokens: string[],
  title: string,
  body: string,
  deepLink: string,
  collection: string,
  key: string
): Promise<{ sent: number; failed: number }> {
  if (tokens.length === 0) return { sent: 0, failed: 0 };
  const messaging = getFcmMessaging();
  if (!messaging) return { sent: 0, failed: tokens.length };
  const result = await messaging.sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: {
      deepLink,
      collection,
      key,
    },
  });
  return {
    sent: result.successCount,
    failed: result.failureCount,
  };
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

  const title =
    body.payload?.title ?? `Item ${body.action}d`;
  const bodyText =
    body.payload?.body ?? `${body.collection} #${body.key}`;
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
    body.action
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
    ios: { sent: apnResult.sent, failed: apnResult.failed },
    android: { sent: fcmResult.sent, failed: fcmResult.failed },
  });
}
