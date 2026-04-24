import type { ApiConfigForm, ApiSuccessResponse, GradesPayload } from "../types";

export class ApiServiceError extends Error {
  readonly status?: number;
  readonly responseBody: unknown;

  constructor(message: string, status?: number, responseBody: unknown = null) {
    super(message);
    this.name = "ApiServiceError";
    this.status = status;
    this.responseBody = responseBody;
  }
}

export async function postGrades(payload: GradesPayload, api: ApiConfigForm): Promise<ApiSuccessResponse> {
  let response: Response;

  try {
    response = await fetch("/api/grades", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiUrl: api.url,
        payload,
      }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown network error.";
    throw new ApiServiceError(`Network error while contacting the local auth proxy: ${message}`);
  }

  const rawBody = await response.text();
  let parsedBody: unknown = rawBody;

  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    parsedBody = rawBody;
  }

  if (!response.ok) {
    const errorText =
      typeof parsedBody === "string"
        ? parsedBody || "No error body returned."
        : JSON.stringify(parsedBody, null, 2);

    throw new ApiServiceError(
      `API request failed with status ${response.status}: ${errorText}`,
      response.status,
      parsedBody,
    );
  }

  return {
    status: response.status,
    data: parsedBody,
  };
}