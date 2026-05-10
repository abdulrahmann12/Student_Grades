import { promises as fs } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));
const workspaceRoot = path.resolve(projectRoot, "..");
const savedSubjectsFilePath = path.resolve(projectRoot, "saved-subjects.json");
const sharedTokenCacheFilePath = path.resolve(workspaceRoot, "Codes", "token.json");
const envFileCandidates = [
  path.resolve(workspaceRoot, ".env"),
  path.resolve(workspaceRoot, "Codes", ".env"),
  path.resolve(projectRoot, ".env"),
];
const defaultAuthLoginUrl = "https://api.seu.edu.eg/api/auth/login";

interface AuthConfig {
  loginUrl: string;
  username: string;
  password: string;
  tokenCacheFilePath: string;
  accountKey: string;
}

interface AuthCredentials {
  username: string;
  password: string;
}

interface AuthAccountSummary {
  key: string;
  username: string;
}

interface SavedSubjectsStore {
  version: 2;
  accounts: Record<string, unknown[]>;
}

interface TokenCacheEntry {
  token: string;
  refreshToken: string;
  exp: number;
}

interface TokenCacheStore {
  version: 2;
  accounts: Record<string, TokenCacheEntry>;
}

function normalizeAccountKey(username: string) {
  return username.trim().toLowerCase() || "default";
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createEmptySavedSubjectsStore(): SavedSubjectsStore {
  return {
    version: 2,
    accounts: {},
  };
}

function createEmptyTokenCacheStore(): TokenCacheStore {
  return {
    version: 2,
    accounts: {},
  };
}

function getFallbackAccountKey(defaultAccount: AuthAccountSummary | null) {
  return defaultAccount?.key ?? "default";
}

async function ensureSavedSubjectsFile() {
  try {
    await fs.access(savedSubjectsFilePath);
  } catch {
    await fs.writeFile(
      savedSubjectsFilePath,
      `${JSON.stringify(createEmptySavedSubjectsStore(), null, 2)}\n`,
      "utf8",
    );
  }
}

function normalizeSavedSubjectsStore(
  parsed: unknown,
  defaultAccount: AuthAccountSummary | null,
): SavedSubjectsStore {
  if (Array.isArray(parsed)) {
    return {
      version: 2,
      accounts: {
        [getFallbackAccountKey(defaultAccount)]: parsed,
      },
    };
  }

  if (isObjectRecord(parsed) && isObjectRecord(parsed.accounts)) {
    const accounts = Object.entries(parsed.accounts).reduce<Record<string, unknown[]>>(
      (result, [key, value]) => {
        if (Array.isArray(value)) {
          result[normalizeAccountKey(key)] = value;
        }

        return result;
      },
      {},
    );

    return {
      version: 2,
      accounts,
    };
  }

  return createEmptySavedSubjectsStore();
}

async function readSavedSubjectsStore() {
  await ensureSavedSubjectsFile();

  try {
    const rawFile = await fs.readFile(savedSubjectsFilePath, "utf8");
    const parsed = JSON.parse(rawFile || "{}");
    const defaultAccount = await getDefaultAuthAccountSummary();
    return normalizeSavedSubjectsStore(parsed, defaultAccount);
  } catch {
    return createEmptySavedSubjectsStore();
  }
}

function validateAccountKey(accountKey: unknown) {
  if (typeof accountKey !== "string" || !accountKey.trim()) {
    throw new Error("An account key is required.");
  }

  return normalizeAccountKey(accountKey);
}

async function readSavedSubjects(accountKey: string) {
  const store = await readSavedSubjectsStore();
  return store.accounts[validateAccountKey(accountKey)] ?? [];
}

async function writeSavedSubjects(accountKey: string, presets: unknown) {
  if (!Array.isArray(presets)) {
    throw new Error("Saved subjects payload must be an array.");
  }

  const store = await readSavedSubjectsStore();
  store.accounts[validateAccountKey(accountKey)] = presets;
  await fs.writeFile(savedSubjectsFilePath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
  return presets;
}

async function readJsonBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const rawBody = Buffer.concat(chunks).toString("utf8").trim();
  return rawBody ? JSON.parse(rawBody) : null;
}

function sendJson(response: ServerResponse, statusCode: number, body: unknown) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

async function loadEnvFile(filePath: string) {
  try {
    const rawFile = await fs.readFile(filePath, "utf8");
    const lines = rawFile.split(/\r?\n/u);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#") || !line.includes("=")) {
        continue;
      }

      const separatorIndex = line.indexOf("=");
      const key = line.slice(0, separatorIndex).trim();
      const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/gu, "");

      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code !== "ENOENT") {
      throw error;
    }
  }
}

