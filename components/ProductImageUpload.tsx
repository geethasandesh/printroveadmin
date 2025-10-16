import React, { useState } from "react";
import { DropZone, Banner, Button } from "@shopify/polaris";
import { uploadToS3, UploadedImage } from "@/utils/s3Upload";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface Props {
  type: "thumbnail" | "mockup" | "model-front" | "model-back" | "model-left-sleeve" | "model-right-sleeve" | "model-neck-label";
  onUploadComplete: (images: UploadedImage[]) => void;
  uploadedImages?: UploadedImage[];
  accept?: string;
  maxFiles?: number;
}

export function ProductImageUpload({
  type,
  onUploadComplete,
  uploadedImages = [],
  accept = "image/jpeg,image/png",
  maxFiles = 5,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDrop = async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const validFiles = files.filter((file) => {
        const isValidType = ["image/jpeg", "image/png", "image/svg+xml"].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        return isValidType && isValidSize;
      });

      if (validFiles.length === 0) {
        setError("Please upload valid image files (JPG/PNG/SVG) under 5MB");
        return;
      }

      if (validFiles.length > maxFiles) {
        setError(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      const uploadPromises = validFiles.map((file) => uploadToS3(file, type));
      const results = await Promise.allSettled(uploadPromises);

      const successfulUploads = results
        .filter(
          (result): result is PromiseFulfilledResult<UploadedImage> =>
            result.status === "fulfilled"
        )
        .map((result) => result.value);

      if (successfulUploads.length > 0) {
        onUploadComplete([...uploadedImages, ...successfulUploads]);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload images");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = (indexToDelete: number) => {
    const updatedImages = uploadedImages.filter(
      (_, index) => index !== indexToDelete
    );
    onUploadComplete(updatedImages);
  };

  return (
    <div className="space-y-4">
      {error && (
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      )}

      {/* Upload Zone First */}
      <DropZone
        accept={accept}
        type="image"
        onDrop={handleDrop}
        disabled={isLoading}
        overlay={isLoading}
      >
        <div className="flex flex-col items-center justify-center p-6">
          {isLoading ? (
            <p>Uploading...</p>
          ) : (
            <>
              <p className="text-sm text-gray-600">Drop files to upload or</p>
              <Button>Browse</Button>
              <p className="text-xs text-gray-500 mt-2">
                Accepts .jpg, .png, .svg (max 5MB)
              </p>
            </>
          )}
        </div>
      </DropZone>

      {/* Image Preview Section Below */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {uploadedImages.map((image, index) => {
            const hasKey = !!image?.key;
            return (
              <div key={`${image.key}-${index}`} className="relative">
                <img
                  src={image.signedUrl || image.url}
                  alt={`${type} ${index + 1}`}
                  className="w-full h-32 object-cover rounded"
                />

                {/* Ready/Pending indicator */}
                <div
                  className={`absolute bottom-2 left-2 px-2 py-0.5 rounded text-[11px] font-medium ${
                    hasKey
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                  }`}
                  title={hasKey ? `S3 Key: ${image.key}` : "Not uploaded to S3 yet"}
                >
                  {hasKey ? "Ready" : "Pending"}
                </div>

                <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                  <Button variant="plain" onClick={() => handleDelete(index)}>
                    ×
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Preview Modal */}
      <ImagePreviewModal
        open={showModal}
        onClose={() => setShowModal(false)}
        images={uploadedImages}
        title={`${type.charAt(0).toUpperCase() + type.slice(1)} Images`}
        onDelete={handleDelete}
      />
    </div>
  );
}
