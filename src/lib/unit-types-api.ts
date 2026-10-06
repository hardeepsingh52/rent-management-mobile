import { backendFetch } from "./api-client";
import { extractApiError } from "./api-error";
import type { UnitType } from "./types";

export async function getUnitTypes(token: string): Promise<UnitType[]> {
  const response = await backendFetch("/properties/unit-types", token);
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return response.json();
}
