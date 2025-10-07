"use client";

import React, { useState, useEffect } from "react";
import {
  TextField,
  Select,
  Card,
  Icon,
  Checkbox,
  Toast,
} from "@shopify/polaris";
import {
  SearchIcon,
  OutboundIcon,
  PrintIcon,
  EmailIcon,
  PageDownIcon,
  ReceiptIcon, // Use Receipt icon for barcodes
} from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { useBatchStore } from "@/store/useBatchStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BatchPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [qualifiedBatches, setQualifiedBatches] = useState<
    Record<string, boolean>
  >({});
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState({
    message: "",
    error: false,
  });
  const itemsPerPage = 10;

  const {
    batches,
    total,
    isLoading,
    isDownloading,
    downloadError,
    fetchBatches,
    markBatchEligibleForPicking,
    downloadBrandingImages,
    downloadBarcodes, // Add this
  } = useBatchStore();

  useEffect(() => {
    fetchBatches(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  // Initialize qualified batches based on fetched data
  useEffect(() => {
    const initialQualifiedState: Record<string, boolean> = {};
    batches.forEach((batch) => {
      initialQualifiedState[batch._id] = !!batch.isEligibleForPicking;
    });
    setQualifiedBatches(initialQualifiedState);
  }, [batches]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const handleView = (batchId: string) => {
    router.push(`/printrove/production/batch/${batchId}`);
  };

  const handlePrint = (batchId: string) => {
    console.log("Printing batch", batchId);
    // Implement print functionality
  };

  const handleEmail = (batchId: string) => {
    console.log("Emailing batch", batchId);
    // Implement email functionality
  };

  const handleDownload = async (batchId: string) => {
    try {
      const success = await downloadBrandingImages(batchId);
      if (success) {
        showToast("Branding images downloaded successfully", false);
      } else if (downloadError) {
        showToast(downloadError, true);
      }
    } catch (error) {
      showToast("Failed to download branding images", true);
    }
  };

  // Add a handler for downloading barcodes
  const handleBarcodeDownload = async (batchId: string) => {
    try {
      const success = await downloadBarcodes(batchId);
      if (success) {
        showToast("Barcodes downloaded successfully", false);
      } else if (downloadError) {
        showToast(downloadError, true);
      }
    } catch (error) {
      showToast("Failed to download barcodes", true);
    }
  };

  const showToast = (message: string, error: boolean = false) => {
    setToastContent({ message, error });
    setToastActive(true);
    setTimeout(() => setToastActive(false), 5000);
  };

  const handleQualify = async (batchId: string, checked: boolean) => {
    if (checked) {
      try {
        setQualifiedBatches((prev) => ({ ...prev, [batchId]: true }));

        const result = await markBatchEligibleForPicking(batchId);

        if (result.success) {
          showToast("Batch marked as eligible for picking", false);

          // Refresh the batches to get updated data
          fetchBatches(currentPage, itemsPerPage, searchQuery);
        } else {
          // If the API call failed, revert the checkbox
          setQualifiedBatches((prev) => ({ ...prev, [batchId]: false }));
          showToast(result.message || "Failed to mark batch as eligible", true);
        }
      } catch (error) {
        // If there was an exception, revert the checkbox
        setQualifiedBatches((prev) => ({ ...prev, [batchId]: false }));
        showToast(
          "An error occurred while marking the batch as eligible",
          true
        );
      }
    } else {
      // We don't allow unchecking once a batch is marked as eligible
      showToast(
        "A batch cannot be unmarked once marked as eligible for picking",
        true
      );
      // Reset the checkbox to checked state
      setQualifiedBatches((prev) => ({ ...prev, [batchId]: true }));
    }
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <b className="text-2xl font-extrabold">Production Batches</b>
        {/* Create button removed as requested */}
      </div>

      <div className="flex justify-between items-center mt-4 mb-4">
        <Select
          label=""
          placeholder="Sort by date"
          value="date"
          options={[
            { label: "Sort by date", value: "date" },
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
          ]}
          onChange={() => {}}
        />
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search batches"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
            autoComplete="off"
          />
        </div>
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text",
            "text",
            "numeric",
            "numeric",
            "numeric",
            "numeric",
            "text",
            "text", // For actions column
          ]}
          headings={[
            "Batch ID",
            "Date",
            "Total",
            "To Pick",
            "To Print",
            "To QC",
            "Status",
            "Actions",
          ]}
          rows={batches.map((batch) => [
            <Link
              href="#"
              className="text-[#005BD3] underline"
              key={batch._id}
              onClick={(e) => {
                e.preventDefault();
                handleView(batch._id);
              }}
            >
              {batch.batchNumber}
            </Link>,
            formatDate(batch.createdAt),
            batch.orderIds.length, // Total orders
            0, // To Pick (placeholder)
            0, // To Print (placeholder)
            0, // To QC (placeholder)
            batch.batchStatus,
            <div
              className="flex items-center space-x-3"
              key={`actions-${batch._id}`}
            >
              <button
                onClick={() => handlePrint(batch._id)}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Print"
              >
                <Icon source={PrintIcon} />
              </button>
              <button
                onClick={() => handleEmail(batch._id)}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Email"
              >
                <Icon source={EmailIcon} />
              </button>
              <button
                onClick={() => handleDownload(batch._id)}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Download Branding Images"
              >
                <Icon source={PageDownIcon} />
              </button>
              {/* Add the new barcode button */}
              <button
                onClick={() => handleBarcodeDownload(batch._id)}
                className="p-1.5 rounded hover:bg-gray-100"
                title="Download Barcodes"
              >
                <Icon source={ReceiptIcon} />
              </button>
              <div className="ml-2">
                <Checkbox
                  label="Eligible for Picking"
                  labelHidden
                  checked={!!qualifiedBatches[batch._id]}
                  onChange={(checked) => handleQualify(batch._id, checked)}
                  disabled={!!batch.isEligibleForPicking} // Disable if already marked eligible
                />
              </div>
            </div>,
          ])}
          pagination={{
            hasPrevious: currentPage > 1,
            hasNext: currentPage < Math.ceil(total / itemsPerPage),
            onPrevious: () => setCurrentPage(currentPage - 1),
            onNext: () => setCurrentPage(currentPage + 1),
            label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
              currentPage * itemsPerPage,
              total
            )} of ${total}`,
            totalCount: total,
          }}
        />
      </Card>

      {isLoading && <div>Loading...</div>}

      {toastActive && (
        <Toast
          content={toastContent.message}
          error={toastContent.error}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </div>
  );
}
