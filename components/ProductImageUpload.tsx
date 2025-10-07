import React, { useState } from "react";
import { DropZone, Banner, Button } from "@shopify/polaris";
import { uploadToS3, UploadedImage } from "@/utils/s3Upload";
import { ImagePreviewModal } from "./ImagePreviewModal";

interface Props {
  type: "thumbnail" | "mockup";
  onUploadComplete: (images: UploadedImage[]) => void;
  uploadedImages?: UploadedImage[];
}

export function ProductImageUpload({
  type,
  onUploadComplete,
  uploadedImages = [],
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleDrop = async (files: File[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const validFiles = files.filter((file) => {
        const isValidType = ["image/jpeg", "image/png"].includes(file.type);
        const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit
        return isValidType && isValidSize;
      });

      if (validFiles.length === 0) {
        setError("Please upload valid image files (JPG/PNG) under 5MB");
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
        accept="image/*"
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
                Accepts .jpg, .png (max 5MB)
              </p>
            </>
          )}
        </div>
      </DropZone>

      {/* Image Preview Section Below */}
      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-4">
          {uploadedImages.map((image, index) => (
            <div key={image.key} className="relative">
              <img
                src={image.signedUrl || image.url} // Use signed URL for preview if available
                alt={`${type} ${index + 1}`}
                className="w-full h-32 object-cover rounded"
              />
              <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                <Button variant="plain" onClick={() => handleDelete(index)}>
                  ×
                </Button>
              </div>
            </div>
          ))}
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
