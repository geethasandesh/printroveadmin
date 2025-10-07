import { useEffect, useState } from "react";
import { Badge, Icon, Select, Text, TextField } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { UploadedImage } from "@/utils/s3Upload";
import AWS from "aws-sdk";

interface VariantSidebarProps {
  productData: {
    title: string;
    status: string;
    variants: Array<{
      name: string;
      values: string[];
    }>;
  };
  mockupFiles: UploadedImage[];
  variantGroups: Map<string, string[]>;
  selectedCombination: string | null;
  onCombinationSelect: (combination: string) => void;
}

export function VariantSidebar({
  productData,
  mockupFiles,
  variantGroups,
  selectedCombination,
  onCombinationSelect,
}: VariantSidebarProps) {
  // State for image URL and loading state
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState<boolean>(false);

  // Function to refresh signed URL if needed
  const refreshSignedUrl = async (key: string): Promise<string> => {
    try {
      // Check if AWS credentials are available
      const bucketName = process.env.NEXT_PUBLIC_AWS_BUCKET_NAME || process.env.AWS_S3_BUCKET_NAME;
      const accessKeyId = process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
      const secretAccessKey = process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;
      const region = process.env.NEXT_PUBLIC_AWS_REGION || process.env.AWS_REGION;

      if (!bucketName || !accessKeyId || !secretAccessKey || !region) {
        console.warn("AWS credentials not fully configured, skipping signed URL refresh");
        // Return a placeholder or the original key
        return "";
      }

      const s3 = new AWS.S3({
        accessKeyId,
        secretAccessKey,
        region,
      });

      const signedUrl = await s3.getSignedUrlPromise("getObject", {
        Bucket: bucketName,
        Key: key,
        Expires: 900, // 15 minutes
      });

      return signedUrl;
    } catch (error) {
      console.error("Error refreshing signed URL:", error);
      // Return empty string instead of throwing to prevent blocking the form
      return "";
    }
  };

  // Update image URL when mockup files change
  useEffect(() => {
    const updateImageUrl = async () => {
      if (mockupFiles.length > 0) {
        setIsLoadingImage(true);
        try {
          // Use existing signedUrl if available, otherwise get a new one
          if (mockupFiles[0].signedUrl) {
            setImageUrl(mockupFiles[0].signedUrl);
          } else if (mockupFiles[0].key) {
            const newSignedUrl = await refreshSignedUrl(mockupFiles[0].key);
            setImageUrl(newSignedUrl);
          }
        } catch (error) {
          console.error("Error getting image URL:", error);
          setImageUrl(null);
        } finally {
          setIsLoadingImage(false);
        }
      } else {
        setImageUrl(null);
      }
    };

    updateImageUrl();
  }, [mockupFiles]);

  return (
    <div className="w-[25%] mt-8">
      <div className="bg-white p-6 rounded-lg">
        {/* 1st Row - Product Info */}
        <div className="flex gap-4 mb-6">
          {/* Column 1 - Mock Media */}
          <div className="w-[200px] h-[200px] bg-gray-100 rounded-lg overflow-hidden">
            {isLoadingImage ? (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                Loading...
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Product mockup"
                className="w-full h-full object-cover"
                onError={() => {
                  console.error("Image failed to load");
                  setImageUrl(null);
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
              </div>
            )}
          </div>

          {/* Column 2 - Product Details */}
          <div className="flex-1">
            <Text variant="headingMd" as="h2">
              {productData.title}
            </Text>
            <div className="mt-2">
              <Badge
                tone={productData.status === "active" ? "success" : "critical"}
              >
                {productData.status}
              </Badge>
            </div>
            <div className="mt-2 text-gray-600">
              {productData.variants.length} variants
            </div>
          </div>
        </div>

        {/* 2nd Row - Search */}
        <div className="mb-6">
          <TextField
            label=""
            prefix={<Icon source={SearchIcon} />}
            placeholder="Search variants"
            value=""
            onChange={() => {}}
            autoComplete="off"
          />
        </div>

        {/* 3rd Row - Variant Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          {productData.variants.map((variant) => (
            <div key={variant.name} className="w-[30%]">
              <Select
                label=""
                placeholder={variant.name}
                options={[
                  { label: `All ${variant.name}s`, value: `all-${variant.name}` },
                  ...variant.values
                    .filter((value) => value && value.trim() !== "")
                    .map((value) => ({
                      label: value,
                      value: value,
                    })),
                ]}
                onChange={() => {}}
              />
            </div>
          ))}
        </div>

        {/* Variant List - with overflow scrolling */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
          {Array.from(variantGroups.entries()).map(
            ([groupName, combinations]) => (
              <div key={groupName} className="mb-4">
                <div className="mb-2">
                  <Text variant="headingSm" as="h3">
                    {groupName}
                  </Text>
                </div>
                <div className="space-y-2 pl-4">
                  {(combinations as string[]).map((combination) => (
                    <div
                      key={combination}
                      className={`p-3 rounded cursor-pointer ${
                        selectedCombination === combination
                          ? "bg-gray-200"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                      onClick={() => onCombinationSelect(combination)}
                    >
                      {combination}
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
