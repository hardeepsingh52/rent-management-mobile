import { File } from "expo-file-system";
import { Platform } from "react-native";
import { backendFetch } from "./api-client";
import { extractErrorMessage } from "./api-error";
import type { MediaItem } from "./types";

const EXTENSION_BY_MIME_TYPE: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

interface PickedPhoto {
  uri: string;
  mimeType?: string | null;
  file?: Blob | null; // web only: the browser File/Blob ImagePicker returns there
}

async function getMedia(basePath: string, token: string): Promise<MediaItem[]> {
  const response = await backendFetch(`${basePath}/media`, token);
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
  return response.json();
}

async function uploadOnePhoto(
  basePath: string,
  photo: PickedPhoto,
  sortOrder: number,
  token: string,
): Promise<void> {
  const mimeType = photo.mimeType ?? "image/jpeg";
  const fileExtension = EXTENSION_BY_MIME_TYPE[mimeType] ?? ".jpg";

  const uploadUrlResponse = await backendFetch(
    `${basePath}/media/upload-url`,
    token,
    {
      method: "POST",
      body: JSON.stringify({ fileExtension }),
    },
  );
  if (!uploadUrlResponse.ok) {
    throw new Error(await extractErrorMessage(uploadUrlResponse));
  }
  const { blobPath, uploadUrl } = await uploadUrlResponse.json();

  // Azure Blob's "Put Blob" requires x-ms-blob-type on a direct SAS upload.
  // On native, expo-file-system's File.upload() sends the raw bytes as the body
  // (BINARY_CONTENT, the default - not a multipart wrapper). expo-file-system's
  // File class is Android/iOS/tvOS only per its own docs - web isn't supported -
  // so web uses a plain fetch with the browser File/Blob that ImagePicker already
  // hands back in `photo.file` on that platform.
  if (Platform.OS === "web") {
    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": mimeType,
      },
      body: photo.file as Blob,
    });
    if (!response.ok) {
      throw new Error("Photo upload failed. Please try again.");
    }
  } else {
    const file = new File(photo.uri);
    const result = await file.upload(uploadUrl, {
      httpMethod: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": mimeType,
      },
    });
    if (result.status < 200 || result.status >= 300) {
      throw new Error("Photo upload failed. Please try again.");
    }
  }

  const addResponse = await backendFetch(`${basePath}/media`, token, {
    method: "POST",
    body: JSON.stringify({ blobPath, sortOrder }),
  });
  if (!addResponse.ok) {
    throw new Error(await extractErrorMessage(addResponse));
  }
}

async function uploadPhotos(
  basePath: string,
  photos: PickedPhoto[],
  startingSortOrder: number,
  token: string,
): Promise<void> {
  // Sequential, not Promise.all: sortOrder is derived from the caller's
  // current photo count, and the backend's per-item photo-limit check reads
  // that count at insert time — concurrent inserts could race past the limit.
  for (let i = 0; i < photos.length; i++) {
    await uploadOnePhoto(basePath, photos[i], startingSortOrder + i, token);
  }
}

export function getPropertyMedia(propertyId: string, token: string) {
  return getMedia(`/properties/${propertyId}`, token);
}

export function uploadPropertyPhotos(
  propertyId: string,
  photos: PickedPhoto[],
  startingSortOrder: number,
  token: string,
) {
  return uploadPhotos(
    `/properties/${propertyId}`,
    photos,
    startingSortOrder,
    token,
  );
}

export function getUnitMedia(unitId: string, token: string) {
  return getMedia(`/properties/units/${unitId}`, token);
}

export function uploadUnitPhotos(
  unitId: string,
  photos: PickedPhoto[],
  startingSortOrder: number,
  token: string,
) {
  return uploadPhotos(
    `/properties/units/${unitId}`,
    photos,
    startingSortOrder,
    token,
  );
}

export async function setPropertyMediaCover(
  propertyId: string,
  mediaId: number,
  token: string,
): Promise<void> {
  const response = await backendFetch(
    `/properties/${propertyId}/media/${mediaId}/cover`,
    token,
    {
      method: "POST",
    },
  );
  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }
}
