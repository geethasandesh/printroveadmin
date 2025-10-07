"use client";

import React, { useEffect, useState, KeyboardEvent } from "react";
import {
  Page,
  IndexTable,
  Text,
  Card,
  Spinner,
  EmptyState,
  Checkbox,
  Banner,
  useIndexResourceState,
  LegacyCard,
  TextField,
  Pagination,
  ButtonGroup,
  Button,
  Icon,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { usePrintingStore } from "@/store/printingStore";
import { format } from "date-fns";
import debounce from "lodash/debounce";

export default function PrintingPage() {
  const {
    records,
    pagination,
    isLoading,
    isSubmitting,
    error,
    searchQuery,
    fetchPrintingRecords,
    completePrinting,
    setSearchQuery,
    clearError,
  } = usePrintingStore();

  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );

  // Fetch records on initial load
  useEffect(() => {
    fetchPrintingRecords();
  }, []);

  // Debounced search function - regular search behavior
  const debouncedSearch = debounce((value: string) => {
    setSearchQuery(value);
  }, 300);

  // Handle search input change
  const handleSearchChange = (value: string) => {
    debouncedSearch(value);
  };

  // Handle keyboard events on search field
  const handleKeyDown = async (event: KeyboardEvent<HTMLInputElement>) => {
    // If Enter key is pressed and there's text in the search box
    if (event.key === "Enter" && searchQuery.trim()) {
      event.preventDefault();

      // Attempt to treat the input as a UID for direct completion
      await handleDirectUidComplete(searchQuery.trim());
    }
  };

  // Handle direct UID completion from search box
  const handleDirectUidComplete = async (uid: string) => {
    if (!uid) return;

    // First check if the record is in the current results
    const record = records.find((record) => record.uid === uid);

    if (record) {
      // Found in current results, mark as completed
      const success = await completePrinting(record.id);
      if (success) {
        toast.success(`Record with UID ${uid} marked as completed`);
        setSearchQuery(""); // Clear the search input
        fetchPrintingRecords(); // Refresh records
      }
    } else {
      // Not found in current results, try to fetch using the pagination endpoint with exact UID
      try {
        // Save the current search query to restore it later if needed
        const currentQuery = searchQuery;

        // Use the existing fetchPrintingRecords method with the UID as search parameter
        // Instead of directly using set, we indicate loading through the fetchPrintingRecords call
        // This will automatically set isLoading to true
        await fetchPrintingRecords(1, 100, uid);

        // Check if the record was found in the results after fetching
        const foundRecord = records.find((record) => record.uid === uid);

        if (foundRecord) {
          const success = await completePrinting(foundRecord.id);
          if (success) {
            toast.success(`Record with UID ${uid} marked as completed`);
            setSearchQuery(""); // Clear the search input
            fetchPrintingRecords(); // Refresh with default parameters
          }
        } else {
          // If not found as a UID, treat as a regular search
          toast.info(
            `No record with UID ${uid} found. Showing search results instead.`
          );
          // We're already showing search results with the UID as search term
        }
      } catch (error) {
        console.error("Error processing UID:", error);
        toast.error("Failed to process record");
      }
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (pagination.hasNextPage) {
      fetchPrintingRecords(pagination.page + 1, pagination.limit);
    }
  };

  const handlePrevPage = () => {
    if (pagination.hasPrevPage) {
      fetchPrintingRecords(pagination.page - 1, pagination.limit);
    }
  };

  // Handle marking a record as completed
  const handleCompleteRecord = async (recordId: string) => {
    if (await completePrinting(recordId)) {
      // Remove from selected records if successful
      const newSelected = new Set(selectedRecords);
      newSelected.delete(recordId);
      setSelectedRecords(newSelected);
    }
  };

  // Handle marking multiple records as completed
  const handleCompleteSelected = async () => {
    // Process each selected record one by one
    for (const recordId of selectedRecords) {
      await completePrinting(recordId);
    }
    // Refresh the current page after completion
    fetchPrintingRecords(pagination.page, pagination.limit);
    // Clear selection
    setSelectedRecords(new Set());
  };

  // Handle checkbox change
  const handleCheckboxChange = (recordId: string, checked: boolean) => {
    const newSelected = new Set(selectedRecords);

    if (checked) {
      newSelected.add(recordId);
    } else {
      newSelected.delete(recordId);
    }

    setSelectedRecords(newSelected);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Set up index table resource
  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(records);

  // Render loading state
  if (isLoading && records.length === 0) {
    return (
      <Page title="Printing">
        <div className="flex items-center justify-center h-64">
          <Spinner size="large" />
        </div>
      </Page>
    );
  }

  return (
    <Page title="Printing">
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
          <div onKeyDown={handleKeyDown}>
            <TextField
              label=""
              labelHidden
              placeholder="Enter UID to mark as printed or search by any field"
              value={searchQuery}
              onChange={handleSearchChange}
              prefix={<SearchIcon />}
              autoComplete="off"
              clearButton
              onClearButtonClick={() => setSearchQuery("")}
            />
          </div>
        </div>

        {selectedRecords.size > 0 && (
          <ButtonGroup>
            <div className="flex items-center mr-2">
              <Text variant="bodyMd" as="p">
                {selectedRecords.size}{" "}
                {selectedRecords.size === 1 ? "record" : "records"} selected
              </Text>
            </div>
            <Button
              variant="primary"
              tone="success"
              disabled={isSubmitting}
              loading={isSubmitting}
              onClick={handleCompleteSelected}
            >
              Mark As Completed
            </Button>
          </ButtonGroup>
        )}
      </div>

      {!isLoading && records.length === 0 ? (
        <Card padding="5">
          <EmptyState
            heading="No printing records found"
            image="/empty-state.svg"
          >
            <p>There are no records currently in printing status.</p>
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
                { title: "Mark as Completed" },
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

                  <IndexTable.Cell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      label="Completed"
                      labelHidden
                      checked={selectedRecords.has(record.id)}
                      onChange={(checked) =>
                        handleCheckboxChange(record.id, checked)
                      }
                    />
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
