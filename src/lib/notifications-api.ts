import { backendFetch } from "./api-client";
import { extractApiError } from "./api-error";
import type { NotificationItem } from "./types";

export async function getMyNotifications(
  token: string,
  unreadOnly = false,
): Promise<NotificationItem[]> {
  const response = await backendFetch(
    `/notifications${unreadOnly ? "?unreadOnly=true" : ""}`,
    token,
  );
  if (!response.ok) {
    throw await extractApiError(response);
  }
  return response.json();
}

export async function getUnreadNotificationCount(
  token: string,
): Promise<number> {
  const response = await backendFetch("/notifications/unread-count", token);
  if (!response.ok) {
    throw await extractApiError(response);
  }
  const data = await response.json();
  return data.count;
}

export async function markNotificationRead(
  id: number,
  token: string,
): Promise<void> {
  const response = await backendFetch(`/notifications/${id}/read`, token, {
    method: "POST",
  });
  if (!response.ok) {
    throw await extractApiError(response);
  }
}

export async function registerDeviceToken(
  deviceToken: string,
  platform: "ios" | "android",
  token: string,
): Promise<void> {
  const response = await backendFetch("/notifications/device-token", token, {
    method: "POST",
    body: JSON.stringify({ Token: deviceToken, Platform: platform }),
  });
  if (!response.ok) {
    throw await extractApiError(response);
  }
}

export async function markAllNotificationsRead(token: string): Promise<void> {
  const response = await backendFetch("/notifications/read-all", token, {
    method: "POST",
  });
  if (!response.ok) {
    throw await extractApiError(response);
  }
}
