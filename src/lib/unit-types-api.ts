import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";
import type { UnitType } from "./types";

export async function getUnitTypes(token: string): Promise<UnitType[]> {
  const response = await backendFetch("/api/properties/unit-types", token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
