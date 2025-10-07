"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Page,
  Card,
  Text,
  Spinner,
  Banner,
  BlockStack,
  InlineStack,
  Button,
  ButtonGroup,
  Grid,
  Icon,
  Box,
  Divider,
} from "@shopify/polaris";
import { ImageIcon } from "@shopify/polaris-icons";
import Image from "next/image";
import apiClient from "@/apiClient";

interface Location {
  location: string;
  boundingBox: {
    width: number;
    height: number;
    top: number;
    left: number;
  };
}

interface PrintConfiguration {
  position: string;
  artwork: {
    name: string;
    url: string;
  };
  size?: {
    width: number;
    height: number;
  };
  placement?: {
    top: number;
    left: number;
  };
  locations?: Location[];
}

interface PreviewDetails {
  productId: string;
  variantKey: string;
  zohoItemId: string;
  printConfigurations: PrintConfiguration[];
  mockupImages: string[];
  thumbnails?: Array<{ url: string }>;
  productName: string;
  planningStatus: string;
  orderId: string;
  uid: string;
  batchNumber?: string;
  batchId?: string;
  binName?: string;
  binId?: string;
}

export default function PreviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<PreviewDetails | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failReason, setFailReason] = useState("");
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [failReasonDetails, setFailReasonDetails] = useState("");

  const planningId = params.id as string;

  useEffect(() => {
    const fetchPreviewDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await apiClient.get(`/preview/${planningId}`);
        const data = response.data as {
          success: boolean;
          data: PreviewDetails;
          error?: string;
        };

        if (data.success) {
          setPreviewData(data.data);
        } else {
          setError(data.error || "Failed to load preview details");
        }
      } catch (err: any) {
        setError(
          err.response?.data?.error ||
            err.message ||
            "An error occurred while fetching preview details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (planningId) {
      fetchPreviewDetails();
    }
  }, [planningId]);

  const handleCancel = () => {
    router.back();
  };

  const handlePassPreview = async () => {
    try {
      setIsSubmitting(true);
      const response = await apiClient.put(`/preview/${planningId}/status`, {
        status: "pass",
      });

      const data = response.data as { success: boolean };
      if (data.success) {
        router.back(); // Return to previous page after success
      } else {
        setError("Failed to mark preview as passed");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "An error occurred while updating preview status"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFailPreview = async (reason: string) => {
    if (!reason.trim()) {
      // Don't proceed if no reason is provided
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await apiClient.put(`/preview/${planningId}/status`, {
        status: "fail",
        reason: reason || "Failed preview",
      });

      if (response.data.success) {
        router.back(); // Return to previous page after success
      } else {
        setError("Failed to mark preview as failed");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "An error occurred while updating preview status"
      );
    } finally {
      setIsSubmitting(false);
      setShowFailDialog(false);
      setFailReason("");
      setFailReasonDetails("");
    }
  };

  if (isLoading) {
    return (
      <Page title="Loading Preview Details">
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (error) {
    return (
      <Page title="Error Loading Preview">
        <Banner tone="critical" title="Error">
          {error}
        </Banner>
        <div className="mt-4">
          <Button onClick={handleCancel}>Cancel</Button>
        </div>
      </Page>
    );
  }

  if (!previewData) {
    return (
      <Page title="No Preview Data">
        <div className="mt-4">
          <Button onClick={handleCancel}>Cancel</Button>
        </div>
      </Page>
    );
  }

  // If we don't have print configurations, show a message
  if (
    !previewData.printConfigurations ||
    previewData.printConfigurations.length === 0
  ) {
    return (
      <Page
        title="Preview"
        backAction={{ content: "Back", onAction: handleCancel }}
        primaryAction={{
          content: "Cancel",
          onAction: handleCancel,
          disabled: false,
        }}
      >
        <Card>
          <div className="p-8 text-center">
            <Text as="p" tone="subdued">
              No print configurations available for this product.
            </Text>
          </div>
        </Card>
      </Page>
    );
  }

  // Create a mapping of mockup images for easy access
  const mockupImagesMap = {};
  if (previewData.mockupImages && previewData.mockupImages.length > 0) {
    previewData.mockupImages.forEach((url, index) => {
      mockupImagesMap[index] = url;
    });
  }

  // Get the first thumbnail for product image
  const thumbnailUrl =
    previewData.thumbnails &&
    previewData.thumbnails.length > 0 &&
    previewData.thumbnails[0].url
      ? previewData.thumbnails[0].url
      : null;

  // Track current mockup index
  let currentMockupIndex = 0;

  return (
    <Page
      title="Preview"
      backAction={{ content: "Back", onAction: handleCancel }}
      primaryAction={{
        content: "Cancel",
        onAction: handleCancel,
        disabled: isSubmitting,
      }}
    >
      <BlockStack gap="5">
        {/* Grid based on Print Configurations and their locations */}
        <Grid>
          {previewData.printConfigurations.flatMap((config, configIndex) => {
            // If the config has locations, create a card for each location
            if (config.locations && config.locations.length > 0) {
              return config.locations.map((location, locationIndex) => {
                // Use the next available mockup image
                const mockupIndex = currentMockupIndex++;
                const mockupImageUrl =
                  previewData.mockupImages?.[mockupIndex] || null;

                // Get dimensions and position from location
                const width = location.boundingBox?.width || "N/A";
                const height = location.boundingBox?.height || "N/A";
                const top = location.boundingBox?.top || "N/A";
                const left = location.boundingBox?.left || "N/A";

                // Determine location name
                const locationName =
                  location.location || `Location ${locationIndex + 1}`;

                return (
                  <Grid.Cell
                    key={`config-${configIndex}-location-${locationIndex}`}
                    columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}
                  >
                    <Card>
                      <BlockStack gap="0">
                        {/* Image Section */}
                        {mockupImageUrl ? (
                          <div className="relative w-full h-[350px] bg-gray-100 rounded-t-md overflow-hidden">
                            <Image
                              src={mockupImageUrl}
                              alt={`Product mockup for ${locationName}`}
                              fill
                              style={{ objectFit: "contain" }}
                              unoptimized={true}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-full h-[350px] bg-gray-100 rounded-t-md">
                            <div className="text-center">
                              <Icon source={ImageIcon} tone="base" />
                              <Text as="p" tone="subdued">
                                No mockup image available
                              </Text>
                            </div>
                          </div>
                        )}

                        {/* Content Section */}
                        <div className="p-4">
                          <BlockStack gap="3">
                            <Text variant="headingMd" as="h3">
                              {locationName}
                            </Text>

                            <div className="space-y-2">
                              <Text as="p" variant="bodyMd">
                                Dimensions:
                                <strong>
                                  {" "}
                                  {width} × {height}
                                </strong>
                              </Text>

                              <Text as="p" variant="bodyMd">
                                Position:
                                <strong>
                                  {" "}
                                  Top: {top}, Left: {left}
                                </strong>
                              </Text>
                            </div>
                          </BlockStack>
                        </div>

                        {/* Button Section - Only show if artwork URL exists */}
                        {config.artwork?.url && (
                          <div className="p-4 pt-0">
                            <Button
                              fullWidth
                              url={config.artwork.url}
                              variant="primary"
                              external
                            >
                              View design
                            </Button>
                          </div>
                        )}
                      </BlockStack>
                    </Card>
                  </Grid.Cell>
                );
              });
            } else {
              // If no locations, create a single card for the configuration
              const mockupIndex = currentMockupIndex++;
              const mockupImageUrl =
                previewData.mockupImages?.[mockupIndex] || null;

              // Get dimensions and position from config
              const width = config.size?.width || "N/A";
              const height = config.size?.height || "N/A";
              const top = config.placement?.top || "N/A";
              const left = config.placement?.left || "N/A";

              // Determine position name
              const positionName =
                config.position || `Position ${configIndex + 1}`;

              return (
                <Grid.Cell
                  key={`config-${configIndex}`}
                  columnSpan={{ xs: 6, sm: 6, md: 6, lg: 4, xl: 4 }}
                >
                  <Card>
                    <BlockStack gap="0">
                      {/* Image Section */}
                      {mockupImageUrl ? (
                        <div className="relative w-full h-[350px] bg-gray-100 rounded-t-md overflow-hidden">
                          <Image
                            src={mockupImageUrl}
                            alt={`Product mockup for ${positionName}`}
                            fill
                            style={{ objectFit: "contain" }}
                            unoptimized={true}
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center w-full h-[350px] bg-gray-100 rounded-t-md">
                          <div className="text-center">
                            <Icon source={ImageIcon} tone="base" />
                            <Text as="p" tone="subdued">
                              No mockup image available
                            </Text>
                          </div>
                        </div>
                      )}

                      {/* Content Section */}
                      <div className="p-4">
                        <BlockStack gap="3">
                          <Text variant="headingMd" as="h3">
                            {positionName}
                          </Text>

                          <div className="space-y-2">
                            <Text as="p" variant="bodyMd">
                              Dimensions:
                              <strong>
                                {" "}
                                {width} × {height}
                              </strong>
                            </Text>

                            <Text as="p" variant="bodyMd">
                              Position:
                              <strong>
                                {" "}
                                Top: {top}, Left: {left}
                              </strong>
                            </Text>
                          </div>
                        </BlockStack>
                      </div>

                      {/* Button Section - Only show if artwork URL exists */}
                      {config.artwork?.url && (
                        <div className="p-4 pt-0">
                          <Button
                            fullWidth
                            url={config.artwork.url}
                            variant="primary"
                            external
                          >
                            View design
                          </Button>
                        </div>
                      )}
                    </BlockStack>
                  </Card>
                </Grid.Cell>
              );
            }
          })}
        </Grid>

        {/* Action Center Section */}
        <div className="mt-6">
          <Card>
            <BlockStack>
              <Text variant="headingMd" as="h2">
                Action Center
              </Text>
              <Divider />

              <InlineStack align="start">
                {/* Left side: Product Image */}
                <Box
                  background="bg-surface-secondary"
                  minWidth="150px"
                  minHeight="150px"
                  width="150px"
                >
                  {thumbnailUrl ? (
                    <div className="relative w-full h-full overflow-hidden">
                      <Image
                        src={thumbnailUrl}
                        alt={previewData.productName || "Product image"}
                        fill
                        style={{ objectFit: "contain" }}
                        unoptimized={true}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <Icon source={ImageIcon} tone="base" size="large" />
                    </div>
                  )}
                </Box>

                {/* Right side: Product Details */}
                <BlockStack>
                  <div className="flex items-center mb-3 mt-4">
                    <span className="w-32">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Product Name:
                      </Text>
                    </span>
                    <Text variant="bodyMd" as="p" fontWeight="semibold">
                      {previewData.productName || "Unknown Product"}
                    </Text>
                  </div>

                  <div className="flex items-center mb-3">
                    <div className="w-32">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Batch Reference:
                      </Text>
                    </div>
                    <Text variant="bodyMd" as="p">
                      {previewData.batchNumber || "Not assigned"}
                    </Text>
                  </div>

                  <div className="flex items-center">
                    <Text
                      variant="bodySm"
                      as="p"
                      tone="subdued"
                      className="w-32"
                    >
                      Order ID:
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {previewData.orderId || "N/A"}
                    </Text>
                  </div>
                </BlockStack>
              </InlineStack>

              <Divider />

              {/* Bottom row: Action buttons */}
              <BlockStack gap="4">
                {!showFailDialog ? (
                  <ButtonGroup fullWidth>
                    <Button
                      variant="primary"
                      tone="success"
                      onClick={handlePassPreview}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Pass Preview
                    </Button>
                    <Button
                      variant="primary"
                      tone="critical"
                      onClick={() => setShowFailDialog(true)}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Fail Preview
                    </Button>
                  </ButtonGroup>
                ) : (
                  <BlockStack gap="4">
                    <div>
                      <Text variant="bodyMd" as="p" fontWeight="medium">
                        Please select a reason for failing:
                      </Text>

                      <div className="mt-2">
                        <select
                          className="w-full border border-gray-300 rounded p-2"
                          value={failReason}
                          onChange={(e) => setFailReason(e.target.value)}
                        >
                          <option value="">-- Select a reason --</option>
                          <option value="Artwork misalignment">
                            Artwork misalignment
                          </option>
                          <option value="Wrong color">Wrong color</option>
                          <option value="Low quality artwork">
                            Low quality artwork
                          </option>
                          <option value="Missing elements">
                            Missing elements
                          </option>
                          <option value="Wrong size">Wrong size</option>
                          <option value="Other issue">Other issue</option>
                        </select>

                        {failReason === "Other issue" && (
                          <textarea
                            className="w-full border border-gray-300 rounded p-2 mt-2 min-h-[80px]"
                            placeholder="Please describe the issue..."
                            value={failReasonDetails}
                            onChange={(e) =>
                              setFailReasonDetails(e.target.value)
                            }
                          />
                        )}
                      </div>
                    </div>

                    <ButtonGroup fullWidth>
                      <Button
                        onClick={() => {
                          setShowFailDialog(false);
                          setFailReason("");
                          setFailReasonDetails("");
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        tone="critical"
                        onClick={() => {
                          const finalReason =
                            failReason === "Other issue"
                              ? `Other issue: ${failReasonDetails}`
                              : failReason;
                          handleFailPreview(finalReason);
                        }}
                        disabled={
                          !failReason ||
                          (failReason === "Other issue" &&
                            !failReasonDetails) ||
                          isSubmitting
                        }
                        loading={isSubmitting}
                      >
                        Fail Preview
                      </Button>
                    </ButtonGroup>
                  </BlockStack>
                )}
              </BlockStack>
            </BlockStack>
          </Card>
        </div>
      </BlockStack>
    </Page>
  );
}
