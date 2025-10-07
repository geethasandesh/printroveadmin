"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Page,
  IndexTable,
  Text,
  Card,
  Spinner,
  EmptyState,
  Banner,
  TextField,
  Pagination,
  Button,
  ButtonGroup,
  LegacyCard,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { Toaster } from "react-hot-toast";
import { useQCStore } from "@/store/qcStore";
import { format } from "date-fns";
import debounce from "lodash/debounce";

export default function QCPage() {
  const router = useRouter();
  const {
    records,
    pagination,
    isLoading,
    error,
    searchQuery,
    fetchQCRecords,
    setSearchQuery,
    clearError,
  } = useQCStore();

  // Fetch records on initial load
  useEffect(() => {
    fetchQCRecords();
  }, []);

  // Debounced search function
  const debouncedSearch = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  // Handle pagination
  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      fetchQCRecords(pagination.page + 1, pagination.limit);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      fetchQCRecords(pagination.page - 1, pagination.limit);
    }
  };

  // Handle view details
  const handleViewDetails = (recordId: string) => {
    router.push(`/printrove/production/qc/${recordId}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Render loading state
  if (isLoading && records.length === 0) {
    return (
      <Page title="Quality Control">
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Quality Control">
      <Toaster position="top-right" />

      {error && (
        <div className="mb-4">
          <Banner title="Error" tone="critical" onDismiss={clearError}>
            {error}
          </Banner>
        </div>
      )}

      <div className="mb-4 flex justify-between items-center">
        <div className="w-1/3">
          <TextField
            label=""
            labelHidden
            placeholder="Search by UID, Order ID, or Product Name"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon />}
            autoComplete="off"
            clearButton
            onClearButtonClick={() => setSearchQuery("")}
          />
        </div>
      </div>

      {!isLoading && records.length === 0 ? (
        <Card>
          <EmptyState heading="No QC records found" image="/empty-state.svg">
            <p>There are no records currently in quality control.</p>
          </EmptyState>
        </Card>
      ) : (
        <>
          <LegacyCard>
            <IndexTable
              resourceName={{ singular: "record", plural: "records" }}
              itemCount={records.length}
              headings={[
                { title: "Date" },
                { title: "UID" },
                { title: "Batch" },
                { title: "Product" },
                { title: "Action" },
              ]}
              selectable={false}
              loading={isLoading}
            >
              {records.map((record, index) => (
                <IndexTable.Row id={record.id} key={record.id} position={index}>
                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {formatDate(record.createdAt)}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {record.uid || "N/A"}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {record.batchNumber}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Text variant="bodyMd" as="span">
                      {record.productName}
                    </Text>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Button
                      onClick={() => handleViewDetails(record.id)}
                      size="slim"
                    >
                      View
                    </Button>
                  </IndexTable.Cell>
                </IndexTable.Row>
              ))}
            </IndexTable>
          </LegacyCard>

          {pagination.total > 0 && (
            <div className="mt-4 flex justify-center">
              <Pagination
                hasPrevious={pagination.hasPrevPage}
                onPrevious={handlePrevPage}
                hasNext={pagination.hasNextPage}
                onNext={handleNextPage}
                label={`${
                  (pagination.page - 1) * pagination.limit + 1
                }-${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total}`}
              />
            </div>
          )}
        </>
      )}
    </Page>
  );
}
