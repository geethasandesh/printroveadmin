"use client";

import React, { useEffect, useState, use } from "react";
import { useProductStore } from "@/store/useProductStore";
import { Card, Button, Text, Icon, Tag, Banner, Toast } from "@shopify/polaris";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  EditIcon,
  RefreshIcon,
} from "@shopify/polaris-icons";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ProductDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const productId = resolvedParams.id;

  const {
    getProduct,
    currentProduct,
    isLoadingProduct,
    syncProductToZoho,
    isSyncingToZoho,
  } = useProductStore();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastError, setToastError] = useState(false);
  const router = useRouter();

  const allImages = [
    ...(currentProduct?.thumbnails || []),
    ...(currentProduct?.mockImages || []),
  ];

  useEffect(() => {
    if (productId) {
      getProduct(productId);
    }
  }, [productId, getProduct]);

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? allImages.length - 1 : prev - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === allImages.length - 1 ? 0 : prev + 1
    );
  };

  const handleEdit = () => {
    router.push(`/printrove/product/create?id=${productId}`);
  };

  const handleSyncToZoho = async () => {
    if (!currentProduct) return;

    const success = await syncProductToZoho(currentProduct._id);

    if (success) {
      setToastMessage("Product successfully synced to Zoho");
      setToastError(false);
    } else {
      setToastMessage("Failed to sync product to Zoho");
      setToastError(true);
    }

    setToastActive(true);
  };

  const toggleToast = () => setToastActive((prev) => !prev);

  if (isLoadingProduct) {
    return <div>Loading...</div>;
  }

  if (!currentProduct) {
    return <div>Product not found</div>;
  }

  // Extract Zoho sync status from the product
  const zohoSyncStatus = currentProduct.zohoSyncStatus || {
    fullySync: false,
    totalVariants: 0,
    syncedVariants: 0,
    unsyncedVariants: [],
  };

  const needsZohoSync =
    !zohoSyncStatus.fullySync && zohoSyncStatus.totalVariants > 0;

  return (
    <div className="flex min-h-screen pl-6">
      {/* Toast notification */}
      {toastActive && (
        <Toast
          content={toastMessage}
          error={toastError}
          onDismiss={toggleToast}
        />
      )}

      {/* Left Section - Image Display */}
      <div className="w-1/4 p-6">
        {" "}
        {/* Changed from w-1/3 to w-1/4 */}
        <div className="sticky top-6">
          {/* Main Image */}
          <div className="relative aspect-square mb-4 max-w-[300px]  rounded-lg border border-gray-300 p-4">
            {" "}
            {/* Added max-w-[300px] */}
            <Image
              src={allImages[currentImageIndex]?.url}
              alt={`Product image ${currentImageIndex + 1}`}
              fill
              className="object-cover rounded-lg"
            />
            {/* Navigation buttons */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2">
              {" "}
              <Button
                variant="plain"
                icon={ArrowLeftIcon}
                onClick={handlePrevImage}
              />
            </div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2">
              <Button
                variant="plain"
                icon={ArrowRightIcon}
                onClick={handleNextImage}
              />
            </div>
          </div>

          {/* Thumbnail Preview */}
          <div className="grid grid-cols-5 gap-2 max-w-[300px] bg-white  rounded-lg border border-gray-300 p-4">
            {" "}
            {/* Added max-w-[300px] */}
            {allImages.map((image, index) => (
              <div
                key={index}
                className={`relative aspect-square cursor-pointer ${
                  currentImageIndex === index ? "ring-2 ring-blue-500" : ""
                }`}
                onClick={() => setCurrentImageIndex(index)}>
                <Image
                  src={image.url}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover rounded"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Section - Product Details */}
      <div className="w-3/4 bg-[#F6F6F7] p-6">
        {" "}
        {/* Changed from w-2/3 to w-3/4 */}
        {/* Basic Details Card */}
        <div className="mb-4">
          <Card>
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <Text as="span" variant="bodyMd" tone="subdued">
                    Title
                  </Text>
                  <Text as="h1" variant="headingLg" tone="base">
                    {currentProduct.title}
                  </Text>
                </div>
                <div className="flex gap-2">
                  {/* Add Zoho Sync Button if needed */}
                  {needsZohoSync && (
                    <Button
                      icon={RefreshIcon}
                      onClick={handleSyncToZoho}
                      loading={isSyncingToZoho}
                      variant="primary">
                      Sync to Zoho
                    </Button>
                  )}
                  <Button icon={EditIcon} onClick={handleEdit}>
                    Edit
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Text as="span" variant="bodyMd" tone="subdued">
                    Description :{" "}
                  </Text>
                  <Text as="span" variant="bodyLg">
                    {currentProduct.description}
                  </Text>
                </div>

                <div>
                  <Text as="span" variant="bodyMd" tone="subdued">
                    Category :{" "}
                  </Text>
                  <Text as="span" variant="bodyLg">
                    {currentProduct.collections.join(", ")}
                  </Text>
                </div>

                <div>
                  <Text as="span" variant="bodyMd" tone="subdued">
                    Status :{" "}
                  </Text>
                  <Tag>{currentProduct.status}</Tag>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <Text as="h2" variant="headingMd">
                  Variants
                </Text>
              </div>

              <div className="space-y-4">
                {currentProduct.variants.map((variant) => (
                  <div key={variant.name} className="space-y-2">
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      {variant.name}
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {variant.values.map((value, index) => (
                        <Tag key={index}>{value}</Tag>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
        {/* Variant Combinations Card */}
        <div className="mb-4">
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <Text as="h2" variant="headingMd">
                  Variant Combinations
                </Text>
              </div>

              <div className="space-y-4">
                {Object.entries(currentProduct.variantConfigurations || {}).map(
                  ([key, config]) => (
                    <div
                      key={key}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded">
                      <div className="w-12 h-12 relative bg-gray-100 rounded flex items-center justify-center">
                        {config.thumbnails?.[0]?.url ? (
                          <Image
                            src={config.thumbnails[0].url}
                            alt={key}
                            fill
                            className="object-cover rounded"
                          />
                        ) : (
                          <Text as="span" variant="bodySm" tone="subdued">
                            No Image
                          </Text>
                        )}
                      </div>
                      <div className="flex-1">
                        <Text as="span" variant="bodyMd" fontWeight="bold">
                          {key}
                        </Text>
                        <Text as="p" variant="bodySm" tone="subdued">
                          SKU: {config.inventory?.sku || "N/A"}
                        </Text>
                      </div>

                      {/* Add Zoho sync status tag */}
                      <div>
                        {config.isZohoSynced ? (
                          <Tag>
                            <span className="text-green-700">Zoho Synced</span>
                          </Tag>
                        ) : (
                          <Tag>
                            <span className="text-amber-600">Not Synced</span>
                          </Tag>
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
