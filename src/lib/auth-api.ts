import { extractErrorMessage } from "./api-error";
import type { SessionUser } from "./types";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_API_URL;

export async function login(
  email: string,
  password: string,
): Promise<SessionUser> {
  const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  const data = await response.json();
  return {
    id: data.userId,
    email: data.email,
    fullName: data.fullName,
    role: data.roles[0],
    token: data.token,
  };
}

export async function forgotPassword(email: string): Promise<void> {
  const response = await fetch(`${BACKEND_URL}/api/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}
