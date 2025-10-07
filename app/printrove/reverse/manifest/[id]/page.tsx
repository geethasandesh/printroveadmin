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
  Icon,
  Banner,
  DataTable,
  Select,
} from "@shopify/polaris";
import { BarcodeIcon, DeleteIcon } from "@shopify/polaris-icons";
import { useReverseManifestStore } from "@/store/useReverseManifestStore";
import apiClient from "@/apiClient";

export default function ReverseManifestDetailPage() {
  // Get URL params and router
  const params = useParams();
  const router = useRouter();
  const manifestId = params.id as string;

  // Refs for focus management
  const scannerInputRef = useRef<HTMLInputElement>(null);

  // Component state
  const [scannedOrderId, setScannedOrderId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingProducts, setIsSavingProducts] = useState(false);
  const [activeToast, setActiveToast] = useState({
    active: false,
    content: "",
    error: false,
  });
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  const [inventoryTypes, setInventoryTypes] = useState<
    Record<string, Record<string, string>>
  >({});
  const [isRemovingOrder, setIsRemovingOrder] = useState("");
  const [localScannedOrders, setLocalScannedOrders] = useState<Record<string, any>>({}); // changed from localScannedOrder

  // Fetch data from store
  const {
    currentManifest,
    isLoadingDetails,
    fetchManifestDetails,
    updateOrderProducts,
    completeReverseManifest,
  } = useReverseManifestStore();

  // Load manifest details on mount
  useEffect(() => {
    if (manifestId) {
      fetchManifestDetails(manifestId);
    }
  }, [manifestId, fetchManifestDetails]);

  // Auto-focus scanner input when component mounts
  useEffect(() => {
    if (scannerInputRef.current) {
      scannerInputRef.current.focus();
    }
  }, []);

  // Initialize inventory types for existing orders that have products
  useEffect(() => {
    if (currentManifest?.orders) {
      const newInventoryTypes = { ...inventoryTypes };

      currentManifest.orders.forEach((order) => {
        if (order.products && order.products.length > 0) {
          if (!newInventoryTypes[order.orderId]) {
            newInventoryTypes[order.orderId] = {};
          }

          order.products.forEach((product) => {
            const productId = product._id || `temp-${product.sku}`;
            // Make sure we use the right enum values
            newInventoryTypes[order.orderId][productId] =
              product.inventoryType || "Good_Inventory";
          });
        }
      });

      setInventoryTypes(newInventoryTypes);
    }
  }, [currentManifest]);

  // Show toast message
  const showToast = (content: string, error = false) => {
    setActiveToast({
      active: true,
      content,
      error,
    });

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setActiveToast((prev) => ({ ...prev, active: false }));
    }, 3000);
  };

  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle barcode scanning - updated to add order directly
  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!scannedOrderId.trim()) return;

    setIsSubmitting(true);

    try {
      // First scan the order
      const scanResult = await apiClient.put(
        `/reverse-manifest/${manifestId}/scan`,
        {
          orderId: scannedOrderId.trim(),
        }
      );

      const scanData = scanResult.data as {
        success: boolean;
        data: { order: any };
      };

      if (scanData.success && scanData.data.order) {
        // Store the order data locally (add to map)
        setLocalScannedOrders((prev) => ({
          ...prev,
          [scanData.data.order.orderId]: scanData.data.order,
        }));

        // Initialize inventory types for the scanned order
        if (scanData.data.order.products) {
          const newInventoryTypes = { ...inventoryTypes };
          const orderId = scanData.data.order.orderId;

          if (!newInventoryTypes[orderId]) {
            newInventoryTypes[orderId] = {};
          }

          scanData.data.order.products.forEach((product: any) => {
            const productId = product._id || `temp-${product.sku}`;
            newInventoryTypes[orderId][productId] = "Good_Inventory";
          });

          setInventoryTypes(newInventoryTypes);
        }

        // Now directly add order to manifest without showing modal
        const addResult = await apiClient.post(
          `/reverse-manifest/${manifestId}/order`,
          {
            orderId: scanData.data.order.orderId,
          }
        );

        if ((addResult.data as { success: boolean }).success) {
          // Show success message
          showToast(`Order ${scanData.data.order.orderId} added to manifest`);

          // Refresh manifest details to show the new order
          await fetchManifestDetails(manifestId);
        }
      }
    } catch (error: any) {
      console.error("Scan/add error:", error);
      let message = "Failed to process order";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      showToast(message, true);
    } finally {
      setScannedOrderId("");
      setIsSubmitting(false);

      // Refocus on scanner input
      if (scannerInputRef.current) {
        scannerInputRef.current.focus();
      }
    }
  };

  // Remove order from manifest
  const handleRemoveOrder = async (orderId: string) => {
    setIsRemovingOrder(orderId);

    try {
      const result = await apiClient.delete(
        `/reverse-manifest/${manifestId}/order/${orderId}`
      );

      const data = result.data as { success: boolean };
      if (data.success) {
        showToast(`Order ${orderId} removed from manifest`);

        // Refresh manifest details to update the UI
        await fetchManifestDetails(manifestId);
      }
    } catch (error: any) {
      console.error("Remove order error:", error);
      let message = "Failed to remove order";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      showToast(message, true);
    } finally {
      setIsRemovingOrder("");
    }
  };

  // Update inventory type selection
  const handleInventoryTypeChange = (
    orderId: string,
    productId: string,
    value: string
  ) => {
    setInventoryTypes((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [productId]: value,
      },
    }));
  };

  // Mark manifest as complete
  const handleMarkComplete = async () => {
    setIsMarkingComplete(true);

    try {
      // First, save all inventory types for each order
      if (
        currentManifest &&
        currentManifest.orders &&
        currentManifest.orders.length > 0
      ) {
        // Keep track of orders that need processing
        const ordersToProcess = currentManifest.orders.filter(
          (order) =>
            !order.isProcessed &&
            (order.products?.length > 0 ||
              (localScannedOrders[order.orderId]?.products?.length > 0))
        );

        if (ordersToProcess.length > 0) {
          // Save each order's products inventory types
          for (const order of ordersToProcess) {
            // Check if manifest order has products
            let orderProducts =
              order.products && order.products.length > 0 ? order.products : [];

            // If no products in manifest order, use the scanned order products
            if (
              orderProducts.length === 0 &&
              localScannedOrders[order.orderId]
            ) {
              // Use the products from the scanned order
              orderProducts = localScannedOrders[order.orderId].products || [];
            }

            if (orderProducts.length > 0 && inventoryTypes[order.orderId]) {
              // Prepare products data for API - use correct enum values
              const productsForAPI = orderProducts.map((product) => {
                // Get product ID using multiple fallbacks
                const productId = product._id || `temp-${product.sku}`;

                // Get inventory type with fallback to Good_Inventory
                const inventoryType =
                  inventoryTypes[order.orderId]?.[productId] ||
                  "Good_Inventory";

                return {
                  productId,
                  quantity: product.qty || 0,
                  inventoryType, // Use as is - "Good_Inventory" or "Bad_Inventory"
                };
              });

              // Call API to update products
              const success = await updateOrderProducts(
                manifestId,
                order.orderId,
                productsForAPI
              );

              if (!success) {
                throw new Error(`Failed to process order ${order.orderId}`);
              }
            }
          }

          // Refresh manifest to get updated data
          await fetchManifestDetails(manifestId);
        }
      }

      // Now proceed with completing the manifest
      const success = await completeReverseManifest(manifestId);

      if (success) {
        showToast("Reverse manifest marked as complete", false);

        // Navigate back to list after short delay
        setTimeout(() => {
          router.push("/printrove/reverse/manifest");
        }, 1500);
      }
    } catch (error: any) {
      console.error("Complete manifest error:", error);
      let message = "Failed to complete manifest";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message) {
        message = error.message;
      }

      showToast(message, true);
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // Check if all orders are processed
  const allOrdersProcessed = () => {
    if (!currentManifest?.orders?.length) return true;
    return currentManifest.orders.every((order) => order.isProcessed);
  };

  // Helper function to check if we can mark as complete
  const canMarkComplete = () => {
    // Cannot mark as complete if it's already complete
    if (currentManifest.status === "COMPLETED") return false;

    // Cannot mark as complete if there are no orders
    if (!currentManifest.orders?.length) return false;

    // Can mark as complete if there are orders to process
    return true;
  };

  // Handle loading state
  if (isLoadingDetails) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <Loading />
          <div className="mt-4">Loading manifest details...</div>
        </div>
      </div>
    );
  }

  // Handle not found state
  if (!currentManifest) {
    return (
      <EmptyState
        heading="Manifest not found"
        image="/empty-state.svg"
        action={{
          content: "Back to manifests",
          onAction: () => router.push("/printrove/reverse/manifest"),
        }}
      >
        <p>
          The reverse manifest you're looking for doesn't exist or may have been
          deleted.
        </p>
      </EmptyState>
    );
  }

  return (
    <Page
      backAction={{
        content: "Reverse Manifests",
        onAction: () => router.push("/printrove/reverse/manifest"),
      }}
      title="Reverse Manifest Details"
      primaryAction={{
        content: "Mark as Complete",
        disabled: !canMarkComplete() || isMarkingComplete,
        loading: isMarkingComplete,
        onAction: handleMarkComplete,
      }}
    >
      <Layout>
        {/* Barcode scanner */}
        {currentManifest.status !== "COMPLETED" && (
          <Layout.Section>
            <div className="mb-5">
              <form onSubmit={handleScanSubmit}>
                <div>
                  <TextField
                    label="Scan or enter Order ID"
                    value={scannedOrderId}
                    onChange={setScannedOrderId}
                    autoComplete="off"
                    prefix={<Icon source={BarcodeIcon} />}
                    autoFocus
                    ref={scannerInputRef}
                    onKeyDown={(e) => {
                      // Auto-submit on Enter key
                      if (e.key === "Enter" && scannedOrderId.trim()) {
                        handleScanSubmit(e);
                      }
                    }}
                    helpText="Press Enter after scanning or typing the order ID"
                  />
                </div>
              </form>
            </div>
          </Layout.Section>
        )}

        {/* Orders list */}
        <Layout.Section>
          <Card>
            <div className="p-5">
              {currentManifest.orders?.length ? (
                <div className="space-y-8">
                  {currentManifest.orders.map((order) => (
                    <div
                      key={order.orderId}
                      className="mb-6 pb-6 border-b last:border-b-0"
                    >
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center">
                          <Text variant="bodyLg" as="span" fontWeight="bold">
                            Order: {order.orderId}
                          </Text>
                          <span className="ml-2">
                            <Badge
                              tone={order.isProcessed ? "success" : "attention"}
                            >
                              {order.isProcessed ? "Processed" : "Pending"}
                            </Badge>
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <Text variant="bodySm" as="span" tone="subdued">
                            Added: {formatDate(order.addedAt)}
                          </Text>
                          {!order.isProcessed &&
                            currentManifest.status !== "COMPLETED" && (
                              <Button
                                tone="critical"
                                onClick={() => handleRemoveOrder(order.orderId)}
                                disabled={isRemovingOrder === order.orderId}
                                loading={isRemovingOrder === order.orderId}
                                size="slim"
                                icon={DeleteIcon}
                              >
                                Remove
                              </Button>
                            )}
                        </div>
                      </div>

                      <div>
                        {/* Products table - handles both cases in a unified way */}
                        <DataTable
                          columnContentTypes={["text", "numeric", "text"]}
                          headings={["Product", "Quantity", "Inventory Type"]}
                          rows={(
                            order.products && order.products.length > 0
                              ? order.products
                              : localScannedOrders[order.orderId]?.products || []
                          ).map((product: any) => {
                            const productId =
                              product._id || `temp-${product.sku}`;

                            return [
                              // SKU Column
                              <div key={`sku-${productId}`}>
                                <Text fontWeight="medium">
                                  {product.sku || "Unknown SKU"}
                                </Text>
                              </div>,

                              // Quantity Column
                              product.quantity,

                              // Inventory Type Column
                              currentManifest.status === ("COMPLETED" as any) ||
                              order.isProcessed ? (
                                <Badge
                                  tone={
                                    product.inventoryType === "Bad_Inventory"
                                      ? "critical"
                                      : "success"
                                  }
                                >
                                  {product.inventoryType || "Good_Inventory"}
                                </Badge>
                              ) : (
                                <Select
                                  options={[
                                    {
                                      label: "Good_Inventory",
                                      value: "Good_Inventory",
                                    },
                                    {
                                      label: "Bad_Inventory",
                                      value: "Bad_Inventory",
                                    },
                                  ]}
                                  value={
                                    inventoryTypes[order.orderId]?.[
                                      productId
                                    ] || "Good_Inventory"
                                  }
                                  onChange={(value) =>
                                    handleInventoryTypeChange(
                                      order.orderId,
                                      productId,
                                      value
                                    )
                                  }
                                  disabled={
                                    order.isProcessed ||
                                    currentManifest.status === "COMPLETED"
                                  }
                                />
                              ),
                            ];
                          })}
                        />

                        {/* Show scan again button only if no products found at all */}
                        {(!order.products || order.products.length === 0) &&
                          (!localScannedOrders[order.orderId]?.products) && (
                            <div className="p-4 text-center">
                              <Text color="subdued">
                                No product data available.
                              </Text>
                              <div className="mt-2">
                                <Button
                                  onClick={() =>
                                    setScannedOrderId(order.orderId)
                                  }
                                  size="slim"
                                >
                                  Scan this order again
                                </Button>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Banner tone="info">
                  <p>
                    No orders have been added to this reverse manifest yet. Scan
                    an order barcode above to add it.
                  </p>
                </Banner>
              )}
            </div>
          </Card>
        </Layout.Section>
      </Layout>

      {/* Toast notification */}
      {activeToast.active && (
        <Toast
          content={activeToast.content}
          error={activeToast.error}
          onDismiss={() =>
            setActiveToast((prev) => ({ ...prev, active: false }))
          }
          duration={3000}
        />
      )}
    </Page>
  );
}