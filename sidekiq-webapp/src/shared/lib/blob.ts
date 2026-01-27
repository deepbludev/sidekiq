import { put, del, type PutBlobResult } from "@vercel/blob";

/**
 * Maximum allowed file size for avatar uploads (5MB)
 */
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

/**
 * Allowed MIME types for avatar uploads
 */
const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type AllowedAvatarType = (typeof ALLOWED_AVATAR_TYPES)[number];

/**
 * Validates that a file is an allowed avatar type and size
 * @param file - The file to validate
 * @returns Validation result with error message if invalid
 */
export function validateAvatarFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as AllowedAvatarType)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_AVATAR_TYPES.join(", ")}`,
    };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size is ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
    };
  }

  return { valid: true };
}

/**
 * Uploads an avatar image to Vercel Blob Storage
 * @param file - The file to upload
 * @param userId - The user ID to associate with the avatar (used in path)
 * @returns The uploaded blob result with URL
 */
export async function uploadAvatar(
  file: File,
  userId: string,
): Promise<PutBlobResult> {
  const validation = validateAvatarFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const extension = file.name.split(".").pop() ?? "jpg";
  const filename = `avatars/${userId}/${Date.now()}.${extension}`;

  const blob = await put(filename, file, {
    access: "public",
    addRandomSuffix: false,
  });

  return blob;
}

/**
 * Deletes an avatar from Vercel Blob Storage
 * @param url - The blob URL to delete
 */
export async function deleteAvatar(url: string): Promise<void> {
  await del(url);
}

/**
 * Extracts the filename from a blob URL for display purposes
 * @param url - The blob URL
 * @returns The filename portion of the URL
 */
export function getAvatarFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.split("/").pop() ?? "avatar";
  } catch {
    return "avatar";
  }
}
