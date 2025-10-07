"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  Icon,
  TextField,
  Toast,
  Page,
  Badge,
  Select,
  Text,
} from "@shopify/polaris";
import { ArrowLeftIcon, ArrowRightIcon } from "@shopify/polaris-icons";
import { usePickingStore } from "@/store/usePickingStore";
import { useBinStore } from "@/store/useBinStore";
import { Button } from "@/app/components/Button";

// New interfaces to match the updated API response structure
interface BinPickedFrom {
  binId: string;
  pickedQty: number;
  pickedBy: string;
  timestamp: string;
}

interface LineItem {
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  requiredQty: number;
  pickedQty: number;
  pendingQty: number;
  binsPickedFrom: BinPickedFrom[];
}

interface AuditTrailEntry {
  action: string;
  performedBy: string;
  timestamp: string;
  notes: string;
  metadata?: any;
}

interface EnhancedPicking {
  _id: string;
  batchId: string;
  batchName: string;
  date: string;
  status: "PENDING" | "COMPLETED";
  isPickingCompleted: boolean;
  lineItems: LineItem[];
  auditTrail?: AuditTrailEntry[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
}

export default function PickingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;
  const [toastActive, setToastActive] = useState(false);
  const [toastContent, setToastContent] = useState({
    message: "",
    error: false,
  });
  const [isPickingMode, setIsPickingMode] = useState(false);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [selectedBin, setSelectedBin] = useState("");

  // Track which products have been picked and their quantities
  const [pickedProducts, setPickedProducts] = useState<Record<string, number>>(
    {}
  );

  const {
    currentPicking,
    isLoading,
    getPickingById,
    getPickingStatus,
    pickingStatus,
    pickedQuantities,
    setPickedQuantity,
    markProductAsPicked,
    completePicking,
  } = usePickingStore();

  const { productBins, isLoadingProductBins, fetchBinsByProductId } =
    useBinStore();

  // Cast currentPicking to EnhancedPicking for completed pickings
  const enhancedPicking = currentPicking as unknown as EnhancedPicking;

  useEffect(() => {
    if (id) {
      // Load picking details
      getPickingById(id);

      // Also load picking status for in-progress pickings
      getPickingStatus(id);
    }
  }, [id, getPickingById, getPickingStatus]);

  // Set picking mode automatically if picking has pending products
  useEffect(() => {
    if (currentPicking && currentPicking.status === "PENDING") {
      setIsPickingMode(true);

      // Initialize picked quantities from existing data if available
      const initialPickedProducts: Record<string, number> = {};
      if (currentPicking.productsToPick) {
        currentPicking.productsToPick.forEach((product) => {
          const key = `${product.productId}-${product.variant}`;
          initialPickedProducts[key] = 0;
        });
      }
      setPickedProducts(initialPickedProducts);
    }
  }, [currentPicking]);

  // Fetch bins for the current product whenever the current item changes
  useEffect(() => {
    if (
      isPickingMode &&
      currentPicking &&
      currentPicking.productsToPick &&
      currentPicking.productsToPick[currentItemIndex]
    ) {
      const currentProduct = currentPicking.productsToPick[currentItemIndex];
      fetchBinsByProductId(currentProduct.productId);
    }
  }, [fetchBinsByProductId, isPickingMode, currentPicking, currentItemIndex]);