async function getDefaultAuthAccountSummary(): Promise<AuthAccountSummary | null> {
  for (const envFilePath of envFileCandidates) {
    await loadEnvFile(envFilePath);
  }

  const username = process.env.AUTH_USERNAME?.trim() || "";

  if (!username) {
    return null;
  }

  return {
    key: normalizeAccountKey(username),
    username,
  };
}

async function getAuthConfig(authOverride: AuthCredentials | null = null): Promise<AuthConfig> {
  for (const envFilePath of envFileCandidates) {
    await loadEnvFile(envFilePath);
  }

  const username = authOverride ? authOverride.username.trim() : process.env.AUTH_USERNAME?.trim() || "";
  const password = authOverride ? authOverride.password.trim() : process.env.AUTH_PASSWORD?.trim() || "";

  return {
    loginUrl: process.env.AUTH_LOGIN_URL?.trim() || defaultAuthLoginUrl,
    username,
    password,
    tokenCacheFilePath: sharedTokenCacheFilePath,
    accountKey: normalizeAccountKey(username),
  };
}

function decodeJwtPayload(token: string) {
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new Error("Authentication token is not a valid JWT.");
  }

  const payloadSegment = tokenParts[1].replace(/-/gu, "+").replace(/_/gu, "/");
  const padding = "=".repeat((4 - (payloadSegment.length % 4)) % 4);
  const decoded = Buffer.from(payloadSegment + padding, "base64").toString("utf8");
  const payload = JSON.parse(decoded) as Record<string, unknown>;

  if (!payload || typeof payload !== "object") {
    throw new Error("JWT payload must decode to an object.");
  }

  return payload;
}

function getTokenExpiration(token: string) {
  const expiration = decodeJwtPayload(token).exp;
  if (typeof expiration !== "number" || !Number.isInteger(expiration)) {
    throw new Error("Authentication token is missing a valid exp claim.");
  }

  return expiration;
}

function formatErrorBody(body: unknown) {
  return typeof body === "string" ? body || "No response body returned." : JSON.stringify(body, null, 2);
}

function normalizeTokenCacheStore(parsed: unknown, fallbackAccountKey: string): TokenCacheStore {
  if (isObjectRecord(parsed) && isObjectRecord(parsed.accounts)) {
    const accounts = Object.entries(parsed.accounts).reduce<Record<string, TokenCacheEntry>>(
      (result, [key, value]) => {
        if (!isObjectRecord(value)) {
          return result;
        }

        const token = typeof value.token === "string" ? value.token.trim() : "";
        const refreshToken = typeof value.refreshToken === "string" ? value.refreshToken.trim() : "";
        const exp =
          typeof value.exp === "number" && Number.isInteger(value.exp)
            ? value.exp
            : token
              ? getTokenExpiration(token)
              : 0;

        if (token && refreshToken && exp) {
          result[normalizeAccountKey(key)] = {
            token,
            refreshToken,
            exp,
          };
        }

        return result;
      },
      {},
    );

    return {
      version: 2,
      accounts,
    };
  }

  if (isObjectRecord(parsed)) {
    const token = typeof parsed.token === "string" ? parsed.token.trim() : "";
    const refreshToken = typeof parsed.refreshToken === "string" ? parsed.refreshToken.trim() : "";
    const exp =
      typeof parsed.exp === "number" && Number.isInteger(parsed.exp)
        ? parsed.exp
        : token
          ? getTokenExpiration(token)
          : 0;

    if (token && refreshToken && exp) {
      return {
        version: 2,
        accounts: {
          [fallbackAccountKey]: {
            token,
            refreshToken,
            exp,
          },
        },
      };
    }
  }

  return createEmptyTokenCacheStore();
}

