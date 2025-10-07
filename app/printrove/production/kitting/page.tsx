"use client";

import React, { useEffect, useState, KeyboardEvent } from "react";
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
  Link,
  TextField,
  Icon,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { useKittingStore } from "@/store/kittingStore";
import { format } from "date-fns";

export default function KittingPage() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");

  const {
    batches,
    isLoadingBatches,
    batchesError,
    fetchKittingBatches,
    clearBatchesError,
  } = useKittingStore();

  useEffect(() => {
    fetchKittingBatches();
  }, []);

  const handleViewBatch = (batchId: string) => {
    router.push(`/printrove/production/kitting/${batchId}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && searchInput.trim()) {
      event.preventDefault();
      handleDirectSearch();
    }
  };

  const handleDirectSearch = () => {
    const searchTerm = searchInput.trim();

    // First check if the batch is in current results
    const foundBatch = batches.find(
      (batch) =>
        batch.batchId === searchTerm ||
        batch.batchNumber === searchTerm ||
        batch.binNumber === searchTerm
    );

    if (foundBatch) {
      router.push(`/printrove/production/kitting/${foundBatch.batchId}`);
    } else {
      toast.error(`No batch found with ID, number or bin: ${searchTerm}`);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  if (isLoadingBatches && batches.length === 0) {
    return (
      <Page title="Kitting">
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  const rows = batches.map((batch) => [
    formatDate(batch.createdAt),
    <Text key={`batch-${batch.batchId}-number`} variant="bodyMd" as="span">
      {batch.batchNumber || `Batch ${batch.batchId}`}
    </Text>,
    batch.binNumber || "Not assigned yet",
    <div key={`batch-${batch.batchId}-progress`} className="flex items-center">
      <Text
        variant="bodyMd"
        as="span"
      >{`${batch.itemsInBin} / ${batch.totalItems}`}</Text>
      <div className="ml-2 w-24 bg-gray-200 rounded-full h-2">
        <div
          className="bg-green-500 h-2 rounded-full"
          style={{ width: `${(batch.itemsInBin / batch.totalItems) * 100}%` }}
        ></div>
      </div>
    </div>,
    <Badge
      key={`batch-${batch.batchId}-status`}
      tone={batch.status === "In Progress" ? "attention" : "success"}
    >
      {batch.status}
    </Badge>,
    <Button
      key={`batch-${batch.batchId}-action`}
      onClick={() => handleViewBatch(batch.batchId)}
      size="slim"
    >
      View Details
    </Button>,
  ]);

  return (
    <Page title="Kitting" subtitle="Manage batches ready for kitting">
      <Toaster position="top-right" />

      {batchesError && (
        <div className="mb-4">
          <Banner title="Error" tone="critical" onDismiss={clearBatchesError}>
            {batchesError}
          </Banner>
        </div>
      )}

      <div className="mb-4">
        <div className="w-1/3">
          <div
            onKeyDown={handleKeyDown}
            tabIndex={-1}
            style={{ outline: "none" }}
          >
            <TextField
              label=""
              labelHidden
              placeholder="Enter batch ID"
              value={searchInput}
              onChange={handleSearchChange}
              prefix={<Icon source={SearchIcon} />}
              autoComplete="off"
            />
          </div>
        </div>
      </div>

      {!isLoadingBatches && batches.length === 0 ? (
        <Card padding="400">
          <EmptyState
            heading="No batches available for kitting"
            image="/empty-state.svg"
          >
            <p>There are no batches currently in the kitting process.</p>
          </EmptyState>
        </Card>
      ) : (
        <Card>
          <DataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
            ]}
            headings={[
              "Date",
              "Batch",
              "Bin Number",
              "Progress",
              "Status",
              "Actions",
            ]}
            rows={rows}
            loading={isLoadingBatches}
          />
        </Card>
      )}
    </Page>
  );
}
