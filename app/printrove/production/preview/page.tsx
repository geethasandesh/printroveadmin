"use client";

import React, { useState, useEffect, KeyboardEvent } from "react";
import {
  Page,
  TextField,
  Card,
  Banner,
  Text,
  Icon,
  Button,
} from "@shopify/polaris";
import { SearchIcon, ViewIcon } from "@shopify/polaris-icons";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GenericDataTable from "@/app/components/dataTable";
import { usePreviewStore } from "@/store/usePreviewStore";
import { formatDate } from "@/utils/dateFormatter";

export default function PreviewPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const {
    printingRecords,
    total,
    isLoading,
    error,
    fetchPrintingRecords,
    clearError,
    getPrintingRecordByUID,
  } = usePreviewStore();

  useEffect(() => {
    fetchPrintingRecords(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery, fetchPrintingRecords]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && searchQuery.trim()) {
      event.preventDefault();
      handleDirectLookup();
    }
  };

  const handleDirectLookup = async () => {
    if (!searchQuery.trim()) return;
    const searchTerm = searchQuery.trim();

    console.log("Looking up record with UID:", searchTerm);

    // First check if the record is already in the current results
    const record = printingRecords.find((record) => record.uid === searchTerm);

    if (record) {
      console.log("Found record in current results:", record);
      router.push(`/printrove/production/preview/${record.id}`);
    } else {
      console.log("Record not found in current results, trying API lookup");

      try {
        const foundRecord = await getPrintingRecordByUID(searchTerm);
        console.log("API lookup result:", foundRecord);

        if (foundRecord && foundRecord.id) {
          console.log(
            "Navigating to:",
            `/printrove/production/preview/${foundRecord.id}`
          );
          router.push(`/printrove/production/preview/${foundRecord.id}`);
        } else {
          console.log("No record found via API");
          alert("No record found with this UID");
        }
      } catch (error) {
        console.error("Error in API lookup:", error);
      }
    }
  };

  return (
    <Page title="Printing Preview" subtitle="View records ready for printing">
      {error && (
        <div className="mb-4">
          <Banner tone="critical" title="Error" onDismiss={() => clearError()}>
            {error}
          </Banner>
        </div>
      )}

      <Card>
        <div className="p-4">
          <div className="flex items-center mb-6">
            <div className="w-1/3">
              <div onKeyDown={handleKeyDown}>
                <TextField
                  id="searchInput"
                  label="Search"
                  labelHidden
                  placeholder="Search by UID, order ID, batch or product"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoComplete="off"
                  prefix={<Icon source={SearchIcon} />}
                />
              </div>
            </div>
          </div>

          {printingRecords.length === 0 && !isLoading ? (
            <div className="text-center py-8">
              <Text as="h2" variant="headingMd">
                No printing records found
              </Text>
              <p className="mt-2 text-gray-500">
                There are no records with printing status at this time.
              </p>
            </div>
          ) : (
            <GenericDataTable
              columnContentTypes={[
                "text", // Date
                "text", // Batch Number
                "text", // UID
                "text", // Order ID
                "text", // Product Name
                "text", // Actions
              ]}
              headings={[
                "Date",
                "Batch Number",
                "UID",
                "Order ID",
                "Product Name",
                "Actions",
              ]}
              rows={printingRecords.map((record) => [
                formatDate(record.createdAt),
                record.batchNumber,
                record.uid,
                <Link
                  href={`/printrove/orders/${record.orderId}`}
                  key={record.orderId}
                  className="text-blue-600 hover:underline"
                >
                  {record.orderId}
                </Link>,
                record.productName,
                <button
                  key={`details-${record.uid}`}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
                  onClick={() =>
                    router.push(`/printrove/production/preview/${record.id}`)
                  }
                  aria-label="View details"
                  title="View details"
                >
                  <Icon source={ViewIcon} />
                </button>,
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
                )} of ${total} records`,
                totalCount: total,
              }}
              isLoading={isLoading}
            />
          )}
        </div>
      </Card>
    </Page>
  );
}
