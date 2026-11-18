const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export class ApiError extends Error {
  constructor(message, { status, fieldErrors } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors ?? {};
  }
}

async function sendRequest(path, { method, headers, body }) {
  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { method, headers, body });
  } catch {
    throw new ApiError("Cannot reach the server. Is the backend running?");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new ApiError(payload.message || `Request failed (${response.status})`, {
      status: response.status,
      fieldErrors: payload.errors
    });
  }

  return payload;
}

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = { Accept: "application/json" };

  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  return sendRequest(path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });
}

// Multipart upload; the browser sets the boundary, so no Content-Type header.
export async function apiUpload(path, { method = "POST", body, token } = {}) {
  const headers = { Accept: "application/json" };

  if (token) headers.Authorization = `Bearer ${token}`;

  return sendRequest(path, { method, headers, body });
}

export function fieldError(error, name) {
  const messages = error?.fieldErrors?.[name];

  return Array.isArray(messages) ? messages[0] : undefined;
}

// Photo paths come back as /uploads/...; prefix them when the API lives on a
// different origin from the web app.
export function mediaUrl(path) {
  if (!path || /^https?:\/\//i.test(path)) return path;

  return `${API_BASE_URL}${path}`;
}
