import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";
import type {
  CreatePropertyInput,
  CreateUnitInput,
  Property,
  UpdateUnitInput,
} from "./types";

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

export async function updateProperty(
  id: string,
  input: CreatePropertyInput,
  token: string,
): Promise<void> {
  const response = await backendFetch(`/properties/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function archiveProperty(
  id: string,
  token: string,
): Promise<void> {
  const response = await backendFetch(`/properties/${id}/archive`, token, {
    method: "POST",
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function updateUnit(
  unitId: string,
  input: UpdateUnitInput,
  token: string,
): Promise<void> {
  const response = await backendFetch(`/properties/units/${unitId}`, token, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}

export async function archiveUnit(
  unitId: string,
  token: string,
): Promise<void> {
  const response = await backendFetch(
    `/properties/units/${unitId}/archive`,
    token,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}
