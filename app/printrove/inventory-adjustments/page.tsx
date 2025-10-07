"use client";

import React, { useEffect, useState } from "react";
import { Card, Text, Button, Select, TextField } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useRouter } from "next/navigation";
import GenericDataTable from "@/app/components/dataTable";
import useInventoryAdjustmentStore from "@/store/useInventoryAdjustmentStore";
import CycleCountModal from "@/components/inventory/CycleCountModal";

// Update the AdjustmentHistory interface to match the simplified API response
interface AdjustmentHistory {
  id: string;
  createdDate: string;
  stockAdjustment: string;
  createdBy: string;
  lastUpdated: string;
}

export default function InventoryAdjustmentsPage() {
  const router = useRouter();
  const [isCycleCountOpen, setIsCycleCountOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const {
    isLoading,
    adjustmentHistory,
    totalItems,
    currentPage,
    itemsPerPage,
    fetchAdjustmentHistory,
  } = useInventoryAdjustmentStore();

  useEffect(() => {
    fetchAdjustmentHistory(
      currentPage,
      typeFilter === "ALL"
        ? undefined
        : (typeFilter as "MANUAL" | "CYCLE_COUNT")
    );
  }, [fetchAdjustmentHistory, currentPage, typeFilter]);

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    fetchAdjustmentHistory(
      1,
      value === "ALL" ? undefined : (value as "MANUAL" | "CYCLE_COUNT")
    );
  };

  const formatDate = (dateString: string | Date) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleStartCycleCount = () => {
    setIsCycleCountOpen(true);
  };

  const handleNewAdjustment = () => {
    router.push("/printrove/inventory-adjustments/create");
  };

  const typeOptions = [
    { label: "All Types", value: "ALL" },
    { label: "Manual", value: "MANUAL" },
    { label: "Cycle Count", value: "CYCLE_COUNT" },
  ];

  // Format simplified adjustment history for the table
  const formattedAdjustmentHistory = adjustmentHistory.map(
    (adjustment: any) => {
      // Check if adjustment has the new simplified structure
      const isSimplified = "stockAdjustment" in adjustment;

      if (isSimplified) {
        return [
          formatDate(adjustment.createdDate),
          <span
            key="adjustment"
            className={
              adjustment.stockAdjustment.startsWith("+")
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {adjustment.stockAdjustment}
          </span>,
          adjustment.createdBy,
          formatDate(adjustment.lastUpdated),
          <Button
            key="view"
            variant="tertiary"
            onClick={() =>
              router.push(`/printrove/inventory-adjustments/${adjustment.id}`)
            }
          >
            View
          </Button>,
        ];
      } else {
        // Fallback for old format if API hasn't been updated yet
        const qtyDiff = adjustment.newQty - adjustment.oldQty;
        const formattedDiff = qtyDiff > 0 ? `+${qtyDiff}` : qtyDiff.toString();

        return [
          formatDate(adjustment.adjustedAt || new Date()),
          <span
            key="adjustment"
            className={
              qtyDiff > 0
                ? "text-green-600 font-medium"
                : "text-red-600 font-medium"
            }
          >
            {formattedDiff}
          </span>,
          adjustment.adjustedBy || "Unknown",
          formatDate(adjustment.adjustedAt || new Date()),
          <Button
            key="view"
            variant="tertiary"
            onClick={() =>
              router.push(`/printrove/inventory-adjustments/${adjustment.id}`)
            }
          >
            View
          </Button>,
        ];
      }
    }
  );

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          Inventory Adjustments
        </Text>
        <div className="flex gap-2">
          <Button onClick={handleStartCycleCount}>Start Cycle Count</Button>
          <Button variant="primary" onClick={handleNewAdjustment}>
            New Adjustment
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[200px]">
          <Select
            label=""
            options={typeOptions}
            value={typeFilter}
            onChange={handleTypeFilterChange}
            placeholder="Filter by type"
          />
        </div>
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search adjustments"
            value={searchQuery}
            onChange={(value) => setSearchQuery(value)}
            prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <GenericDataTable
          columnContentTypes={["text", "text", "text", "text", "text"]}
          headings={[
            "Created Date",
            "Stock Adjustment",
            "Created By",
            "Last Updated",
            "Actions",
          ]}
          rows={formattedAdjustmentHistory}
          isLoading={isLoading}
          emptyStateMarkup={
            <div className="text-center py-10">
              <Text
                variant="headingMd"
                as="h2"
                fontWeight="medium"
                color="subdued"
              >
                No adjustment history found
              </Text>
              <Text variant="bodyMd" as="p" color="subdued" className="mt-2">
                Create a new adjustment or try a different filter
              </Text>
            </div>
          }
          pagination={{
            hasPrevious: currentPage > 1,
            hasNext: currentPage < Math.ceil(totalItems / itemsPerPage),
            onPrevious: () =>
              fetchAdjustmentHistory(
                currentPage - 1,
                typeFilter === "ALL"
                  ? undefined
                  : (typeFilter as "MANUAL" | "CYCLE_COUNT")
              ),
            onNext: () =>
              fetchAdjustmentHistory(
                currentPage + 1,
                typeFilter === "ALL"
                  ? undefined
                  : (typeFilter as "MANUAL" | "CYCLE_COUNT")
              ),
            label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
              currentPage * itemsPerPage,
              totalItems
            )} of ${totalItems}`,
            totalCount: totalItems,
          }}
        />
      </Card>

      {/* Cycle Count Modal */}
      {isCycleCountOpen && (
        <CycleCountModal
          open={isCycleCountOpen}
          onClose={() => setIsCycleCountOpen(false)}
        />
      )}
    </div>
  );
}
