"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Page,
  Card,
  DataTable,
  Text,
  Badge,
  Spinner,
  Banner,
  EmptyState,
  Button,
} from "@shopify/polaris";
import { Toaster } from "react-hot-toast";
import { format } from "date-fns";
import { usePackingStore } from "@/store/packingStore";

export default function PackingPage() {
  const router = useRouter();

  const {
    batches,
    isLoadingBatches,
    batchesError,
    fetchPackingBatches,
    clearErrors,
  } = usePackingStore();

  useEffect(() => {
    fetchPackingBatches();
  }, [fetchPackingBatches]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid date";
    }
  };

  const handleViewBatch = (batchId: string) => {
    router.push(`/printrove/production/packing/${batchId}`);
  };

  if (isLoadingBatches && batches.length === 0) {
    return (
      <Page title="Packing" fullWidth>
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  const rows = batches.map((batch) => [
    batch.batchNumber,
    batch.type || "Standard",
    formatDate(batch.fromDate),
    formatDate(batch.toDate),
    batch.totalOrders,
    batch.totalItems,
    <Button
      key={`view-${batch._id}`}
      onClick={() => handleViewBatch(batch._id)}
    >
      View Orders
    </Button>,
  ]);

  return (
    <Page title="Packing" fullWidth>
      <Toaster position="top-right" />

      {batchesError && (
        <div className="mb-4">
          <Banner title="Error" tone="critical" onDismiss={clearErrors}>
            {batchesError}
          </Banner>
        </div>
      )}

      <Card>
        {batches.length === 0 ? (
          <EmptyState
            heading="No batches ready for packing"
            image="/empty-state.svg"
          >
            <p>
              Once batches complete the kitting stage, they will appear here for
              packing.
            </p>
          </EmptyState>
        ) : (
          <DataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "text",
              "numeric",
              "numeric",
              "text",
            ]}
            headings={[
              "Batch Number",
              "Type",
              "From Date",
              "To Date",
              "Orders",
              "Items",
              "Actions",
            ]}
            rows={rows}
            footerContent={
              rows.length > 0
                ? `Showing ${rows.length} of ${rows.length} batches`
                : undefined
            }
          />
        )}
      </Card>
    </Page>
  );
}
