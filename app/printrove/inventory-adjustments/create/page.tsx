"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Select,
  TextField,
  Text,
  Modal,
  Checkbox,
} from "@shopify/polaris";
import { Button } from "@/app/components/Button";
import { useRouter } from "next/navigation";
import useInventoryAdjustmentStore, {
  AdjustmentReason,
  Bin,
} from "@/store/useInventoryAdjustmentStore";
import { toast } from "react-hot-toast";
import { SearchIcon } from "@shopify/polaris-icons";

export default function CreateInventoryAdjustment() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [showBinSelector, setShowBinSelector] = useState(false);
  const [searchBin, setSearchBin] = useState("");

  const {
    bins,
    selectedBins,
    inventoryItems,
    reason,
    isLoading,
    totalItems,
    currentPage,
    itemsPerPage,
    fetchBins,
    setSelectedBins,
    fetchStockByBins,
    updateQtyOnHand,
    setReason,
    saveManualAdjustments,
    resetStore,
  } = useInventoryAdjustmentStore();

  // Fetch bins on component mount
  useEffect(() => {
    fetchBins();

    // Reset store when component unmounts
    return () => {
      resetStore();
    };
  }, [fetchBins, resetStore]);

  // Fetch stock when bins selection changes
  useEffect(() => {
    if (selectedBins.length > 0) {
      fetchStockByBins();
    }
  }, [selectedBins, fetchStockByBins]);

  const handleSave = async () => {
    // Check if there are any modified items
    const hasModifiedItems = inventoryItems.some((item) => item.isModified);

    if (!hasModifiedItems) {
      toast.error("No changes to save");
      return;
    }

    if (!reason) {
      toast.error("Please select an adjustment reason");
      return;
    }

    const success = await saveManualAdjustments();
    if (success) {
      router.push("/printrove/inventory-adjustments");
    }
  };

  // Filter items by search text
  const filteredItems = searchText
    ? inventoryItems.filter(
        (item) =>
          item.productName.toLowerCase().includes(searchText.toLowerCase()) ||
          item.productSku.toLowerCase().includes(searchText.toLowerCase())
      )
    : inventoryItems;

  // Transform for Polaris Select
  const reasonOptions = [
    { label: "Damaged", value: "Damaged" },
    { label: "Found", value: "Found" },
    { label: "Lost", value: "Lost" },
    { label: "Initial Count", value: "Initial Count" },
    { label: "Returned", value: "Returned" },
    { label: "Other", value: "Other" },
  ];

  // Pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const handlePageChange = (page: number) => {
    fetchStockByBins(page);
  };

  // Filter bins by search text
  const filteredBins = searchBin
    ? bins.filter(
        (bin) =>
          bin.name.toLowerCase().includes(searchBin.toLowerCase()) ||
          bin.category.toLowerCase().includes(searchBin.toLowerCase())
      )
    : bins;

  // Toggle bin selection
  const toggleBinSelection = (binId: string) => {
    if (selectedBins.includes(binId)) {
      setSelectedBins(selectedBins.filter((id) => id !== binId));
    } else {
      setSelectedBins([...selectedBins, binId]);
    }
  };

  // Get selected bin names for display
  const getSelectedBinNames = () => {
    if (selectedBins.length === 0) return "Select bins";

    if (selectedBins.length === 1) {
      const selectedBin = bins.find((bin) => bin.id === selectedBins[0]);
      return selectedBin ? selectedBin.name : "1 bin selected";
    }

    return `${selectedBins.length} bins selected`;
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-3">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          Create Inventory Adjustment
        </Text>
      </div>

      <div className="space-y-6">
        {/* Parameters Card */}
        <Card>
          <div className="p-6">
            <div className="mb-4">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Adjustment Parameters
              </Text>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <div className="mb-1">
                  <Text variant="bodyMd" as="p" fontWeight="semibold">
                    Bins
                  </Text>
                </div>
                <button
                  onClick={() => setShowBinSelector(true)}
                  className="w-full h-10 px-4 bg-white border border-gray-300 rounded flex items-center justify-between text-left"
                >
                  <span>{getSelectedBinNames()}</span>
                  <span>▼</span>
                </button>
                <Modal
                  open={showBinSelector}
                  onClose={() => setShowBinSelector(false)}
                  title="Select Bins"
                  primaryAction={{
                    content: "Done",
                    onAction: () => setShowBinSelector(false),
                  }}
                >
                  <Modal.Section>
                    <div className="mb-4">
                      <TextField
                        label=""
                        value={searchBin}
                        onChange={(value) => setSearchBin(value)}
                        placeholder="Search bins"
                        autoComplete="off"
                        prefix={
                          <SearchIcon className="w-5 h-5 fill-gray-500" />
                        }
                      />
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {bins.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          {isLoading ? "Loading bins..." : "No bins found"}
                        </div>
                      ) : (
                        filteredBins.map((bin) => (
                          <div key={bin.id} className="mb-2">
                            <Checkbox
                              label={`${bin.name} (${bin.category})`}
                              checked={selectedBins.includes(bin.id)}
                              onChange={() => toggleBinSelection(bin.id)}
                            />
                          </div>
                        ))
                      )}
                    </div>
                  </Modal.Section>
                </Modal>
              </div>
              <div className="col-span-1">
                <Select
                  label="Adjustment Reason"
                  options={reasonOptions}
                  value={reason}
                  onChange={(value) => setReason(value as AdjustmentReason)}
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Inventory Items Card */}
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Inventory Items
              </Text>
              <div className="w-80">
                <TextField
                  label=""
                  placeholder="Search by product name or SKU"
                  value={searchText}
                  onChange={(value) => setSearchText(value)}
                  autoComplete="off"
                  prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
                />
              </div>
            </div>

            {isLoading ? (
              <div className="text-center p-6">Loading...</div>
            ) : selectedBins.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                Please select bins to view inventory
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No items found for the selected bins
              </div>
            ) : (
              <>
                {/* Table headers */}
                <div className="grid grid-cols-12 gap-4 mb-2 font-medium bg-[#F5F5F5] p-4 rounded">
                  <div className="col-span-3">Product Name</div>
                  <div className="col-span-2">SKU</div>
                  <div className="col-span-2">Bin</div>
                  <div className="col-span-2 text-right">Current Qty</div>
                  <div className="col-span-2 text-right">Qty on Hand</div>
                  <div className="col-span-1 text-right">Adjustment</div>
                </div>

                {/* Table rows */}
                {filteredItems.map((item) => {
                  const qtyDiff =
                    (item.qtyOnHand !== undefined ? item.qtyOnHand : item.qty) -
                    item.qty;

                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 gap-4 p-3 border-b ${
                        item.isModified ? "bg-yellow-50" : ""
                      }`}
                    >
                      <div className="col-span-3">{item.productName}</div>
                      <div className="col-span-2">{item.productSku}</div>
                      <div className="col-span-2">{item.binName}</div>
                      <div className="col-span-2 text-right">{item.qty}</div>
                      <div className="col-span-2 text-right">
                        <TextField
                          label=""
                          type="number"
                          value={
                            item.qtyOnHand !== undefined
                              ? item.qtyOnHand.toString()
                              : item.qty.toString()
                          }
                          onChange={(value) =>
                            updateQtyOnHand(item.id, parseInt(value) || 0)
                          }
                          autoComplete="off"
                        />
                      </div>
                      <div className="col-span-1 text-right font-medium">
                        {qtyDiff > 0 ? (
                          <span style={{ color: "#108043" }}>+{qtyDiff}</span>
                        ) : qtyDiff < 0 ? (
                          <span style={{ color: "#DE3618" }}>{qtyDiff}</span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 mt-6">
                    <Button
                      variant="primary"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Previous
                    </Button>
                    <span>
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="primary"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/printrove/inventory-adjustments")}
            className={isLoading ? "opacity-50 pointer-events-none" : ""}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={isLoading || selectedBins.length === 0}
            className={isLoading ? "opacity-50 pointer-events-none" : ""}
          >
            {isLoading ? "Saving..." : "Save Adjustments"}
          </Button>
        </div>
      </div>
    </div>
  );
}
