export type AppRole = "Admin" | "Landlord" | "Tenant" | "Contractor";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  token: string;
}

export interface Unit {
  id: number;
  label: string;
  unitType: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
  status: string;
}

export interface Property {
  id: number;
  name: string;
  propertyType: string;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  units: Unit[];
}

export interface PropertyType {
  id: number;
  name: string;
}

export interface CreatePropertyInput {
  name: string;
  propertyTypeId: number;
  line1: string;
  line2: string | null;
  city: string;
  region: string;
  postalCode: string;
  country: string;
}

export interface UnitType {
  id: number;
  name: string;
}

export interface CreateUnitInput {
  unitTypeId: number;
  label: string;
  bedrooms: number;
  bathrooms: number;
  squareFeet: number;
  askingRent: number;
}
