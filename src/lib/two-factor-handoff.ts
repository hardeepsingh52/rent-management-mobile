let pendingTwoFactorToken: string | null = null;

export function setPendingTwoFactorToken(token: string): void {
  pendingTwoFactorToken = token;
}

export function getPendingTwoFactorToken(): string | null {
  return pendingTwoFactorToken;
}

export function clearPendingTwoFactorToken(): void {
  pendingTwoFactorToken = null;
}