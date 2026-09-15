import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";
import type { CreateTenantInviteResult } from "./types";

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
