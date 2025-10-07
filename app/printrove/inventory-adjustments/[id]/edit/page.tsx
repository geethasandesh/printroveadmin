"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Page,
  Card,
  Text,
  TextField,
  Select,
  Button,
  Spinner,
  ButtonGroup,
  InlineStack,
  BlockStack,
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import useInventoryAdjustmentStore, {
  AdjustmentReason,
  UpdateAdjustmentRequestDto,
} from "@/store/useInventoryAdjustmentStore";
import { toast } from "react-hot-toast";

export default function EditInventoryAdjustment() {
  const { id } = useParams();
  const router = useRouter();
  const {
    selectedAdjustment,
    isLoadingDetails,
    error,
    fetchAdjustmentById,
    updateAdjustmentById,
    resetSelectedAdjustment,
  } = useInventoryAdjustmentStore();

  const [newQty, setNewQty] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("Other");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("Edit page useEffect triggered:", { id, selectedAdjustment: !!selectedAdjustment });

    // Always fetch when component mounts with a valid ID
    if (id) {
      console.log("Fetching adjustment data for ID:", id);
      fetchAdjustmentById(id as string);
    }

    // Clean up when unmounting
    return () => {
      resetSelectedAdjustment();
    };
  }, [id, fetchAdjustmentById, resetSelectedAdjustment]);

  useEffect(() => {
    if (selectedAdjustment) {
      setNewQty(selectedAdjustment.newQty.toString());
      setReason(selectedAdjustment.reason as AdjustmentReason);
    }
  }, [selectedAdjustment]);

  const handleSubmit = async () => {
    if (!selectedAdjustment) return;

    // Validate input
    const qtyValue = parseInt(newQty);
    if (isNaN(qtyValue) || qtyValue < 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    setIsSubmitting(true);

    const updateData: UpdateAdjustmentRequestDto = {
      newQty: qtyValue,
      reason,
      adjustedBy: "admin", // You might want to get this from user context
    };

    const success = await updateAdjustmentById(selectedAdjustment.id, updateData);

    setIsSubmitting(false);

    if (success) {
      router.push(`/printrove/inventory-adjustments/${selectedAdjustment.id}`);
    }
  };

  const handleBack = () => {
    if (selectedAdjustment) {
      router.push(`/printrove/inventory-adjustments/${selectedAdjustment.id}`);
    } else {
      router.push("/printrove/inventory-adjustments");
    }
  };

  const reasonOptions = [
    { label: "Damaged", value: "Damaged" },
    { label: "Found", value: "Found" },
    { label: "Lost", value: "Lost" },
    { label: "Initial Count", value: "Initial Count" },
    { label: "Returned", value: "Returned" },
    { label: "Cycle Count", value: "Cycle Count" },
    { label: "Other", value: "Other" },
  ];

  if (isLoadingDetails) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !selectedAdjustment) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Error loading inventory adjustment
            </Text>
            <Text as="span">{error || "Adjustment not found"}</Text>
            <Button onClick={handleBack}>Back to Adjustments</Button>
          </BlockStack>
        </Card>
      </div>
    );
  }

  const qtyDifference = parseInt(newQty) - selectedAdjustment.newQty;
  const isModified = qtyDifference !== 0;

  return (
    <Page
      title={`Edit Inventory Adjustment: ${selectedAdjustment.id.slice(-6)}`}
      titleMetadata={
        <InlineStack gap="200">
          <Text variant="bodyMd" as="span" tone="subdued">
            {selectedAdjustment.productName}
          </Text>
        </InlineStack>
      }
    >
      <BlockStack>
        {/* Current Adjustment Info */}
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Current Adjustment Details
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Product
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.productName}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  SKU
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.productSku}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Bin Location
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.binName} ({selectedAdjustment.binNumber})
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Current Quantity
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.newQty}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Reason
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.reason}
                </Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        {/* Edit Form */}
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Update Adjustment
            </Text>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <TextField
                    label="New Quantity"
                    type="number"
                    value={newQty}
                    onChange={(value) => setNewQty(value)}
                    autoComplete="off"
                    min="0"
                  />
                </div>

                <div>
                  <Select
                    label="Adjustment Reason"
                    options={reasonOptions}
                    value={reason}
                    onChange={(value) => setReason(value as AdjustmentReason)}
                  />
                </div>
              </div>

              {isModified && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Quantity Change Preview
                  </Text>
                  <div className="mt-2">
                    <Text variant="bodyMd" as="p">
                      Current: {selectedAdjustment.newQty}
                    </Text>
                    <Text variant="bodyMd" as="p">
                      New: {newQty}
                    </Text>
                    <Text
                      variant="bodyMd"
                      as="p"
                      tone={qtyDifference > 0 ? "success" : qtyDifference < 0 ? "critical" : "subdued"}
                    >
                      Change: {qtyDifference > 0 ? "+" : ""}{qtyDifference}
                    </Text>
                  </div>
                </div>
              )}
            </div>
          </BlockStack>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <Button icon={ArrowLeftIcon} onClick={handleBack}>
            Back to Details
          </Button>

          <ButtonGroup>
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isSubmitting || !isModified}
              loading={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Adjustment"}
            </Button>
          </ButtonGroup>
        </div>
      </BlockStack>
    </Page>
  );
}
