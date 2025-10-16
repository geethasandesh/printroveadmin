import apiClient from "../apiClient";

export interface UploadedImage {
  key: string;
  url: string; // Original S3 URL for backend
  signedUrl?: string; // Signed URL for preview
  _id: string;
}

/**
 * Upload a file to S3 via the backend API
 * This is more secure than direct S3 uploads from the browser
 * @param file File to upload
 * @param type Type of file (thumbnail, mockup, variant, gridline)
 * @returns Uploaded image information
 */
export const uploadToS3ViaAPI = async (
  file: File,
  type: "thumbnail" | "mockup" | "variant" | "gridline"
): Promise<UploadedImage> => {
  if (!file) {
    throw new Error("No file provided");
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    console.log(`Uploading file via API: ${file.name} (${file.size} bytes)`);

    // Use /upload/admin endpoint (no authentication required for admin panel)
    const response = await apiClient.post("/upload/admin", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success && response.data.data) {
      console.log("Upload successful:", response.data.data);
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Upload failed");
    }
  } catch (error: any) {
    console.error("API Upload Error:", error);
    
    if (error.response) {
      // Server responded with error
      if (error.response.status === 404) {
        throw new Error(
          "Upload endpoint not available. The backend may still be deploying. " +
          "Please wait a few minutes and try again, or contact support if the issue persists."
        );
      }
      throw new Error(
        error.response.data?.message || 
        `Upload failed with status ${error.response.status}`
      );
    } else if (error.request) {
      // Request made but no response
      throw new Error("No response from server. Please check your connection.");
    } else {
      // Something else happened
      throw new Error(
        error instanceof Error
          ? error.message
          : "Upload failed with unknown error"
      );
    }
  }
};

/**
 * Upload multiple files to S3 via the backend API
 * @param files Array of files to upload
 * @param type Type of files (thumbnail, mockup, variant, gridline)
 * @returns Array of uploaded image information
 */
export const uploadMultipleToS3ViaAPI = async (
  files: File[],
  type: "thumbnail" | "mockup" | "variant" | "gridline"
): Promise<UploadedImage[]> => {
  if (!files || files.length === 0) {
    throw new Error("No files provided");
  }

  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });
    formData.append("type", type);

    console.log(`Uploading ${files.length} files via API`);

    // Use /upload/admin/multiple endpoint (no authentication required for admin panel)
    const response = await apiClient.post("/upload/admin/multiple", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    if (response.data.success && response.data.data) {
      console.log(`Successfully uploaded ${response.data.data.length} files`);
      return response.data.data;
    } else {
      throw new Error(response.data.message || "Upload failed");
    }
  } catch (error: any) {
    console.error("API Multiple Upload Error:", error);
    
    if (error.response) {
      throw new Error(
        error.response.data?.message || 
        `Upload failed with status ${error.response.status}`
      );
    } else if (error.request) {
      throw new Error("No response from server. Please check your connection.");
    } else {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Upload failed with unknown error"
      );
    }
  }
};

/**
 * Get a presigned URL for an existing S3 file
 * @param key S3 file key
 * @returns Presigned URL
 */
export const getPresignedUrl = async (key: string): Promise<string> => {
  try {
    const response = await apiClient.post("/upload/presigned-url", { key });

    if (response.data.success && response.data.data?.signedUrl) {
      return response.data.data.signedUrl;
    } else {
      throw new Error(response.data.message || "Failed to get presigned URL");
    }
  } catch (error: any) {
    console.error("Get Presigned URL Error:", error);
    
    if (error.response) {
      throw new Error(
        error.response.data?.message || 
        `Failed to get presigned URL: ${error.response.status}`
      );
    } else {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Failed to get presigned URL"
      );
    }
  }
};

