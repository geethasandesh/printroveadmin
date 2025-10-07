import React, { useState } from "react";
import { DropZone, Banner, Button, Thumbnail } from "@shopify/polaris";
import { uploadToS3, UploadedImage } from "@/utils/s3Upload";

interface Props {
  type: "variant" | "gridline";
  onUploadComplete: (image: UploadedImage) => void;
  currentImage?: UploadedImage;
}

export function VariantImageUpload({
  type,
  onUploadComplete,
  currentImage,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = async (files: File[]) => {
    if (files.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const file = files[0]; // Only handle the first file

      // Validate file
      const isValidType = ["image/jpeg", "image/png"].includes(file.type);
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB limit

      if (!isValidType || !isValidSize) {
        setError("Please upload a valid image file (JPG/PNG) under 5MB");
        return;
      }

      const uploadedImage = await uploadToS3(file, type);
      onUploadComplete(uploadedImage);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Failed to upload image");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Banner tone="critical">
          <p>{error}</p>
        </Banner>
      )}

      {currentImage ? (
        <div className="relative group">
          <img
            src={currentImage.url}
            alt={type}
            className="w-full h-40 object-contain rounded-md border border-gray-200"
          />
          <button
            onClick={() => onUploadComplete({ key: "", url: "" })}
            className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span className="text-red-500 font-bold">×</span>
          </button>
        </div>
      ) : (
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
                <p className="text-sm text-gray-600">
                  Drop {type} image to upload or
                </p>
                <Button>Browse</Button>
                <p className="text-xs text-gray-500 mt-2">
                  Accepts .jpg, .png (max 5MB)
                </p>
              </>
            )}
          </div>
        </DropZone>
      )}
    </div>
  );
}
