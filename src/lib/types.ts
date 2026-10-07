export type AppRole = "Admin" | "Landlord" | "Tenant" | "Contractor";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: AppRole;
  token: string;
  refreshToken: string;
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

export interface MediaItem {
  id: number;
  url: string;
  sortOrder: number;
  isCover: boolean;
}

export interface CreateTenantInviteResult {
  token: string;
  inviteUrl: string;
  expiresAt: string;
}

export interface RegisterUserInput {
  fullName: string;
  email: string;
  password: string;
  userType: "Landlord" | "Contractor";
}

export interface UpdateUnitInput extends CreateUnitInput {
  status: string;
}

export type TenantInviteStatus =
  | "Pending"
  | "Accepted"
  | "Declined"
  | "Expired";

export interface TenantInviteListItem {
  id: number;
  email: string;
  unitLabel: string;
  propertyName: string;
  createdAt: string;
  expiresAt: string;
  status: TenantInviteStatus;
}

export interface TenantInviteStats {
  sent: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string;
  data: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface TwoFactorChallenge {
  setupRequired: boolean;
  twoFactorToken: string;
}

export interface TwoFactorEnrollment {
  sharedKey: string;
  authenticatorUri: string;
}

export interface TwoFactorEnabled {
  session: SessionUser;
  recoveryCodes: string[];
}

export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

export interface TenantTenancy {
  tenancyId: number;
  status: "Active" | "Ended";
  startDate: string;
  endDate: string | null;
  unit: {
    unitId: number;
    label: string;
    bedrooms: number | null;
    bathrooms: number | null;
    squareFeet: number | null;
    rent: number | null;
  };
  property: {
    propertyId: number;
    name: string;
    line1: string;
    line2: string | null;
    city: string;
    region: string;
    postalCode: string;
  };
  landlord: {
    name: string;
    businessName: string | null;
    email: string | null;
  } | null;
}
