import { API_BASE_URL, backendFetch, InvalidRefreshTokenError } from "./api-client";
import { extractApiError } from "./api-error";
import type {
  RegisterUserInput,
  SessionUser,
  TwoFactorChallenge,
  TwoFactorEnabled,
  TwoFactorEnrollment,
  TwoFactorStatus,
} from "./types";

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

function toTwoFactorChallenge(data: any): TwoFactorChallenge {
  return {
    setupRequired: data.setupRequired,
    twoFactorToken: data.twoFactorToken,
  };
}

function toTwoFactorEnrollment(data: any): TwoFactorEnrollment {
  return {
    sharedKey: data.sharedKey,
    authenticatorUri: data.authenticatorUri,
  };
}

function toTwoFactorEnabled(data: any): TwoFactorEnabled {
  return {
    session: toSessionUser(data.auth),
    recoveryCodes: data.recoveryCodes,
  };
}

export async function login(
  email: string,
  password: string,
): Promise<TwoFactorChallenge> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Email: email, Password: password }),
  });

  if (!response.ok) {
    throw await extractApiError(response);
  }

  return toTwoFactorChallenge(await response.json());
}

export async function beginTwoFactorSetup(
  twoFactorToken: string,
): Promise<TwoFactorEnrollment> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/setup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ TwoFactorToken: twoFactorToken }),
  });

  if (!response.ok) {
    throw await extractApiError(response);
  }

  return toTwoFactorEnrollment(await response.json());
}

export async function enableTwoFactor(
  twoFactorToken: string,
  code: string,
): Promise<TwoFactorEnabled> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/enable`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ TwoFactorToken: twoFactorToken, Code: code }),
  });

  if (!response.ok) {
    throw await extractApiError(response);
  }

  return toTwoFactorEnabled(await response.json());
}

export async function verifyTwoFactor(
  twoFactorToken: string,
  code: string,
): Promise<SessionUser> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ TwoFactorToken: twoFactorToken, Code: code }),
  });

  if (!response.ok) {
    throw await extractApiError(response);
  }

  return toSessionUser(await response.json());
}

export async function recoveryLogin(
  twoFactorToken: string,
  recoveryCode: string,
): Promise<SessionUser> {
  const response = await fetch(`${API_BASE_URL}/auth/2fa/recovery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      TwoFactorToken: twoFactorToken,
      RecoveryCode: recoveryCode,
    }),
  });

  if (!response.ok) {
    throw await extractApiError(response);
  }

  return toSessionUser(await response.json());
}

export async function getTwoFactorStatus(
  token: string,
): Promise<TwoFactorStatus> {
  const response = await backendFetch("/auth/2fa/status", token);
  if (!response.ok) {
    throw await extractApiError(response);
  }
  const data = await response.json();
  return { enabled: data.enabled, recoveryCodesRemaining: data.recoveryCodesRemaining };
}

export async function regenerateRecoveryCodes(
  code: string,
  token: string,
): Promise<string[]> {
  const response = await backendFetch(
    "/auth/2fa/recovery-codes/regenerate",
    token,
    { method: "POST", body: JSON.stringify({ Code: code }) },
  );
  if (!response.ok) {
    throw await extractApiError(response);
  }
  const data = await response.json();
  return data.recoveryCodes;
}

export async function startAuthenticatorReplacement(
  password: string,
  codeOrRecovery: { code?: string; recoveryCode?: string },
  token: string,
): Promise<TwoFactorEnrollment> {
  const response = await backendFetch("/auth/2fa/replace/start", token, {
    method: "POST",
    body: JSON.stringify({
      Password: password,
      Code: codeOrRecovery.code,
      RecoveryCode: codeOrRecovery.recoveryCode,
    }),
  });
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return toTwoFactorEnrollment(await response.json());
}

export async function confirmAuthenticatorReplacement(
  code: string,
  token: string,
): Promise<TwoFactorEnabled> {
  const response = await backendFetch("/auth/2fa/replace/confirm", token, {
    method: "POST",
    body: JSON.stringify({ Code: code }),
  });
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return toTwoFactorEnabled(await response.json());
}

export async function register(input: RegisterUserInput): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Email: input.email,
      FullName: input.fullName,
      Password: input.password,
      UserType: input.userType,
    }),
  });

  if (!response.ok) {
    throw await extractApiError(response);
  }
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
    throw await extractApiError(response);
  }
}