import { backendFetch } from "./api-client";
import { extractApiError } from "./api-error";
import type { PropertyType } from "./types";

export async function getPropertyTypes(token: string): Promise<PropertyType[]> {
  const response = await backendFetch("/properties/property-types", token);
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return response.json();
}
