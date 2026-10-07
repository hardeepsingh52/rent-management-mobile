import { useQuery } from "@tanstack/react-query";
import { getPropertyMedia, getUnitMedia } from "./media-api";
import {
  getMyNotifications,
  getUnreadNotificationCount,
} from "./notifications-api";
import { getMyProperties, getProperty } from "./properties-api";
import { getPropertyTypes } from "./property-types-api";
import { useSession } from "./session-context";
import { getMyTenancies } from "./tenant-api";
import { getUnitStatuses } from "./unit-statuses-api";
import { getUnitTypes } from "./unit-types-api";

// Query keys are scoped by user id (not token, which changes on every refresh).
// Invalidating a prefix such as ["properties"] refreshes everything beneath it.

// Lookup lists (types, statuses) almost never change, so cache them longer.
const LOOKUP_STALE_TIME = 10 * 60_000;

export function usePropertiesQuery() {
  const user = useSession();
  return useQuery({
    queryKey: ["properties", user.id],
    queryFn: () => getMyProperties(user.token),
  });
}

export function useMyTenanciesQuery() {
  const user = useSession();
  return useQuery({
    queryKey: ["tenancies", user.id],
    queryFn: () => getMyTenancies(user.token),
  });
}

export function usePropertyQuery(id: string) {
  const user = useSession();
  return useQuery({
    queryKey: ["properties", user.id, "detail", id],
    queryFn: () => getProperty(id, user.token),
  });
}

export function usePropertyMediaQuery(id: string) {
  const user = useSession();
  return useQuery({
    queryKey: ["media", user.id, "property", id],
    queryFn: () => getPropertyMedia(id, user.token),
  });
}

export function useUnitMediaQuery(unitId: string) {
  const user = useSession();
  return useQuery({
    queryKey: ["media", user.id, "unit", unitId],
    queryFn: () => getUnitMedia(unitId, user.token),
  });
}

export function usePropertyTypesQuery() {
  const user = useSession();
  return useQuery({
    queryKey: ["lookups", "property-types"],
    queryFn: () => getPropertyTypes(user.token),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function useUnitTypesQuery() {
  const user = useSession();
  return useQuery({
    queryKey: ["lookups", "unit-types"],
    queryFn: () => getUnitTypes(user.token),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function useUnitStatusesQuery() {
  const user = useSession();
  return useQuery({
    queryKey: ["lookups", "unit-statuses"],
    queryFn: () => getUnitStatuses(user.token),
    staleTime: LOOKUP_STALE_TIME,
  });
}

export function useNotificationsQuery() {
  const user = useSession();
  return useQuery({
    queryKey: ["notifications", "list", user.id],
    queryFn: () => getMyNotifications(user.token),
    staleTime: 0,
  });
}

export function useUnreadCountQuery() {
  const user = useSession();
  return useQuery({
    queryKey: ["notifications", "unread", user.id],
    queryFn: () => getUnreadNotificationCount(user.token),
    staleTime: 0,
  });
}