  // When product bins change, select the first bin by default
  useEffect(() => {
    if (productBins && productBins.length > 0) {
      setSelectedBin(productBins[0]._id);
    } else {
      setSelectedBin("");
    }
  }, [productBins]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const showToast = (message: string, error: boolean = false) => {
    setToastContent({ message, error });
    setToastActive(true);
    setTimeout(() => setToastActive(false), 5000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleBack = () => {
    router.push("/printrove/production/picking");
  };

  const handleStartPicking = () => {
    setIsPickingMode(true);
    setCurrentItemIndex(0);
  };

  const handlePreviousItem = () => {
    if (currentItemIndex > 0) {
      setCurrentItemIndex(currentItemIndex - 1);
    }
  };

  const handleNextItem = () => {
    if (
      currentPicking &&
      currentPicking.productsToPick &&
      currentItemIndex < currentPicking.productsToPick.length - 1
    ) {
      setCurrentItemIndex(currentItemIndex + 1);
    }
  };

  const handlePickedQtyChange = (value: string) => {
    if (!currentPicking) return;

    const currentProduct = currentPicking.productsToPick[currentItemIndex];
    const key = `${currentProduct.productId}-${currentProduct.variant}`;
    setPickedQuantity(key, parseInt(value) || 0);
  };

  const handleBinChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBin(e.target.value);
  };

  const handleMarkAsPicked = async () => {
    if (!currentPicking || !selectedBin) return;

    const currentProduct = currentPicking.productsToPick[currentItemIndex];
    const key = `${currentProduct.productId}-${currentProduct.variant}`;
    const pickedQty = pickedQuantities[key] || 0;

    // Find the product status in our pickingStatus array
    const productStatus = pickingStatus.find(
      (p) =>
        p.productId === currentProduct.productId &&
        p.variant === currentProduct.variant
    );

    const remainingQty = productStatus
      ? Math.max(0, productStatus.required - productStatus.picked)
      : currentProduct.qty;

    if (pickedQty <= 0) {
      showToast("Please enter a valid quantity to pick", true);
      return;
    }

    if (pickedQty > remainingQty) {
      showToast(
        `You can only pick up to ${remainingQty} units of this item`,
        true
      );
      return;
    }

    // Find the selected bin's stock quantity
    const selectedBinInfo = productBins.find((bin) => bin._id === selectedBin);
    if (!selectedBinInfo) {
      showToast("Selected bin information not found", true);
      return;
    }

    // Check if bin has enough stock
    if (pickedQty > selectedBinInfo.stockQty) {
      showToast(
        `Bin ${selectedBin} only has ${selectedBinInfo.stockQty} units available`,
        true
      );
      return;
    }

    try {
      const result = await markProductAsPicked(
        id,
        currentProduct.productId,
        currentProduct.variant,
        pickedQty,
        selectedBin
      );

      if (result.success) {
        showToast(
          `Successfully picked ${pickedQty} units of ${currentProduct.productName} from ${selectedBin}`,
          false
        );

        // Reset the picked quantity input
        setPickedQuantity(key, 0);

        // If the product is now fully picked, move to next item
        if (
          result.data?.productStatus.isFullyPicked &&
          currentItemIndex < currentPicking.productsToPick.length - 1
        ) {
          handleNextItem();
        } else {
          // Refresh the bin data for the current product as stock has changed
          fetchBinsByProductId(currentProduct.productId);
        }

        // Refresh the picking status
        await getPickingStatus(id);
      } else {
        showToast(result.message || "Failed to mark product as picked", true);
      }
    } catch (error: any) {}
  };

  const handleCompletePicking = async () => {
    if (!currentPicking) return;

    try {
      const result = await completePicking(currentPicking._id);

      if (result.success) {
        showToast("Picking completed successfully", false);
        // Navigate away or refresh the data
        router.push("/printrove/production/picking");
      } else {
        showToast(result.message || "Failed to complete picking", true);
      }
    } catch (error: any) {
      showToast("An error occurred while completing picking", true);
    }
  };

  // Check if all products are fully picked
  const areAllProductsPicked = () => {
    if (!pickingStatus.length) return false;
    return pickingStatus.every((product) => product.isFullyPicked);
  };

  if (isLoading) {
    return (
      <Page>
        <div className="h-full flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Page>
    );
  }

  if (!currentPicking) {
    return (
      <Page>
        <Card>
          <div className="p-6 text-center">
            <p className="text-lg font-medium text-gray-700">
              Picking record not found
            </p>
            <Button onClick={handleBack} className="mt-4">
              Go Back to Picking List
            </Button>
          </div>
        </Card>
      </Page>
    );
  }

  // Render the picking station UI when in picking mode
  if (isPickingMode && currentPicking.productsToPick?.length > 0) {
    const totalItems = currentPicking.productsToPick.length;
    const currentProduct = currentPicking.productsToPick[currentItemIndex];
    const key = `${currentProduct.productId}-${currentProduct.variant}`;
    const pickedQty = pickedQuantities[key] || 0;

    // Find the product status in our pickingStatus array
    const productStatus = pickingStatus.find(
      (p) =>
        p.productId === currentProduct.productId &&
        p.variant === currentProduct.variant
    );

    const remainingQty = productStatus
      ? Math.max(0, productStatus.required - productStatus.picked)
      : currentProduct.qty;

    const isCurrentProductFullyPicked = productStatus?.isFullyPicked || false;

    return (
      <Page>
        <Card>
          {/* 1. Header Row with Navigation */}
          <div className="flex justify-between items-center px-6 py-4">
            <button
              onClick={handlePreviousItem}
              disabled={currentItemIndex === 0}
              className={`p-3 rounded-full ${
                currentItemIndex === 0
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Previous item"
            >
              <Icon source={ArrowLeftIcon} />
            </button>

            <div className="font-medium text-gray-700">
              {currentItemIndex + 1} / {totalItems}
            </div>

            <button
              onClick={handleNextItem}
              disabled={currentItemIndex === totalItems - 1}
              className={`p-3 rounded-full ${
                currentItemIndex === totalItems - 1
                  ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label="Next item"
            >
              <Icon source={ArrowRightIcon} />
            </button>
          </div>

          {/* 2. Main Section */}
          <div className="px-6 py-6 border-t border-b">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Product Image */}
              <div className="flex justify-center items-center">
                <div className="bg-gray-200 rounded-lg w-full h-64 flex items-center justify-center">
                  <span className="text-gray-500">Product Image</span>
                </div>
              </div>

              {/* Right: Product Details */}
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {currentProduct.productName}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {currentProduct.variant}
                    </p>
                  </div>
                  {isCurrentProductFullyPicked && (
                    <Badge tone="success">Fully Picked</Badge>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        To Pick
                      </h3>
                      <p className="text-lg font-semibold mt-1">
                        {currentProduct.qty}
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">
                        Remaining
                      </h3>
                      <p className="text-lg font-semibold mt-1">
                        {remainingQty}
                      </p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Bin</h3>
                    <div className="mt-1">
                      {isLoadingProductBins ? (
                        <div className="p-2 text-sm text-gray-500">
                          Loading bins...
                        </div>
                      ) : productBins.length > 0 ? (
                        <select
                          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          value={selectedBin}
                          onChange={handleBinChange}
                          disabled={isCurrentProductFullyPicked}
                        >
                          {productBins.map((bin) => (
                            <option key={bin._id} value={bin._id}>
                              {bin.name} ({bin.stockQty} available)
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="p-2 text-sm text-red-500">
                          No bins with stock found for this product
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">
                      Batch ID
                    </h3>
                    <p className="font-semibold mt-1">
                      {currentPicking.batchId}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Footer Section */}
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Input field */}
              <div>
                <TextField
                  label="Pick Quantity"
                  type="number"
                  value={pickedQty.toString()}
                  onChange={handlePickedQtyChange}
                  autoComplete="off"
                  disabled={
                    isCurrentProductFullyPicked ||
                    productBins.length === 0 ||
                    isLoadingProductBins
                  }
                  helpText={`Maximum: ${remainingQty}`}
                />
              </div>

              {/* Right: Button */}
              <div className="flex items-end">
                <Button
                  variant="primary"
                  onClick={
                    isCurrentProductFullyPicked ||
                    pickedQty <= 0 ||
                    pickedQty > remainingQty ||
                    productBins.length === 0 ||
                    isLoadingProductBins ||
                    !selectedBin
                      ? undefined
                      : handleMarkAsPicked
                  }
                  className={`w-full ${
                    isCurrentProductFullyPicked ||
                    pickedQty <= 0 ||
                    pickedQty > remainingQty ||
                    productBins.length === 0 ||
                    isLoadingProductBins ||
                    !selectedBin
                      ? "opacity-50 pointer-events-none"
                      : ""
                  }`}
                >
                  {isCurrentProductFullyPicked
                    ? "Already Picked"
                    : productBins.length === 0
                    ? "No Stock Available"
                    : "Mark as Picked"}
                </Button>
              </div>
            </div>

            <div
              className="mt-6 p-4 rounded-md"
              style={{
                backgroundColor: areAllProductsPicked() ? "#ecfdf5" : "#fff9eb",
              }}
            >
              <p
                className="text-center font-medium"
                style={{
                  color: areAllProductsPicked() ? "#15803d" : "#b45309",
                }}
              >
                {areAllProductsPicked()
                  ? "All products have been picked successfully!"
                  : "Some products haven't been fully picked. Completing now may remove orders from the batch."}
              </p>
              <div className="mt-4 flex justify-center">
                <Button
                  variant="primary"
                  onClick={() => {
                    if (!areAllProductsPicked()) {
                      // Show confirmation dialog for partial picking
                      if (
                        !window.confirm(
                          "Warning: Not all products have been fully picked. This may result in some orders being removed from the batch. This action cannot be undone. Do you want to proceed?"
                        )
                      ) {
                        return;
                      }
                    }
                    handleCompletePicking();
                  }}
                  className={
                    areAllProductsPicked()
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-amber-600 hover:bg-amber-700"
                  }
                >
                  Complete Picking
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {toastActive && (
          <Toast
            content={toastContent.message}
            error={toastContent.error}
            onDismiss={() => setToastActive(false)}
          />
        )}
      </Page>
    );
  }

  // For completed pickings, use the enhanced data structure
  if (currentPicking.status === "COMPLETED" && enhancedPicking?.lineItems) {
    return (
      <Page
        backAction={{ content: "Back to Picking List", onAction: handleBack }}
        title={currentPicking.batchName || "Picking Details"}
        subtitle={`Created on ${formatDate(currentPicking.createdAt)}`}
        secondaryActions={[
          {
            content: "Print Picking List",
            onAction: handlePrint,
          },
        ]}
      >
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card>
            <div className="text-center p-4">
              <h3 className="text-sm font-medium text-gray-500">Status</h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 bg-green-100 text-green-800">
                {currentPicking.status}
              </div>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Picking Completed
              </h3>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 bg-green-100 text-green-800">
                {enhancedPicking.isPickingCompleted ? "Yes" : "Partial"}
              </div>
            </div>
          </Card>
          <Card>
            <div className="text-center p-4">
              <h3 className="text-sm font-medium text-gray-500">
                Unique Products
              </h3>
              <p className="text-xl font-semibold mt-1">
                {enhancedPicking.lineItems.length}
              </p>
            </div>
          </Card>
        </div>

        {/* Line Items - Removed border lines */}
        <Card sectioned>
          <Text as="h2" variant="headingMd">
            Line Items
          </Text>
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Required
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Picked
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pending
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {enhancedPicking.lineItems.map((item, index) => (
                  <tr
                    key={`${item.productId}-${item.variantId}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {item.productName || item.sku}
                      </div>
                      <div className="text-sm text-gray-500">
                        {item.sku}{" "}
                        {item.variantId !== "default"
                          ? `(${item.variantId})`
                          : ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {item.requiredQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-green-100 text-green-800">
                        {item.pickedQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        {item.pendingQty}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.pendingQty === 0 ? (
                        <Badge tone="success">Complete</Badge>
                      ) : item.pickedQty > 0 ? (
                        <Badge tone="attention">Partial</Badge>
                      ) : (
                        <Badge tone="warning">Not Picked</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bins Picked From */}
        <div className="mt-6">
          <Card>
            <div className="space-y-8">
              {enhancedPicking.lineItems.map((item) => (
                <div
                  key={`${item.productId}-${item.variantId}-details`}
                  className="mb-8"
                >
                  <div className="flex items-center justify-between mb-3">
                    <Text as="h3" variant="headingSm">
                      {item.productName || item.sku}
                    </Text>
                    <div>
                      {item.pendingQty === 0 ? (
                        <Badge tone="success">Complete</Badge>
                      ) : item.pickedQty > 0 ? (
                        <Badge tone="attention">Partial</Badge>
                      ) : (
                        <Badge tone="warning">Not Picked</Badge>
                      )}
                    </div>
                  </div>

                  {/* If picked from any bins, show details */}
                  {item.binsPickedFrom && item.binsPickedFrom.length > 0 ? (
                    <div className="bg-gray-50 p-4 rounded-md">
                      <Text
                        as="h4"
                        variant="bodySm"
                        fontWeight="medium"
                        color="subdued"
                      >
                        Picked from:
                      </Text>
                      <div className="mt-2 space-y-2">
                        {item.binsPickedFrom.map((binAction, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm"
                          >
                            <div>
                              <Text
                                as="span"
                                variant="bodySm"
                                fontWeight="medium"
                              >
                                Bin: {binAction.binId}
                              </Text>
                            </div>
                            <div>
                              <Text as="span" variant="bodySm">
                                Qty: {binAction.pickedQty}
                              </Text>
                            </div>
                            <div>
                              <Text as="span" variant="bodySm">
                                By: {binAction.pickedBy}
                              </Text>
                            </div>
                            <div>
                              <Text as="span" variant="bodySm" color="subdued">
                                {formatDateTime(binAction.timestamp)}
                              </Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <Text as="p" variant="bodySm" color="subdued">
                      No picking activity recorded for this product.
                    </Text>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Audit Trail */}
        {enhancedPicking.auditTrail &&
          enhancedPicking.auditTrail.length > 0 && (
            <div className="">
              <Card>
                <div className="space-y-4">
                  {enhancedPicking.auditTrail.map((entry, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <Text as="p" variant="bodyMd" fontWeight="semibold">
                            {entry.action}
                          </Text>
                          <Text as="p" variant="bodySm" color="subdued">
                            {formatDateTime(entry.timestamp)} by{" "}
                            {entry.performedBy}
                          </Text>
                        </div>
                      </div>

                      {entry.notes && (
                        <Text as="p" variant="bodyMd" className="mt-2">
                          {entry.notes}
                        </Text>
                      )}

                      {/* Show partial pick details if available */}
                      {entry.action === "PICKING_PARTIAL" &&
                        entry.metadata?.removedOrders && (
                          <div className="mt-3 border-t border-gray-200 pt-3">
                            <Text as="p" variant="bodySm" fontWeight="medium">
                              Affected Orders:
                            </Text>
                            <div className="mt-2 space-y-2">
                              {entry.metadata.removedOrders.map(
                                (order: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-2 rounded border border-gray-200 text-sm"
                                  >
                                    <div className="flex justify-between">
                                      <Text
                                        as="span"
                                        variant="bodySm"
                                        fontWeight="medium"
                                      >
                                        {order.orderCode}
                                      </Text>
                                      <Text
                                        as="span"
                                        variant="bodySm"
                                        color="critical"
                                      >
                                        Removed
                                      </Text>
                                    </div>
                                    <Text
                                      as="p"
                                      variant="bodySm"
                                      color="subdued"
                                      className="mt-1"
                                    >
                                      Reason: {order.reason}
                                    </Text>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

        {toastActive && (
          <Toast
            content={toastContent.message}
            error={toastContent.error}
            onDismiss={() => setToastActive(false)}
          />
        )}
      </Page>
    );
  }

  // Render basic picking details view for pending pickings
  return (
    <Page
      backAction={{ content: "Back to Picking List", onAction: handleBack }}
      title={currentPicking.batchName}
      subtitle={`Created on ${formatDate(currentPicking.createdAt)}`}
      secondaryActions={[
        {
          content: "Print Picking List",
          onAction: handlePrint,
        },
      ]}
      primaryAction={
        currentPicking.status === "PENDING"
          ? {
              content: "Start Picking",
              onAction: handleStartPicking,
            }
          : undefined
      }
    >
      <div className="mb-6 grid grid-cols-3 gap-4">
        <Card>
          <div className="text-center p-4">
            <h3 className="text-sm font-medium text-gray-500">Status</h3>
            <div
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2 ${
                currentPicking.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {currentPicking.status}
            </div>
          </div>
        </Card>
        <Card>
          <div className="text-center p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Total Items to Pick
            </h3>
            <p className="text-xl font-semibold mt-1">
              {currentPicking.toPick}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center p-4">
            <h3 className="text-sm font-medium text-gray-500">
              Unique Products
            </h3>
            <p className="text-xl font-semibold mt-1">
              {currentPicking.productsToPick?.length}
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Variant
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Required Qty
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Picked Qty
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y-0">
              {currentPicking.productsToPick?.map((product, index) => {
                const productKey = `${product.productId}-${product.variant}`;
                const productStatus = pickingStatus.find(
                  (p) =>
                    p.productId === product.productId &&
                    p.variant === product.variant
                );
                const pickedAmount = productStatus?.picked || 0;
                const isFullyPicked = productStatus?.isFullyPicked || false;

                return (
                  <tr
                    key={`${product.productId}-${product.variant}-${index}`}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.variant}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      <span className="px-2 py-1 rounded-full bg-blue-100 text-blue-800">
                        {product.qty}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                      <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        {pickedAmount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      {isFullyPicked ? (
                        <Badge tone="success">Complete</Badge>
                      ) : pickedAmount > 0 ? (
                        <Badge tone="attention">Partial</Badge>
                      ) : (
                        <Badge tone="warning">Not Started</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {toastActive && (
        <Toast
          content={toastContent.message}
          error={toastContent.error}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </Page>
  );
}
