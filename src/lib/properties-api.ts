import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";
import type { CreatePropertyInput, CreateUnitInput, Property } from "./types";

export async function getMyProperties(token: string): Promise<Property[]> {
  const response = await backendFetch("/properties/mine", token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function getProperty(
  id: string,
  token: string,
): Promise<Property> {
  const response = await backendFetch(`/properties/${id}`, token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

export async function createProperty(
  input: CreatePropertyInput,
  token: string,
): Promise<void> {
  const response = await backendFetch("/properties", token, {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function createUnit(
  propertyId: string,
  input: CreateUnitInput,
  token: string,
): Promise<void> {
  const response = await backendFetch(
    `/properties/${propertyId}/units`,
    token,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}
