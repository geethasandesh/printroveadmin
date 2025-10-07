"use client";

import React, { useEffect, useState } from "react";
import {
  Page,
  Card,
  Text,
  TextField,
  EmptyState,
  Banner,
} from "@shopify/polaris";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/Button";
import GenericDataTable from "@/app/components/dataTable";
import { formatDate } from "@/utils/dateFormatter";
import { usePutbackStore } from "@/store/usePutbackStore";

export default function PutbackPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const {
    pendingPutbacks,
    total,
    isLoading,
    error,
    fetchPendingPutbacks,
    clearError,
  } = usePutbackStore();

  useEffect(() => {
    fetchPendingPutbacks(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery, fetchPendingPutbacks]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const navigateToDetails = (pickingId: string) => {
    router.push(`/printrove/production/putback/${pickingId}`);
  };

  // Status badge for putback completion
  const getCompletionStatus = (total: number, completed: number) => {
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    if (percentage === 0) {
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
          Not Started
        </span>
      );
    } else if (percentage === 100) {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
          Completed
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
          In Progress ({percentage}%)
        </span>
      );
    }
  };

  return (
    <Page
      title="Putback Management"
      subtitle="Manage surplus items from picking operations"
    >
      {error && (
        <div className="mb-4">
          <Banner tone="critical" title="Error" onDismiss={() => clearError()}>
            {error}
          </Banner>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="p-4 text-center">
            <Text as="h2" variant="headingSm">
              Total Pending Putbacks
            </Text>
            <p className="text-2xl font-semibold mt-2">{total}</p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <Text as="h2" variant="headingSm">
              Putback Items
            </Text>
            <p className="text-2xl font-semibold mt-2">
              {pendingPutbacks.reduce(
                (sum, batch) => sum + batch.itemsToPutback,
                0
              )}
            </p>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <Text as="h2" variant="headingSm">
              Already Putback
            </Text>
            <p className="text-2xl font-semibold mt-2">
              {pendingPutbacks.reduce(
                (sum, batch) => sum + batch.alreadyPutback,
                0
              )}
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="w-1/3">
                <TextField
                  label="Search batches"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  placeholder="Enter batch name or ID..."
                  labelHidden
                />
              </div>
              <div>
                <Button
                  variant="primary"
                  onClick={() =>
                    fetchPendingPutbacks(currentPage, itemsPerPage, searchQuery)
                  }
                >
                  Refresh
                </Button>
              </div>
            </div>

            {pendingPutbacks.length === 0 && !isLoading ? (
              <div className="text-center py-8">
                <Text as="h2" variant="headingMd">
                  No pending putbacks
                </Text>
                <p className="mt-2 text-gray-500">
                  There are no batches with pending putbacks at this time.
                </p>
              </div>
            ) : (
              <GenericDataTable
                columnContentTypes={[
                  "text", // Batch Name
                  "text", // Date
                  "numeric", // Total Items
                  "numeric", // Items Putback
                  "text", // Status
                  "text", // Actions
                ]}
                headings={[
                  "Batch Name",
                  "Date",
                  "Total Surplus",
                  "Already Putback",
                  "Status",
                  "Actions",
                ]}
                rows={pendingPutbacks.map((batch) => [
                  batch.batchName,
                  formatDate(batch.date),
                  batch.totalSurplusItems,
                  batch.alreadyPutback,
                  getCompletionStatus(
                    batch.itemsToPutback,
                    batch.alreadyPutback
                  ),
                  <Button
                    key={batch.pickingId}
                    onClick={() => navigateToDetails(batch.pickingId)}
                    size="sm"
                  >
                    Process Putback
                  </Button>,
                ])}
                pagination={{
                  hasNext: currentPage * itemsPerPage < total,
                  hasPrevious: currentPage > 1,
                  onNext: () => setCurrentPage((prev) => prev + 1),
                  onPrevious: () => setCurrentPage((prev) => prev - 1),
                  label: `${Math.min(
                    (currentPage - 1) * itemsPerPage + 1,
                    total
                  )}-${Math.min(
                    currentPage * itemsPerPage,
                    total
                  )} of ${total} putbacks`,
                  totalCount: total,
                }}
                isLoading={isLoading}
              />
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
