"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Page,
  Card,
  Layout,
  TextField,
  Button,
  Text,
  Toast,
  Loading,
  EmptyState,
  Badge,
  Checkbox,
  Banner,
  Tag,
  Icon,
  Modal,
} from "@shopify/polaris";
import { BarcodeIcon, SearchIcon } from "@shopify/polaris-icons";
import { useDispatchStore } from "@/store/useDispatchStore";
import { useOrderStore } from "@/store/useOrderStore";

export default function DispatchManifestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const manifestId = params.id as string;

  // Refs
  const scannerInputRef = useRef<HTMLInputElement>(null);

  // State declarations - core manifest state
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);

  // State for modals and UI
  const [showOrderSelector, setShowOrderSelector] = useState(false);
  const [scannedOrderId, setScannedOrderId] = useState("");
  const [searchOrder, setSearchOrder] = useState("");

  // User selection tracking - separate from manifest state
  const [modalOrderSelections, setModalOrderSelections] = useState<Set<string>>(
    new Set()
  );

  // Toast notifications
  const [toastState, setToastState] = useState({
    active: false,
    content: "",
    error: false,
  });

  // Store hooks
  const {
    currentManifest,
    isLoadingDetails,
    fetchManifestDetails,
    updateManifestOrders,
    updateManifestStatus,
  } = useDispatchStore();

  const {
    allOrders,
    isLoading: isLoadingOrders,
    fetchAllOrders,
    error: allOrdersError,
  } = useOrderStore();

  // Load manifest details and orders on mount
  useEffect(() => {
    if (manifestId) {
      // Reset all state first
      setSelectedOrderIds([]);
      setModalOrderSelections(new Set());
      setToastState({ active: false, content: "", error: false });
      setScannedOrderId("");
      setSearchOrder("");

      // Then fetch fresh data
      fetchManifestDetails(manifestId);
      fetchAllOrders();
    }

    // Cleanup on unmount
    return () => {
      setSelectedOrderIds([]);
      setModalOrderSelections(new Set());
      setToastState({ active: false, content: "", error: false });
    };
  }, [manifestId]);

  // Update selected order IDs when manifest data loads
  useEffect(() => {
    if (currentManifest?.orderIds) {
      setSelectedOrderIds([...currentManifest.orderIds]);
    }
  }, [currentManifest]);

  // Auto-focus scanner input
  useEffect(() => {
    if (scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, [scannedOrderId]);

  // Handle errors loading orders
  useEffect(() => {
    if (allOrdersError) {
      showToast(`Error loading orders: ${allOrdersError}`, true);
    }
  }, [allOrdersError]);

  // When opening the modal, initialize selections from current manifest
  useEffect(() => {
    if (showOrderSelector) {
      setModalOrderSelections(new Set(selectedOrderIds));
    }
  }, [showOrderSelector]);

  // Derived state - filter orders
  const fulfillableOrders = allOrders.filter(
    (order) => order.orderStatus === "Fulfilled"
  );

  const availableOrdersForModal = fulfillableOrders.filter(
    (order) =>
      !selectedOrderIds.includes(order.orderId) ||
      modalOrderSelections.has(order.orderId)
  );

  const filteredOrdersForModal = availableOrdersForModal.filter(
    (order) =>
      !searchOrder ||
      order.orderId.toLowerCase().includes(searchOrder.toLowerCase()) ||
      (order.shippingAddress?.fullName &&
        order.shippingAddress.fullName
          .toLowerCase()
          .includes(searchOrder.toLowerCase()))
  );

  // Helper functions
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const showToast = (content: string, error = false) => {
    setToastState({
      active: true,
      content,
      error,
    });

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToastState((prev) => ({ ...prev, active: false }));
    }, 4000);
  };

  // Order scanning handler
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!scannedOrderId.trim()) return;

    // Validate the order exists and is fulfillable
    const orderToAdd = fulfillableOrders.find(
      (order) => order.orderId === scannedOrderId.trim()
    );

    if (!orderToAdd) {
      const existsButNotFulfillable = allOrders.some(
        (order) => order.orderId === scannedOrderId.trim()
      );

      if (existsButNotFulfillable) {
        showToast(`Order ${scannedOrderId} is not fulfillable yet`, true);
      } else {
        showToast(`Order ${scannedOrderId} not found`, true);
      }

      setScannedOrderId("");
      return;
    }

    // Check if already in manifest
    if (selectedOrderIds.includes(scannedOrderId.trim())) {
      showToast(`Order ${scannedOrderId} is already in the manifest`, true);
      setScannedOrderId("");
      return;
    }

    // Add to manifest
    const updatedOrderIds = [...selectedOrderIds, scannedOrderId.trim()];
    setSelectedOrderIds(updatedOrderIds);
    showToast(`Order ${scannedOrderId} added to manifest`);
    setScannedOrderId("");

    // Save to server
    saveManifestChanges(updatedOrderIds);
  };

  // Order removal handler
  const handleRemoveOrder = (orderId: string) => {
    const updatedOrderIds = selectedOrderIds.filter((id) => id !== orderId);
    setSelectedOrderIds(updatedOrderIds);

    // Remove from modal selections if present
    if (modalOrderSelections.has(orderId)) {
      const newSelections = new Set(modalOrderSelections);
      newSelections.delete(orderId);
      setModalOrderSelections(newSelections);
    }

    // Save to server
    saveManifestChanges(updatedOrderIds);
    showToast(`Order ${orderId} removed from manifest`);
  };

  // Modal checkbox toggle handler
  const handleOrderSelectionToggle = (orderId: string) => {
    const newSelections = new Set(modalOrderSelections);

    if (newSelections.has(orderId)) {
      newSelections.delete(orderId);
    } else {
      newSelections.add(orderId);
    }

    setModalOrderSelections(newSelections);
  };

  // Apply modal selections to manifest
  const handleApplyModalSelections = () => {
    // Find orders that were in the manifest but not available in the modal
    const ordersNotInModal = selectedOrderIds.filter(
      (id) => !availableOrdersForModal.some((order) => order.orderId === id)
    );

    // Combine with the new selections
    const updatedOrderIds = [
      ...ordersNotInModal,
      ...Array.from(modalOrderSelections),
    ];

    // Update state and save
    setSelectedOrderIds(updatedOrderIds);
    saveManifestChanges(updatedOrderIds);

    // Close modal and show confirmation
    setShowOrderSelector(false);

    const addedCount =
      modalOrderSelections.size -
      selectedOrderIds.filter((id) => modalOrderSelections.has(id)).length;

    if (addedCount > 0) {
      showToast(
        `Added ${addedCount} order${addedCount > 1 ? "s" : ""} to manifest`
      );
    } else if (addedCount < 0) {
      showToast(`Updated manifest orders`);
    }

    // Reset modal selections to avoid stale state
    setModalOrderSelections(new Set());
  };

  // Select or deselect all orders in modal
  const handleSelectAll = (select: boolean) => {
    if (select) {
      const allOrderIds = new Set(
        filteredOrdersForModal.map((order) => order.orderId)
      );
      setModalOrderSelections(allOrderIds);
    } else {
      setModalOrderSelections(new Set());
    }
  };

  // Save changes to server
  const saveManifestChanges = async (orderIds: string[]) => {
    if (!manifestId) return;

    setIsSubmitting(true);

    try {
      const success = await updateManifestOrders(manifestId, orderIds);

      if (success) {
        // Refresh manifest details silently
        await fetchManifestDetails(manifestId);
      } else {
        showToast("Failed to update manifest", true);
      }
    } catch (error) {
      console.error("Error updating manifest:", error);
      showToast("An error occurred while updating manifest", true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle marking the manifest as complete
  const handleMarkComplete = async () => {
    if (!manifestId) return;

    if (selectedOrderIds.length === 0) {
      showToast("Cannot mark as complete: No orders in manifest", true);
      return;
    }

    setIsMarkingComplete(true);

    try {
      const success = await updateManifestStatus(manifestId, "COMPLETED");

      if (success) {
        showToast("Manifest marked as complete");

        // Navigate back after delay
        setTimeout(() => {
          router.push("/printrove/production/dispatch");
        }, 1500);
      } else {
        showToast("Failed to mark manifest as complete", true);
      }
    } catch (error) {
      console.error("Error completing manifest:", error);
      showToast("An error occurred", true);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Status badge color helper
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "info";
      case "PROCESSING":
        return "warning";
      case "COMPLETED":
        return "success";
      case "CANCELLED":
        return "critical";
      default:
        return "info";
    }
  };

  // Loading state
  if (isLoadingDetails) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5] flex items-center justify-center">
        <Loading />
        <div className="ml-3">Loading manifest details...</div>
      </div>
    );
  }

  // Not found state
  if (!currentManifest) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5]">
        <EmptyState
          heading="Manifest not found"
          image="/empty-state.svg"
          action={{
            content: "Back to Dispatch",
            onAction: () => router.push("/printrove/production/dispatch"),
          }}
        >
          <p>
            The manifest you're looking for doesn't exist or has been deleted.
          </p>
        </EmptyState>
      </div>
    );
  }

  // Main render
  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <Page
        backAction={{
          content: "Dispatch",
          onAction: () => router.push("/printrove/production/dispatch"),
        }}
        title="Dispatch Manifest Details"
        primaryAction={{
          content: "Mark as Complete",
          disabled:
            isMarkingComplete ||
            selectedOrderIds.length === 0 ||
            currentManifest.status === "COMPLETED",
          loading: isMarkingComplete,
          onAction: handleMarkComplete,
        }}
      >
        <Layout>
          {/* Manifest details card */}
          <Layout.Section>
            <Card>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Text variant="headingXs" as="h3">
                      Manifest ID
                    </Text>
                    <Text variant="bodyLg" as="p">
                      {currentManifest.manifestId}
                    </Text>
                  </div>
                  <div>
                    <Text variant="headingXs" as="h3">
                      Created Date
                    </Text>
                    <Text variant="bodyLg" as="p">
                      {formatDate(currentManifest.createdTime)}
                    </Text>
                  </div>
                  <div>
                    <Text variant="headingXs" as="h3">
                      Pickup Person
                    </Text>
                    <Text variant="bodyLg" as="p">
                      {currentManifest.pickupPerson} (
                      {currentManifest.pickupPersonNumber})
                    </Text>
                  </div>
                  <div>
                    <Text variant="headingXs" as="h3">
                      Courier & Status
                    </Text>
                    <div className="flex gap-2 items-center">
                      <Text variant="bodyLg" as="p">
                        {currentManifest.shippingCompany}
                      </Text>
                      <Badge tone={getStatusColor(currentManifest.status)}>
                        {currentManifest.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Show banner if manifest is complete */}
          {currentManifest.status === "COMPLETED" && (
            <Layout.Section>
              <Banner
                tone="success"
                title="This manifest has been marked as complete"
              >
                <p>
                  This dispatch manifest has been finalized and orders have been
                  marked for dispatch.
                </p>
              </Banner>
            </Layout.Section>
          )}

          {/* Barcode scanner section */}
          <Layout.Section>
            <Card>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Icon source={BarcodeIcon} />
                  <Text variant="headingMd" as="h2">
                    Scan Order Barcode
                  </Text>
                </div>

                <form onSubmit={handleScanSubmit}>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <TextField
                        label=""
                        placeholder="Scan or enter Order ID"
                        value={scannedOrderId}
                        onChange={setScannedOrderId}
                        autoComplete="off"
                        disabled={currentManifest.status === "COMPLETED"}
                        helpText="Scanned orders will be automatically added to the manifest"
                        autoFocus
                        ref={scannerInputRef}
                      />
                    </div>
                    <div className="self-end">
                      <Button
                        submit
                        disabled={
                          !scannedOrderId.trim() ||
                          currentManifest.status === "COMPLETED"
                        }
                      >
                        Add Order
                      </Button>
                    </div>
                  </div>
                </form>
              </div>
            </Card>
          </Layout.Section>

          {/* Manifest summary section */}
          <Layout.Section>
            <Card>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <Text variant="headingMd" as="h2">
                    Manifest Orders ({selectedOrderIds.length})
                  </Text>
                </div>

                {selectedOrderIds.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto border rounded p-4">
                    <div className="flex flex-wrap gap-2">
                      {selectedOrderIds.map((orderId) => (
                        <Tag
                          key={orderId}
                          onRemove={
                            currentManifest.status !== "COMPLETED"
                              ? () => handleRemoveOrder(orderId)
                              : undefined
                          }
                        >
                          {orderId}
                        </Tag>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Banner tone="warning">
                    <p>
                      No orders have been added to this manifest yet. Scan an
                      order barcode or select orders below.
                    </p>
                  </Banner>
                )}
              </div>
            </Card>
          </Layout.Section>

          {/* Available orders section */}
          <Layout.Section>
            <Card>
              <div className="p-5">
                <div className="flex justify-between items-center mb-4">
                  <Text variant="headingMd" as="h2">
                    Available Orders
                  </Text>
                  <Button
                    onClick={() => setShowOrderSelector(true)}
                    disabled={currentManifest.status === "COMPLETED"}
                  >
                    Select Orders
                  </Button>
                </div>

                <div className="mb-4">
                  <Text
                    variant="bodyMd"
                    as="p"
                    fontWeight="medium"
                    color="subdued"
                  >
                    {fulfillableOrders.length === 0
                      ? "No fulfillable orders available"
                      : `${fulfillableOrders.length} fulfillable orders available`}
                  </Text>
                  <Text variant="bodyMd" as="p" color="subdued">
                    Click "Select Orders" to choose which orders to add to this
                    manifest.
                  </Text>
                </div>
              </div>
            </Card>
          </Layout.Section>

          {/* Order Selector Modal */}
          <Modal
            open={showOrderSelector}
            onClose={() => {
              setShowOrderSelector(false);
              setModalOrderSelections(new Set());
              setSearchOrder("");
            }}
            title="Select Orders for Manifest"
            primaryAction={{
              content: "Add Selected Orders",
              onAction: handleApplyModalSelections,
              disabled:
                modalOrderSelections.size === 0 ||
                currentManifest.status === "COMPLETED",
            }}
            secondaryActions={[
              {
                content: "Cancel",
                onAction: () => {
                  setShowOrderSelector(false);
                  setModalOrderSelections(new Set());
                  setSearchOrder("");
                },
              },
            ]}
          >
            <Modal.Section>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <TextField
                    label=""
                    value={searchOrder}
                    onChange={(value) => setSearchOrder(value)}
                    placeholder="Search orders by ID or customer name"
                    autoComplete="off"
                    prefix={<Icon source={SearchIcon} />}
                  />
                  <div className="flex gap-2 items-center pt-1">
                    <Button size="slim" onClick={() => handleSelectAll(true)}>
                      Select All
                    </Button>
                    <Button size="slim" onClick={() => handleSelectAll(false)}>
                      Clear
                    </Button>
                  </div>
                </div>

                {isLoadingOrders ? (
                  <div className="text-center py-8">
                    <span className="inline-block w-8 h-8 border-4 border-t-blue-600 rounded-full animate-spin"></span>
                    <p className="mt-2 text-gray-500">Loading orders...</p>
                  </div>
                ) : (
                  <div>
                    <div className="grid grid-cols-12 gap-4 mb-2 font-medium bg-[#F5F5F5] p-4 rounded">
                      <div className="col-span-1"></div>
                      <div className="col-span-3">Order ID</div>
                      <div className="col-span-4">Customer</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2">Status</div>
                    </div>

                    {filteredOrdersForModal.length === 0 ? (
                      <div className="text-center py-6 text-gray-500">
                        {searchOrder
                          ? "No orders matching your search"
                          : "No fulfilled orders available"}
                      </div>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        {filteredOrdersForModal.map((order) => (
                          <div
                            key={order.orderId}
                            className={`grid grid-cols-12 gap-4 p-3 border-b hover:bg-gray-50 ${
                              modalOrderSelections.has(order.orderId)
                                ? "bg-blue-50"
                                : ""
                            }`}
                            onClick={() =>
                              handleOrderSelectionToggle(order.orderId)
                            }
                            style={{ cursor: "pointer" }}
                          >
                            <div
                              className="col-span-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Checkbox
                                checked={modalOrderSelections.has(
                                  order.orderId
                                )}
                                onChange={() =>
                                  handleOrderSelectionToggle(order.orderId)
                                }
                                label=""
                              />
                            </div>
                            <div className="col-span-3">
                              <Text
                                variant="bodyMd"
                                as="span"
                                fontWeight="bold"
                              >
                                {order.orderId}
                              </Text>
                            </div>
                            <div className="col-span-4">
                              {order.shippingAddress?.fullName || "N/A"}
                            </div>
                            <div className="col-span-2">
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="col-span-2">
                              <Badge>{order.orderStatus}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {filteredOrdersForModal.length > 0 && (
                      <div className="mt-4 text-right">
                        <Text variant="bodyMd">
                          {modalOrderSelections.size} order
                          {modalOrderSelections.size !== 1 ? "s" : ""} selected
                        </Text>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Modal.Section>
          </Modal>
        </Layout>

        {/* Toast notification */}
        {toastState.active && (
          <Toast
            content={toastState.content}
            error={toastState.error}
            onDismiss={() =>
              setToastState((prev) => ({ ...prev, active: false }))
            }
            duration={4000}
          />
        )}
      </Page>
    </div>
  );
}
