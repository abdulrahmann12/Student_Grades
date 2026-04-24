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
}

async function ensureSavedSubjectsFile() {
  try {
    await fs.access(savedSubjectsFilePath);
  } catch {
    await fs.writeFile(savedSubjectsFilePath, "[]\n", "utf8");
  }
}

async function readSavedSubjects() {
  await ensureSavedSubjectsFile();

  try {
    const rawFile = await fs.readFile(savedSubjectsFilePath, "utf8");
    const parsed = JSON.parse(rawFile || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeSavedSubjects(payload: unknown) {
  if (!Array.isArray(payload)) {
    throw new Error("Saved subjects payload must be an array.");
  }

  await ensureSavedSubjectsFile();
  await fs.writeFile(savedSubjectsFilePath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
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

async function getAuthConfig(): Promise<AuthConfig> {
  for (const envFilePath of envFileCandidates) {
    await loadEnvFile(envFilePath);
  }

  return {
    loginUrl: process.env.AUTH_LOGIN_URL?.trim() || defaultAuthLoginUrl,
    username: process.env.AUTH_USERNAME?.trim() || "",
    password: process.env.AUTH_PASSWORD?.trim() || "",
    tokenCacheFilePath: sharedTokenCacheFilePath,
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

async function readCachedToken(authConfig: AuthConfig) {
  try {
    const rawFile = await fs.readFile(authConfig.tokenCacheFilePath, "utf8");
    const parsed = JSON.parse(rawFile) as Record<string, unknown>;
    const token = typeof parsed.token === "string" ? parsed.token.trim() : "";

    if (!token) {
      return null;
    }

    const expiration =
      typeof parsed.exp === "number" && Number.isInteger(parsed.exp)
        ? parsed.exp
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
  await fs.writeFile(
    authConfig.tokenCacheFilePath,
    `${JSON.stringify({ token, refreshToken, exp }, null, 2)}\n`,
    "utf8",
  );
}

async function getAuthToken() {
  const authConfig = await getAuthConfig();
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

async function proxyGradesRequest(payload: unknown, apiUrl: string) {
  const token = await getAuthToken();

  return fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
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
        sendJson(response, 200, await readSavedSubjects());
        return;
      }

      if (request.method === "PUT") {
        const payload = await readJsonBody(request);
        sendJson(response, 200, await writeSavedSubjects(payload));
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

      const upstreamResponse = await proxyGradesRequest(payload, apiUrl);
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
  plugins: [react(), createSavedSubjectsPlugin(), createGradesProxyPlugin()],
});