async function readTokenCacheStore(authConfig: AuthConfig) {
  try {
    const rawFile = await fs.readFile(authConfig.tokenCacheFilePath, "utf8");
    const parsed = JSON.parse(rawFile || "{}");
    return normalizeTokenCacheStore(parsed, authConfig.accountKey);
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return createEmptyTokenCacheStore();
    }

    return createEmptyTokenCacheStore();
  }
}

async function readCachedToken(authConfig: AuthConfig) {
  try {
    const store = await readTokenCacheStore(authConfig);
    const cachedEntry = store.accounts[authConfig.accountKey];
    const token = typeof cachedEntry?.token === "string" ? cachedEntry.token.trim() : "";

    if (!token) {
      return null;
    }

    const expiration =
      typeof cachedEntry?.exp === "number" && Number.isInteger(cachedEntry.exp)
        ? cachedEntry.exp
        : getTokenExpiration(token);
    if (Math.floor(Date.now() / 1000) >= expiration) {
      return null;
    }

    return token;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return null;
    }

    return null;
  }
}

async function writeTokenCache(authConfig: AuthConfig, token: string, refreshToken: string, exp: number) {
  await fs.mkdir(path.dirname(authConfig.tokenCacheFilePath), { recursive: true });
  const store = await readTokenCacheStore(authConfig);
  store.accounts[authConfig.accountKey] = {
    token,
    refreshToken,
    exp,
  };
  await fs.writeFile(
    authConfig.tokenCacheFilePath,
    `${JSON.stringify(store, null, 2)}\n`,
    "utf8",
  );
}

async function getAuthToken(authOverride: AuthCredentials | null = null) {
  const authConfig = await getAuthConfig(authOverride);
  const cachedToken = await readCachedToken(authConfig);
  if (cachedToken) {
    return cachedToken;
  }

  if (!authConfig.username || !authConfig.password) {
    throw new Error(
      "Authentication credentials are missing. Set AUTH_USERNAME and AUTH_PASSWORD in the project .env file.",
    );
  }

  const loginResponse = await fetch(authConfig.loginUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: authConfig.username,
      password: authConfig.password,
    }),
  });

  const rawBody = await loginResponse.text();
  let parsedBody: unknown = rawBody;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = rawBody;
  }

  if (!loginResponse.ok) {
    throw new Error(
      `Authentication failed with status ${loginResponse.status}: ${formatErrorBody(parsedBody)}`,
    );
  }

  if (!parsedBody || typeof parsedBody !== "object") {
    throw new Error("Authentication response must be a JSON object.");
  }

  const authBody = parsedBody as Record<string, unknown>;
  const token = typeof authBody.token === "string" ? authBody.token.trim() : "";
  const refreshToken = typeof authBody.refreshToken === "string" ? authBody.refreshToken.trim() : "";

  if (authBody.valid === false) {
    throw new Error("Authentication failed: API returned valid=false.");
  }

  if (!token) {
    throw new Error("Authentication response did not include a token.");
  }

  if (!refreshToken) {
    throw new Error("Authentication response did not include a refreshToken.");
  }

  const exp = getTokenExpiration(token);
  await writeTokenCache(authConfig, token, refreshToken, exp);
  return token;
}

function parseAuthOverride(value: unknown): AuthCredentials | null {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  if (!isObjectRecord(value)) {
    throw new Error("Authentication override must be an object.");
  }

  const username = typeof value.username === "string" ? value.username.trim() : "";
  const password = typeof value.password === "string" ? value.password.trim() : "";

  if (!username || !password) {
    throw new Error("Both username and password are required for a saved local account.");
  }

  return {
    username,
    password,
  };
}

function validateApiUrl(apiUrl: unknown): string {
  if (typeof apiUrl !== "string" || !apiUrl.trim()) {
    throw new Error("A target API URL is required.");
  }

  const parsedUrl = new URL(apiUrl);
  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    throw new Error("The target API URL must start with http:// or https://.");
  }

  return parsedUrl.toString();
}

