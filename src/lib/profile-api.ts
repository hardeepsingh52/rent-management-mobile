import { backendFetch } from "./api-client";
import { extractApiError } from "./api-error";
import type { UserProfile } from "./types";

export async function getMyProfile(token: string): Promise<UserProfile> {
  const response = await backendFetch("/auth/profile", token);
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return response.json();
}

export async function updateMyProfile(
  input: { firstName: string; middleName: string; lastName: string },
  token: string,
): Promise<UserProfile> {
  const response = await backendFetch("/auth/profile", token, {
    method: "PUT",
    body: JSON.stringify({
      FirstName: input.firstName,
      MiddleName: input.middleName === "" ? null : input.middleName,
      LastName: input.lastName,
    }),
  });
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return response.json();
}
