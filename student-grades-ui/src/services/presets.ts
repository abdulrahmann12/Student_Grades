import type { SavedSubjectPreset } from "../types";

const SAVED_SUBJECTS_ENDPOINT = "/api/saved-subjects";

async function parseResponseBody(response: Response) {
  const rawBody = await response.text();

  if (!rawBody) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return rawBody;
  }
}

function buildErrorMessage(status: number, body: unknown) {
  if (typeof body === "string") {
    return body || "No error body returned.";
  }

  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return `Unexpected preset storage response (status ${status}).`;
}

async function requestSavedSubjectPresets(init?: RequestInit) {
  let response: Response;

  try {
    response = await fetch(SAVED_SUBJECTS_ENDPOINT, init);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error.";
    throw new Error(`Unable to reach the saved subjects file service: ${message}`);
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    throw new Error(buildErrorMessage(response.status, body));
  }

  if (!Array.isArray(body)) {
    throw new Error("Saved subjects response was malformed.");
  }

  return body as SavedSubjectPreset[];
}

export function fetchSavedSubjectPresets() {
  return requestSavedSubjectPresets({
    method: "GET",
    cache: "no-store",
  });
}

export function saveSavedSubjectPresets(presets: SavedSubjectPreset[]) {
  return requestSavedSubjectPresets({
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(presets),
  });
}