async function proxyGradesRequest(
  payload: unknown,
  apiUrl: string,
  authOverride: AuthCredentials | null,
) {
  const token = await getAuthToken(authOverride);

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
}

async function getRequestedAccountKey(requestUrl: URL) {
  const requestedAccountKey = requestUrl.searchParams.get("accountKey");

  if (requestedAccountKey) {
    return validateAccountKey(requestedAccountKey);
  }

  return getFallbackAccountKey(await getDefaultAuthAccountSummary());
}

function createAccountsPlugin(): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== "/api/accounts/default") {
      next();
      return;
    }

    try {
      if (request.method !== "GET") {
        response.setHeader("Allow", "GET");
        sendJson(response, 405, { message: "Method not allowed." });
        return;
      }

      sendJson(response, 200, await getDefaultAuthAccountSummary());
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected account lookup error.";
      sendJson(response, 500, { message });
    }
  };

  return {
    name: "default-account-api",
    configureServer(server) {
      server.middlewares.use(handleRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest);
    },
  };
}

function createSavedSubjectsPlugin(): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== "/api/saved-subjects") {
      next();
      return;
    }

    try {
      if (request.method === "GET") {
        sendJson(response, 200, await readSavedSubjects(await getRequestedAccountKey(requestUrl)));
        return;
      }

      if (request.method === "PUT") {
        const payload = await readJsonBody(request);

        if (Array.isArray(payload)) {
          sendJson(
            response,
            200,
            await writeSavedSubjects(getFallbackAccountKey(await getDefaultAuthAccountSummary()), payload),
          );
          return;
        }

        const accountKey =
          payload && typeof payload === "object"
            ? (payload as { accountKey?: unknown }).accountKey
            : undefined;
        const presets =
          payload && typeof payload === "object"
            ? (payload as { presets?: unknown }).presets
            : undefined;
        sendJson(
          response,
          200,
          await writeSavedSubjects(
            typeof accountKey === "string"
              ? accountKey
              : getFallbackAccountKey(await getDefaultAuthAccountSummary()),
            presets,
          ),
        );
        return;
      }

      response.setHeader("Allow", "GET, PUT");
      sendJson(response, 405, { message: "Method not allowed." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected preset storage error.";
      sendJson(response, 500, { message });
    }
  };

  return {
    name: "saved-subjects-file-api",
    configureServer(server) {
      server.middlewares.use(handleRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest);
    },
  };
}

function createGradesProxyPlugin(): Plugin {
  const handleRequest = async (
    request: IncomingMessage,
    response: ServerResponse,
    next: (error?: unknown) => void,
  ) => {
    const requestUrl = new URL(request.url ?? "/", "http://localhost");

    if (requestUrl.pathname !== "/api/grades") {
      next();
      return;
    }

    try {
      if (request.method !== "POST") {
        response.setHeader("Allow", "POST");
        sendJson(response, 405, { message: "Method not allowed." });
        return;
      }

      const body = await readJsonBody(request);
      const payload = body && typeof body === "object" ? (body as { payload?: unknown }).payload : undefined;
      const apiUrl = validateApiUrl(
        body && typeof body === "object" ? (body as { apiUrl?: unknown }).apiUrl : undefined,
      );
      const authOverride = parseAuthOverride(
        body && typeof body === "object" ? (body as { auth?: unknown }).auth : undefined,
      );

      const upstreamResponse = await proxyGradesRequest(payload, apiUrl, authOverride);
      const rawBody = await upstreamResponse.text();
      const contentType = upstreamResponse.headers.get("content-type");

      response.statusCode = upstreamResponse.status;
      if (contentType) {
        response.setHeader("Content-Type", contentType);
      }
      response.end(rawBody);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unexpected grades proxy error.";
      sendJson(response, 500, { message });
    }
  };

  return {
    name: "grades-auth-proxy-api",
    configureServer(server) {
      server.middlewares.use(handleRequest);
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleRequest);
    },
  };
}

export default defineConfig({
  plugins: [react(), createAccountsPlugin(), createSavedSubjectsPlugin(), createGradesProxyPlugin()],
});