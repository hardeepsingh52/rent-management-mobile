import { backendFetch } from "./api-client";
import { extractApiError } from "./api-error";
import type { TenantTenancy } from "./types";

// TEMP: shown while GET /tenants/me/tenancies isn't deployed to the backend
// yet (it 404s). Remove this and the 404 fallback below once it is live.
export const SAMPLE_TENANCIES: TenantTenancy[] = [
  {
    tenancyId: -1,
    status: "Active",
    startDate: "2026-10-05T00:00:00Z",
    endDate: null,
    unit: {
      unitId: -1,
      label: "Basement unit",
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 850,
      rent: 1450,
    },
    property: {
      propertyId: -1,
      name: "Maple Street Duplex",
      line1: "123 Maple Street",
      line2: null,
      city: "Winnipeg",
      region: "MB",
      postalCode: "R3C 1A1",
    },
    landlord: {
      name: "Sample Landlord",
      businessName: null,
      email: "landlord@example.com",
    },
  },
  {
    tenancyId: -2,
    status: "Ended",
    startDate: "2025-01-03T00:00:00Z",
    endDate: "2026-09-30T00:00:00Z",
    unit: {
      unitId: -2,
      label: "Unit 2",
      bedrooms: null,
      bathrooms: null,
      squareFeet: null,
      rent: null,
    },
    property: {
      propertyId: -2,
      name: "Riverside Townhome",
      line1: "456 River Ave",
      line2: null,
      city: "Winnipeg",
      region: "MB",
      postalCode: "R2M 0A1",
    },
    landlord: null,
  },
];

export async function getMyTenancies(token: string): Promise<TenantTenancy[]> {
  const response = await backendFetch("/tenants/me/tenancies", token);
  if (response.status === 404) {
    return SAMPLE_TENANCIES;
  }
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return response.json();
}
