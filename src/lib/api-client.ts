const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL;
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid or expired refresh token.");
    this.name = "InvalidRefreshTokenError";
  }
}

let onUnauthorized: (() => void) | null = null;
let onTokenRefresh: (() => Promise<string>) | null = null;
let refreshPromise: Promise<string> | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export function setTokenRefreshHandler(handler: () => Promise<string>): void {
  onTokenRefresh = handler;
}

function refreshOnce(): Promise<string> {
  if (!onTokenRefresh) {
    return Promise.reject(new Error("No token refresh handler registered."));
  }
  if (!refreshPromise) {
    refreshPromise = onTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

function buildHeaders(token: string, init?: RequestInit): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    ...init?.headers,
  };
}

export async function backendFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: buildHeaders(token, init),
  });

  if (response.status !== 401) {
    return response;
  }

  try {
    const freshToken = await refreshOnce();
    const retryResponse = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: buildHeaders(freshToken, init),
    });
    if (retryResponse.status === 401) {
      onUnauthorized?.();
    }
    return retryResponse;
  } catch (err) {
    if (err instanceof InvalidRefreshTokenError) {
      onUnauthorized?.();
    }
    return response;
  }
}