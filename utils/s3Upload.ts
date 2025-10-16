// DEPRECATED: Direct S3 uploads are disabled for security reasons
// Use apiUpload.ts instead for secure server-side uploads

import { uploadToS3ViaAPI } from "./apiUpload";

export interface UploadedImage {
  key: string;
  url: string; // Original S3 URL for backend
  signedUrl?: string; // Signed URL for preview
  _id: string;
}

/**
 * Upload file to S3 via backend API
 * @deprecated This function now uses the secure API upload method
 * @param file File to upload
 * @param type Type of upload
 * @returns Promise with uploaded image data
 */
export const uploadToS3 = async (
  file: File,
  type: "thumbnail" | "mockup" | "variant" | "gridline"
): Promise<UploadedImage> => {
  console.warn("uploadToS3 is using the secure API upload method");
  return uploadToS3ViaAPI(file, type);
};

/**
 * Get signed URL from image URL
 * @deprecated This function is deprecated - the backend API should return signed URLs
 * @param imageUrl Image URL
 * @returns Signed URL
 */
export const getSignedUrlFromImageUrl = async (
  imageUrl: string
): Promise<string> => {
  console.warn("getSignedUrlFromImageUrl is deprecated - use API presigned URLs");
  
  try {
    // Extract the key from the image URL
    const url = new URL(imageUrl);
    let key = url.pathname.startsWith("/")
      ? url.pathname.slice(1)
      : url.pathname;

    // Use the API to get the presigned URL
    const { getPresignedUrl } = await import("./apiUpload");
    return await getPresignedUrl(key);
  } catch (error) {
    console.error("Get Signed URL Error:", error);
    throw new Error(
      error instanceof Error
        ? `Get Signed URL failed: ${error.message}`
        : "Get Signed URL failed with unknown error"
    );
  }
};
