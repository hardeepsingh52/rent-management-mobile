const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL;
export const API_BASE_URL = `${BACKEND_URL}/api/v1`;

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void): void {
  onUnauthorized = handler;
}

export async function backendFetch(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init?.headers,
    },
  });

  if (response.status === 401) {
    onUnauthorized?.();
  }

  return response;
}