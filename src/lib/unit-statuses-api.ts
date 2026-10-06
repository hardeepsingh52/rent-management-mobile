import { backendFetch } from "./api-client";
import { extractApiError } from "./api-error";

export async function getUnitStatuses(token: string): Promise<string[]> {
  const response = await backendFetch("/properties/unit-statuses", token);
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return response.json();
}
