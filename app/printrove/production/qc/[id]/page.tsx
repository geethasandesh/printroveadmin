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
import { Toaster } from "react-hot-toast";
import { useQCStore } from "@/store/qcStore";

export default function QCDetailPage() {
  const params = useParams();
  const router = useRouter();
  const {
    currentRecord: qcData,
    isDetailLoading,
    isSubmitting,
    detailError,
    fetchQCDetails,
    updateQCStatus,
    clearDetailError,
  } = useQCStore();

  const [failReason, setFailReason] = useState("");
  const [showFailDialog, setShowFailDialog] = useState(false);
  const [failReasonDetails, setFailReasonDetails] = useState("");

  const planningId = params.id as string;

  useEffect(() => {
    if (planningId) {
      fetchQCDetails(planningId);
    }

    return () => {
      // Clean up on component unmount
      useQCStore.getState().clearCurrentRecord();
    };
  }, [planningId]);

  const handleCancel = () => {
    router.back();
  };

  const handlePassQC = async () => {
    if (await updateQCStatus(planningId, "pass")) {
      router.back(); // Return to the QC list page after successful submission
    }
  };

  const handleFailQC = async (reason: string) => {
    if (!reason.trim()) {
      return; // Don't proceed if no reason is provided
    }

    if (await updateQCStatus(planningId, "fail", reason)) {
      router.back(); // Return to the QC list page after successful submission
    }
  };

  if (isDetailLoading) {
    return (
      <Page title="Loading QC Details">
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (detailError) {
    return (
      <Page title="Error Loading QC">
        <Banner tone="critical" title="Error" onDismiss={clearDetailError}>
          {detailError}
        </Banner>
        <div className="mt-4">
          <Button onClick={handleCancel}>Back</Button>
        </div>
      </Page>
    );
  }

  if (!qcData) {
    return (
      <Page title="No QC Data">
        <div className="mt-4">
          <Button onClick={handleCancel}>Back</Button>
        </div>
      </Page>
    );
  }

  // If we don't have print configurations, show a message
  if (!qcData.printConfigurations || qcData.printConfigurations.length === 0) {
    return (
      <Page
        title="Quality Control"
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

  // Get the first thumbnail for product image
  const thumbnailUrl =
    qcData.thumbnails &&
    qcData.thumbnails.length > 0 &&
    qcData.thumbnails[0].url
      ? qcData.thumbnails[0].url
      : null;

  // Track current mockup index
  let currentMockupIndex = 0;

  return (
    <Page
      title="Quality Control"
      backAction={{ content: "Back", onAction: handleCancel }}
    >
      <Toaster position="top-right" />
      <BlockStack gap="5">
        {/* Grid based on Print Configurations and their locations */}
        <Grid>
          {qcData.printConfigurations.flatMap((config, configIndex) => {
            // If the config has locations, create a card for each location
            if (config.locations && config.locations.length > 0) {
              return config.locations.map((location, locationIndex) => {
                // Use the next available mockup image
                const mockupIndex = currentMockupIndex++;
                const mockupImageUrl =
                  qcData.mockupImages?.[mockupIndex] || null;

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
              const mockupImageUrl = qcData.mockupImages?.[mockupIndex] || null;

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
            <BlockStack gap={4} padding="4">
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
                        alt={qcData.productName || "Product image"}
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
                      {qcData.productName || "Unknown Product"}
                    </Text>
                  </div>

                  <div className="flex items-center mb-3">
                    <div className="w-32">
                      <Text variant="bodySm" as="p" tone="subdued">
                        Batch Reference:
                      </Text>
                    </div>
                    <Text variant="bodyMd" as="p">
                      {qcData.batchNumber || "Not assigned"}
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
                      {qcData.orderId || "N/A"}
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
                      onClick={handlePassQC}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Pass QC
                    </Button>
                    <Button
                      variant="primary"
                      tone="critical"
                      onClick={() => setShowFailDialog(true)}
                      loading={isSubmitting}
                      disabled={isSubmitting}
                    >
                      Fail QC
                    </Button>
                  </ButtonGroup>
                ) : (
                  <BlockStack gap="4">
                    <div>
                      <Text variant="bodyMd" as="p" fontWeight="medium">
                        Please select a reason for failing QC:
                      </Text>

                      <div className="mt-2">
                        <select
                          className="w-full border border-gray-300 rounded p-2"
                          value={failReason}
                          onChange={(e) => setFailReason(e.target.value)}
                        >
                          <option value="">-- Select a reason --</option>
                          <option value="Print quality issue">
                            Print quality issue
                          </option>
                          <option value="Color inaccuracy">
                            Color inaccuracy
                          </option>
                          <option value="Alignment issue">
                            Alignment issue
                          </option>
                          <option value="Damaged during printing">
                            Damaged during printing
                          </option>
                          <option value="Wrong product printed">
                            Wrong product printed
                          </option>
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
                          handleFailQC(finalReason);
                        }}
                        disabled={
                          !failReason ||
                          (failReason === "Other issue" &&
                            !failReasonDetails) ||
                          isSubmitting
                        }
                        loading={isSubmitting}
                      >
                        Fail QC
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
