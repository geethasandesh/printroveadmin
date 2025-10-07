"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Page,
  Card,
  Text,
  Badge,
  Button,
  DataTable,
  Spinner,
  ButtonGroup,
  InlineStack,
  BlockStack,
  Modal,
} from "@shopify/polaris";
import { ArrowLeftIcon, DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import useInventoryAdjustmentStore from "@/store/useInventoryAdjustmentStore";

export default function InventoryAdjustmentDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const {
    selectedAdjustment,
    isLoadingDetails,
    error,
    fetchAdjustmentById,
    deleteAdjustmentById,
    resetSelectedAdjustment,
  } = useInventoryAdjustmentStore();

  useEffect(() => {
    if (id) {
      fetchAdjustmentById(id as string);
    }

    // Clean up when unmounting
    return () => {
      resetSelectedAdjustment();
    };
  }, [id, fetchAdjustmentById, resetSelectedAdjustment]);

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTypeBadge = (type: string) => {
    const typeMap: Record<
      string,
      { color: "success" | "warning" | "info" | "critical"; label: string }
    > = {
      MANUAL: { color: "info", label: "Manual" },
      CYCLE_COUNT: { color: "success", label: "Cycle Count" },
    };

    const defaultType = {
      color: "info" as const,
      label: type.charAt(0).toUpperCase() + type.slice(1),
    };
    return typeMap[type] || defaultType;
  };

  const getReasonBadge = (reason: string) => {
    const reasonColors: Record<string, "success" | "warning" | "info" | "critical"> = {
      "Found": "success",
      "Initial Count": "info",
      "Damaged": "critical",
      "Lost": "critical",
      "Returned": "warning",
      "Cycle Count": "info",
      "Other": "info",
    };

    return reasonColors[reason] || "info";
  };

  const handleEdit = () => {
    router.push(`/printrove/inventory-adjustments/${id}/edit`);
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedAdjustment) return;

    setIsDeleteModalOpen(false);
    const success = await deleteAdjustmentById(selectedAdjustment.id, "admin");
    if (success) {
      router.push("/printrove/inventory-adjustments");
    }
  };

  const handleCancelDelete = () => {
    setIsDeleteModalOpen(false);
  };

  const handleBack = () => {
    router.push("/printrove/inventory-adjustments");
  };

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
              Error loading inventory adjustment details
            </Text>
            <Text as="span">{error || "Inventory adjustment not found"}</Text>
            <Button onClick={handleBack}>Back to Adjustments</Button>
          </BlockStack>
        </Card>
      </div>
    );
  }

  // Prepare data for the adjustment details table
  const adjustmentRows = [
    [
      selectedAdjustment.productName,
      selectedAdjustment.productSku,
      selectedAdjustment.binName,
      selectedAdjustment.oldQty.toString(),
      selectedAdjustment.newQty.toString(),
      (selectedAdjustment.newQty - selectedAdjustment.oldQty > 0 ? "+" : "") +
        (selectedAdjustment.newQty - selectedAdjustment.oldQty).toString(),
    ],
  ];

  // Type and reason badges
  const typeInfo = getTypeBadge(selectedAdjustment.type);
  const reasonColor = getReasonBadge(selectedAdjustment.reason);
  console.log(selectedAdjustment);

  return (
    <Page
      title={`Inventory Adjustment: ${selectedAdjustment.id.slice(-6)}`}
      titleMetadata={
        <InlineStack gap="200">
          <Badge tone={typeInfo.color}>{typeInfo.label}</Badge>
          <Badge tone={reasonColor}>{selectedAdjustment.reason}</Badge>
        </InlineStack>
      }
      primaryAction={
        <ButtonGroup>
          <Button icon={EditIcon} onClick={handleEdit}>
            Edit
          </Button>
          <Button icon={DeleteIcon} tone="critical" onClick={handleDelete}>
            Delete
          </Button>
        </ButtonGroup>
      }
    >
      <BlockStack>
        {/* Card 1: Adjustment Information */}
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Adjustment Information
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Adjustment ID
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.id}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Type
                </Text>
                <Badge tone={typeInfo.color}>{typeInfo.label}</Badge>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Reason
                </Text>
                <Badge tone={reasonColor}>{selectedAdjustment.reason}</Badge>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Adjusted By
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.adjustedBy}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Adjusted At
                </Text>
                <Text variant="bodyMd" as="p">
                  {formatDate(selectedAdjustment.adjustedAt)}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Product ID
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedAdjustment.productId}
                </Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        {/* Card 2: Product Details */}
        <div className="mt-2">
          <Card>
            <BlockStack>
              <Text variant="headingMd" as="h2">
                Product Details
              </Text>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Product Name
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
              </div>
            </BlockStack>
          </Card>
        </div>

        {/* Card 3: Quantity Changes */}
        <div className="mt-2">
          <Card>
            <BlockStack>
              <Text variant="headingMd" as="h2">
                Quantity Changes
              </Text>

              <DataTable
                columnContentTypes={["text", "text", "text", "numeric", "numeric", "numeric"]}
                headings={[
                  "Product",
                  "SKU",
                  "Bin",
                  "Old Qty",
                  "New Qty",
                  "Difference",
                ]}
                rows={adjustmentRows}
              />

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Previous Quantity
                  </Text>
                  <Text variant="headingLg" as="p" tone="subdued">
                    {selectedAdjustment.oldQty}
                  </Text>
                </div>

                <div className="text-center">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    New Quantity
                  </Text>
                  <Text variant="headingLg" as="p" tone="success">
                    {selectedAdjustment.newQty}
                  </Text>
                </div>

                <div className="text-center">
                  <Text variant="bodyMd" fontWeight="semibold" as="p">
                    Net Change
                  </Text>
                  <Text
                    variant="headingLg"
                    as="p"
                    tone={selectedAdjustment.newQty - selectedAdjustment.oldQty > 0 ? "success" : "critical"}
                  >
                    {selectedAdjustment.newQty - selectedAdjustment.oldQty > 0 ? "+" : ""}
                    {selectedAdjustment.newQty - selectedAdjustment.oldQty}
                  </Text>
                </div>
              </div>
            </BlockStack>
          </Card>
        </div>

        {/* Back Button */}
        <div className="flex justify-start mt-4">
          <Button icon={ArrowLeftIcon} onClick={handleBack}>
            Back to Inventory Adjustments
          </Button>
        </div>
      </BlockStack>

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteModalOpen}
        onClose={handleCancelDelete}
        title="Delete Inventory Adjustment"
        primaryAction={{
          content: "Delete",
          destructive: true,
          onAction: handleConfirmDelete,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleCancelDelete,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack>
            <Text variant="bodyMd" as="p">
              Are you sure you want to delete this inventory adjustment? This action cannot be undone.
            </Text>
            {selectedAdjustment && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Adjustment Details:
                </Text>
                <div className="mt-2 space-y-1">
                  <Text variant="bodySm" as="p">
                    Product: {selectedAdjustment.productName}
                  </Text>
                  <Text variant="bodySm" as="p">
                    SKU: {selectedAdjustment.productSku}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Quantity Change: {selectedAdjustment.oldQty} → {selectedAdjustment.newQty}
                  </Text>
                  <Text variant="bodySm" as="p">
                    Reason: {selectedAdjustment.reason}
                  </Text>
                </div>
              </div>
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
