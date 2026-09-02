import { API_BASE_URL, InvalidRefreshTokenError } from "./api-client";
import { extractErrorMessage } from "./api-error";
import type { SessionUser } from "./types";

function toSessionUser(data: any): SessionUser {
  return {
    id: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.roles[0],
    token: data.token,
    refreshToken: data.refreshToken,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<SessionUser> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return toSessionUser(await response.json());
}

export async function refreshAccessToken(
  refreshToken: string,
): Promise<SessionUser> {
  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ RefreshToken: refreshToken }),
  });

  if (response.status === 401) {
    throw new InvalidRefreshTokenError();
  }
  if (!response.ok) {
    throw new Error("Unable to refresh session. Please try again.");
  }

  return toSessionUser(await response.json());
}

export async function logout(refreshToken: string): Promise<void> {
  await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ RefreshToken: refreshToken }),
  }).catch(() => {
    // Best-effort: local sign-out proceeds even if the server call fails.
  });
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}