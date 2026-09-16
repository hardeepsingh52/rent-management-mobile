import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";

export async function getUnitStatuses(token: string): Promise<string[]> {
  const response = await backendFetch("/properties/unit-statuses", token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
