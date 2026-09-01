import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";
import type { PropertyType } from "./types";

export async function getPropertyTypes(token: string): Promise<PropertyType[]> {
  const response = await backendFetch("/properties/property-types", token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}
