import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";

import type {
  CreateTenantInviteResult,
  TenantInviteListItem,
  TenantInviteStats,
} from "./types";

export async function createTenantInvite(
  email: string,
  unitId: number,
  token: string,
): Promise<CreateTenantInviteResult> {
  const response = await backendFetch("/auth/tenant-invites", token, {
    method: "POST",
    body: JSON.stringify({ Email: email, UnitId: unitId }),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function getMyTenantInvites(
  token: string,
): Promise<TenantInviteListItem[]> {
  const response = await backendFetch("/auth/tenant-invites", token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function getTenantInviteStats(
  token: string,
): Promise<TenantInviteStats> {
  const response = await backendFetch("/auth/tenant-invites/stats", token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function resendTenantInvite(
  id: number,
  token: string,
): Promise<CreateTenantInviteResult> {
  const response = await backendFetch(
    `/auth/tenant-invites/${id}/resend`,
    token,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
