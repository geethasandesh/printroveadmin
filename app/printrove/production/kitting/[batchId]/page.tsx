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
  Button,
  ButtonGroup,
} from "@shopify/polaris";
import { Toaster } from "react-hot-toast";
import { useKittingStore } from "@/store/kittingStore";

export default function KittingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId as string;

  const {
    currentBatch,
    isLoadingBatchDetails,
    batchDetailsError,
    isSubmittingAction,
    fetchBatchDetails,
    markAsKitted,
    clearBatchDetailsError,
    clearCurrentBatch,
    completeKittingBatch,
  } = useKittingStore();

  useEffect(() => {
    if (batchId) {
      fetchBatchDetails(batchId);
    }

    return () => {
      // Clear current batch on unmount
      clearCurrentBatch();
    };
  }, [batchId]);

  const handleMarkAsKitted = async (planId: string) => {
    await markAsKitted(planId);
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleCompleteBatch = async () => {
    if (batchId) {
      await completeKittingBatch(batchId);
      router.back();
    }
  };

  if (isLoadingBatchDetails && !currentBatch) {
    return (
      <Page
        title="Batch Details"
        backAction={{ content: "Back", onAction: handleGoBack }}
      >
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  if (batchDetailsError) {
    return (
      <Page
        title="Batch Details"
        backAction={{ content: "Back", onAction: handleGoBack }}
      >
        <Banner
          title="Error"
          tone="critical"
          onDismiss={clearBatchDetailsError}
        >
          {batchDetailsError}
        </Banner>
      </Page>
    );
  }

  if (!currentBatch || !currentBatch.planningRecords) {
    return (
      <Page
        title="Batch Details"
        backAction={{ content: "Back", onAction: handleGoBack }}
      >
        <Card>
          <div className="p-5 text-center">
            <Text variant="bodyLg">No batch details available</Text>
          </div>
        </Card>
      </Page>
    );
  }

  // Get count of pending QC items
  const qcItems = currentBatch.planningRecords.filter(
    (record) => record.planningStatus === "QC"
  ).length;
  const hasKittingItems = qcItems > 0;

  // Simplified rows with only S.No, UID, Product Name, and Status
  const rows = currentBatch.planningRecords.map((record, index) => [
    index + 1, // S.No
    record.uid || "N/A",
    record.product?.name || "Unknown Product",
    <Badge
      key={`record-${record._id}-status`}
      status={record.planningStatus === "QC" ? "attention" : "success"}
    >
      {record.planningStatus}
    </Badge>,
  ]);

  return (
    <Page
      title="Batch Kitting Details"
      backAction={{ content: "Back", onAction: handleGoBack }}
    >
      <Toaster position="top-right" />

      {/* Action Buttons at the Top */}
      <div className="mb-4 flex justify-between items-center">
        {hasKittingItems ? (
          <Button
            onClick={() => {
              // Mark all QC items as kitted
              currentBatch.planningRecords
                .filter((record) => record.planningStatus === "QC")
                .forEach((record) => handleMarkAsKitted(record._id));
            }}
            primary
            loading={isSubmittingAction}
            disabled={isSubmittingAction}
          >
            Mark All as Kitted
          </Button>
        ) : (
          <div></div> // Empty placeholder to maintain flex layout
        )}

        <ButtonGroup>
          <Button onClick={handleGoBack}>Cancel</Button>
          <Button
            primary
            onClick={handleCompleteBatch}
            disabled={hasKittingItems || isSubmittingAction}
          >
            Complete Batch
          </Button>
        </ButtonGroup>
      </div>

      {/* Simplified DataTable */}
      <Card>
        <DataTable
          columnContentTypes={["numeric", "text", "text", "text"]}
          headings={["S.No", "UID", "Product Name", "Status"]}
          rows={rows}
          footerContent={
            rows.length > 0
              ? `Showing ${rows.length} of ${rows.length} items`
              : undefined
          }
        />
      </Card>
    </Page>
  );
}
