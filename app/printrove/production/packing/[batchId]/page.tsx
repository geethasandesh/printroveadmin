"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Page,
  Card,
  DataTable,
  Text,
  Badge,
  Spinner,
  Banner,
  EmptyState,
  Link,
} from "@shopify/polaris";
import { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { usePackingStore } from "@/store/packingStore";

export default function BatchPackingPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  const {
    currentBatch,
    isLoadingBatchOrders,
    batchOrdersError,
    fetchBatchOrders,
    clearErrors,
    clearCurrentBatch,
  } = usePackingStore();

  useEffect(() => {
    if (batchId) {
      fetchBatchOrders(batchId);
    }

    return () => {
      // Clear current batch on unmount
      clearCurrentBatch();
    };
  }, [batchId, fetchBatchOrders, clearCurrentBatch]);

  const handleGoBack = () => {
    router.back();
  };

  const handleViewOrderDetails = (orderId: string) => {
    router.push(`/printrove/orders/details/${orderId}`);
  };

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  if (isLoadingBatchOrders && (!currentBatch || !currentBatch.batchDetails)) {
    return (
      <Page
        title="Batch Packing"
        backAction={{ content: "Back", onAction: handleGoBack }}
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (batchOrdersError) {
    return (
      <Page
        title="Batch Packing"
        backAction={{ content: "Back", onAction: handleGoBack }}
      >
        <Banner title="Error" tone="critical" onDismiss={clearErrors}>
          {batchOrdersError}
        </Banner>
      </Page>
    );
  }

  const { orders = [] } = currentBatch;

  const rows = orders.map((order) => [
    formatDate(order.createdAt),
    <Link
      key={`order-${order._id}`}
      onClick={() => handleViewOrderDetails(order._id)}
    >
      {order.orderId}
    </Link>,
    order.merchant.name,
    order.totalItems,
    <Badge
      key={`status-${order.orderId}`}
      tone={order.packingStatus === "Completed" ? "success" : "attention"}
    >
      {order.packingStatus}
    </Badge>,
  ]);

  const batchNumber = currentBatch.batchDetails?.batchNumber || "";

  return (
    <Page
      title={`Pack Batch: ${batchNumber}`}
      backAction={{ content: "Back", onAction: handleGoBack }}
    >
      <Toaster position="top-right" />

      <Card>
        {orders.length === 0 ? (
          <EmptyState
            heading="No orders in this batch"
            image="/empty-state.svg"
          >
            <p>This batch doesn't have any orders for packing.</p>
          </EmptyState>
        ) : (
          <DataTable
            columnContentTypes={["text", "text", "text", "numeric", "text"]}
            headings={["Date", "Order ID", "Merchant", "Total Items", "Status"]}
            rows={rows}
            footerContent={
              rows.length > 0
                ? `Showing ${rows.length} of ${rows.length} orders`
                : undefined
            }
          />
        )}
      </Card>
    </Page>
  );
}
