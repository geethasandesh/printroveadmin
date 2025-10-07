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
} from "@shopify/polaris";
import { ArrowLeftIcon, DeleteIcon, EditIcon } from "@shopify/polaris-icons";
import { usePurchaseReceiveStore } from "@/store/usePurchaseReceiveStore";

export default function PurchaseReceiveDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { selectedReceive, isLoadingDetails, error, fetchPurchaseReceiveById } =
    usePurchaseReceiveStore();

  useEffect(() => {
    if (id) {
      fetchPurchaseReceiveById(id as string);
    }

    // Clean up when unmounting
    return () => {
      usePurchaseReceiveStore.getState().resetSelectedReceive();
    };
  }, [id, fetchPurchaseReceiveById]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { color: "success" | "warning" | "info" | "critical"; label: string }
    > = {
      completed: { color: "success", label: "Completed" },
      pending: { color: "warning", label: "Pending" },
      created: { color: "info", label: "Created" },
      deficit: { color: "critical", label: "Deficit" },
    };

    const defaultStatus = {
      color: "info" as const,
      label: status.charAt(0).toUpperCase() + status.slice(1),
    };
    return statusMap[status.toLowerCase()] || defaultStatus;
  };

  const handleEdit = () => {
    router.push(`/printrove/purchase/receivables/${id}/edit`);
  };

  const handleDelete = () => {
    // To be implemented with confirmation dialog
    if (confirm("Are you sure you want to delete this purchase receive?")) {
      // Call delete API and navigate back
      router.push("/printrove/purchase/receivables");
    }
  };

  const handleBack = () => {
    router.push("/printrove/purchase/receivables");
  };

  if (isLoadingDetails) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !selectedReceive) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Error loading purchase receive details
            </Text>
            <Text as="span">{error || "Purchase receive not found"}</Text>
            <Button onClick={handleBack}>Back to List</Button>
          </BlockStack>
        </Card>
      </div>
    );
  }

  // Prepare line items for data table
  const lineItemsRows =
    selectedReceive.line_items?.map((item, index) => {
      const totalQty = (item.received_qty || 0) + (item.rejected_qty || 0);
      return [
        item.product_name || `Product ${index + 1}`,
        totalQty.toString(),
        item.received_qty?.toString() || "0",
        item.rejected_qty?.toString() || "0",
      ];
    }) || [];

  // Status badge for the PO
  const statusInfo = getStatusBadge(selectedReceive.status);

  return (
    <Page
      title={`Purchase Receive: ${selectedReceive.purchase_receive_id || ""}`}
      titleMetadata={<Badge tone={statusInfo.color}>{statusInfo.label}</Badge>}
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
        {/* Card 1: PO Information */}
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Purchase Order Information
            </Text>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Vendor Name
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedReceive.vendor_name || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  PR Number
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedReceive.purchase_receive_id || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Status
                </Text>
                <Badge tone={statusInfo.color}>{statusInfo.label}</Badge>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Bill Number
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedReceive.bill_number || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  PO Number
                </Text>
                <Text variant="bodyMd" as="p">
                  {typeof selectedReceive.po_id === "string"
                    ? selectedReceive.po_id
                    : selectedReceive.po_id?.purchaseorder_number || selectedReceive.po_id?._id || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Date
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedReceive.date
                    ? formatDate(selectedReceive.date)
                    : "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Package Count
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedReceive.packages_count?.toString() || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Shipping Company
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedReceive.shipping_company || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" fontWeight="semibold" as="p">
                  Tracking Number
                </Text>
                <Text variant="bodyMd" as="p">
                  {selectedReceive.tracking_number || "N/A"}
                </Text>
              </div>
            </div>
          </BlockStack>
        </Card>

        {/* Card 2: Line Items */}
        <div className="mt-2">
          <Card>
            <BlockStack>
              <Text variant="headingMd" as="h2">
                Line Items
              </Text>

              {lineItemsRows.length > 0 ? (
                <DataTable
                  columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                  headings={[
                    "Product",
                    "Total Qty",
                    "Accepted Qty",
                    "Rejected Qty",
                  ]}
                  rows={lineItemsRows}
                />
              ) : (
                <Text variant="bodyMd" as="h2">
                  No line items found.
                </Text>
              )}
            </BlockStack>
          </Card>
        </div>

        {/* Back Button */}
        <div className="flex justify-start mt-4">
          <Button icon={ArrowLeftIcon} onClick={handleBack}>
            Back to Receivables
          </Button>
        </div>
      </BlockStack>
    </Page>
  );
}
