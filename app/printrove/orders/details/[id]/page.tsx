"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Text,
  Card,
  Button,
  ButtonGroup,
  Popover,
  ActionList,
  Badge,
  Spinner,
  Banner,
  InlineStack,
  BlockStack,
  Divider,
  Icon,
  InlineGrid,
  Layout,
  Page,
  Checkbox,
  TextField,
  Toast,
} from "@shopify/polaris";
import {
  ChevronDownIcon,
  CalendarIcon,
  OrderIcon,
  DeliveryIcon,
  LocationIcon,
  PackageIcon,
  CheckIcon,
} from "@shopify/polaris-icons";
import { format } from "date-fns";
import { useOrderStore } from "@/store/useOrderStore";
import React from "react"; // Make sure useState is imported
import TimelineAccordion from "@/components/TimelineAccordion";

export default function OrderDetailsPage() {
  const params = useParams();
  const orderId = params.id as string;

  const {
    currentOrderDetails: orderDetails,
    isLoadingDetails: loading,
    detailsError: error,
    fetchOrderDetails,
    clearOrderDetails,
    planningDetails,
    isLoadingPlanning,
    planningError,
    // Add these new state properties and functions from the store
    packingStatus,
    isMarkingFulfilled,
    fulfillmentError,
    checkOrderPackingStatus,
    markOrderAsFulfilled,
  } = useOrderStore();

  const [actionsPopoverActive, setActionsPopoverActive] = useState(false);
  const [toast, setToast] = useState({
    active: false,
    content: "",
    error: false,
  });

  // Toggle actions popover
  const toggleActionsPopover = () =>
    setActionsPopoverActive(!actionsPopoverActive);

  // Fetch order details
  React.useEffect(() => {
    if (orderId) {
      fetchOrderDetails(orderId);
    }

    // Clear details when unmounting
    return () => {
      clearOrderDetails();
    };
  }, [orderId, fetchOrderDetails, clearOrderDetails]);

  // Check packing status when the order loads
  useEffect(() => {
    if (orderDetails?._id) {
      checkOrderPackingStatus(orderId);
    }
  }, [orderDetails?._id, orderId, checkOrderPackingStatus]);

  // Format date helper
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Calculate order total
  const calculateOrderTotal = () => {
    if (!orderDetails?.products) return 0;
    return orderDetails.products.reduce(
      (sum, product) => sum + product.price * product.qty,
      0
    );
  };

  // Update the handling function to use the store function
  const handleMarkAsFulfilled = async () => {
    const success = await markOrderAsFulfilled(orderId);

    if (success) {
      setToast({
        active: true,
        content: "Order marked as fulfilled successfully",
        error: false,
      });
    } else if (fulfillmentError) {
      setToast({
        active: true,
        content: fulfillmentError,
        error: true,
      });
    }
  };

  // Toast dismissal
  const toggleToast = () => {
    setToast((prev) => ({ ...prev, active: !prev.active }));
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
        </div>
      </div>
    );
  }

  if (error || !orderDetails) {
    return (
      <div className="p-8">
        <Banner title="Error" tone="critical">
          {error || "Order details not available"}
        </Banner>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section - 70% */}
        <div className="w-full lg:w-[70%]">
          {/* Card 1: Basic Order Info with Status */}
          <Card>
            <BlockStack gap="400">
              {/* Order ID row */}
              <div>
                <Text variant="headingLg" as="h2" fontWeight="bold">
                  Order: #{orderDetails.orderId}
                </Text>
              </div>

              {/* Order Created Date row */}
              <div>
                <Text variant="headingSm" as="p" tone="subdued">
                  Order Date: {formatDate(orderDetails.createdAt)}
                </Text>
              </div>

              {/* Estimated Delivery row */}
              <div>
                <Text variant="headingSm" as="p" tone="subdued">
                  Estimated Delivery: -
                </Text>
              </div>

              {/* More Actions in a separate row */}
              <div className="flex justify-start">
                <ButtonGroup>
                  <Popover
                    active={actionsPopoverActive}
                    activator={
                      <Button
                        onClick={toggleActionsPopover}
                        disclosure
                        variant="primary"
                      >
                        More actions
                      </Button>
                    }
                    onClose={toggleActionsPopover}
                    preferredAlignment="right"
                  >
                    <ActionList
                      actionRole="menuitem"
                      items={[
                        { content: "Edit Order" },
                        { content: "Cancel Order" },
                        { content: "Disable branding" },
                        { content: "Upload invoice" },
                        { content: "Upload shipping label" },
                        { content: "Initiate reverse pickup" },
                        { content: "Edit shipping details" },
                        { content: "Mark as Rush" },
                        { content: "Generate tracking ID" },
                      ]}
                    />
                  </Popover>
                </ButtonGroup>
              </div>

              {/* Order Status Label */}
              <div>
                <Text variant="headingMd" as="h3" fontWeight="bold">
                  Order Status
                </Text>
              </div>

              {/* Status Progress Bar with Round Icons */}
              <div>
                <div className="flex items-center">
                  {["Created", "In Production", "Fulfilled", "Delivered"].map(
                    (status, index) => {
                      const isCurrentStatus =
                        orderDetails.orderStatus === status;
                      const isPastStatus =
                        [
                          "Created",
                          "In Production",
                          "Fulfilled",
                          "Delivered",
                        ].indexOf(orderDetails.orderStatus) >=
                        [
                          "Created",
                          "In Production",
                          "Fulfilled",
                          "Delivered",
                        ].indexOf(status);

                      return (
                        <div
                          key={status}
                          className="flex-1 text-center"
                          style={{ marginLeft: index === 0 ? "0" : "-1px" }}
                        >
                          <div
                            className={`py-2 px-3 ${
                              index === 0
                                ? "rounded-l-[25px]"
                                : index === 3
                                ? "rounded-r-[25px]"
                                : ""
                            } ${
                              isPastStatus
                                ? "bg-green-600 text-white"
                                : "bg-gray-100 text-gray-500"
                            } border border-gray-100 flex items-center justify-center`}
                          >
                            {/* Round Icon with Two Rings */}
                            <div
                              className={`w-7 h-7 rounded-full mr-2 flex items-center justify-center 
                ${
                  isPastStatus
                    ? "bg-white border-2 border-green-200"
                    : "bg-gray-300 border-2 border-gray-400"
                }`}
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded-full 
                  ${isPastStatus ? "bg-green-600" : "bg-gray-400"}`}
                              ></div>
                            </div>

                            {/* Status Text */}
                            <Text
                              as="p"
                              fontWeight={isCurrentStatus ? "bold" : "regular"}
                              variant="bodySm"
                            >
                              {status}
                            </Text>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </BlockStack>
          </Card>

          {/* Card 2: Planning Details Table */}
          <div className="mt-6">
            <Card>
              <BlockStack gap="400">
                {/* Planning Details Header */}
                <div>
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Planning Details
                  </Text>
                </div>

                {/* Planning Details Table */}
                {isLoadingPlanning ? (
                  <div className="flex justify-center py-4">
                    <Spinner size="small" />
                  </div>
                ) : planningError ? (
                  <div className="py-4">
                    <Banner title="Error" tone="critical">
                      {planningError}
                    </Banner>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            UID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {/* If planning details exist, show them */}
                        {planningDetails.length > 0
                          ? planningDetails.map((planning) => {
                              // Find matching product in order details to get price
                              const orderProduct = orderDetails.products.find(
                                (p) => p.id === planning.product.id
                              );

                              return (
                                <tr key={planning._id}>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Text variant="bodyMd" as="span">
                                      {planning.uid}
                                    </Text>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Text variant="bodyMd" as="span">
                                      {planning.product.name}
                                    </Text>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap">
                                    <Badge
                                      tone={getBadgeTone(
                                        planning.planningStatus
                                      )}
                                    >
                                      {planning.planningStatus}
                                    </Badge>
                                  </td>
                                  <td className="px-4 py-4 whitespace-nowrap text-right">
                                    <Text as="span" variant="bodyMd">
                                      ₹
                                      {orderProduct
                                        ? orderProduct.price.toFixed(2)
                                        : "N/A"}
                                    </Text>
                                  </td>
                                </tr>
                              );
                            })
                          : // If no planning details, create rows from order products with default status
                            orderDetails.products.map((product) => (
                              <tr key={product._id}>
                                <td className="px-4 py-4 whitespace-nowrap text-gray-400">
                                  <Text variant="bodyMd" as="span">
                                    -
                                  </Text>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <Text as="span" variant="bodyMd">
                                    {product.sku}
                                  </Text>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                  <Badge tone="critical">Created</Badge>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-right">
                                  <Text as="span" variant="bodyMd">
                                    ₹{product.price.toFixed(2)}
                                  </Text>
                                </td>
                              </tr>
                            ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </BlockStack>
            </Card>
          </div>

          {/* Card 3: Timeline Accordions - New Separate Card */}
          <div className="mt-6">
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Planning Timelines
                  </Text>
                </div>

                <div className="space-y-3">
                  {orderDetails.products.map((product) => (
                    <TimelineAccordion
                      key={product._id}
                      id={product._id}
                      title={`${product.sku} (Qty: ${product.qty})`}
                      product={product}
                    />
                  ))}
                </div>
              </BlockStack>
            </Card>
          </div>
        </div>

        {/* Right Section - 30% */}
        <div className="w-full lg:w-[30%]">
          {/* Action Card - For Order Fulfillment */}
          {packingStatus.canMarkAsFulfilled && (
            <div className="mb-6">
              <Card>
                <BlockStack gap="400">
                  {/* Card Header */}
                  <div className="border-b pb-3">
                    <Text variant="headingMd" as="h3" fontWeight="bold">
                      Action
                    </Text>
                  </div>

                  <div className="p-2">
                    <div className="flex flex-col space-y-4">
                      {/* Button group */}
                      <div className="flex gap-2">
                        <Button
                          onClick={handleMarkAsFulfilled}
                          loading={isMarkingFulfilled}
                          variant="primary"
                          fullWidth
                        >
                          Mark as Packed
                        </Button>
                        <Button
                          onClick={() => {}} // Add cancel handler if needed
                          variant="tertiary" // This gives a white background in Shopify Polaris
                          fullWidth
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </BlockStack>
              </Card>
            </div>
          )}

          {packingStatus.loading && (
            <div className="mb-6">
              <Card>
                <BlockStack gap="400">
                  <div className="p-4 flex justify-center items-center">
                    <Spinner size="small" />
                    <Text variant="bodySm" as="p" tone="subdued">
                      Checking order status...
                    </Text>
                  </div>
                </BlockStack>
              </Card>
            </div>
          )}

          {/* Toast for notifications */}
          {toast.active && (
            <Toast
              content={toast.content}
              error={toast.error}
              onDismiss={toggleToast}
              duration={4000}
            />
          )}

          {/* Card 1: Order Notes */}
          <Card>
            <BlockStack gap="400">
              <div>
                <TimelineAccordion id="order-notes" title="Order Notes" />
                <div className="space-y-4 mt-4">
                  <TextField
                    label="Notes"
                    multiline={4}
                    autoComplete="off"
                    placeholder="Enter order notes here..."
                  />
                  <div className="flex items-center">
                    <Checkbox
                      label="Send to Merchant"
                      checked={false}
                      onChange={() => {}}
                    />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button>Cancel</Button>
                    <Button variant="primary">Add</Button>
                  </div>
                </div>
              </div>
            </BlockStack>
          </Card>

          {/* Card 2: Customer Info */}
          <div className="mt-6">
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Customer Info
                  </Text>
                </div>

                <div className="space-y-4">
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Name
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {orderDetails.shippingAddress?.fullName || "-"}
                    </Text>
                  </div>

                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Customer Email
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {orderDetails.shippingAddress.email || "-"}
                    </Text>
                  </div>

                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Customer Contact
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {orderDetails.shippingAddress?.phone || "-"}
                    </Text>
                  </div>

                  {/* Shipping Address - Compact format */}
                  <div>
                    <Text variant="bodySm" tone="subdued" as="p">
                      Shipping Address
                    </Text>
                    <div className="mt-1 p-3 rounded-md bg-gray-50">
                      <Text variant="bodyMd" as="p">
                        {orderDetails.shippingAddress?.fullName}
                        {orderDetails.shippingAddress?.storeName &&
                          `, ${orderDetails.shippingAddress.storeName}`}
                        <br />
                        {orderDetails.shippingAddress?.address1}
                        {orderDetails.shippingAddress?.address2 &&
                          `, ${orderDetails.shippingAddress.address2}`}
                        {orderDetails.shippingAddress?.landmark &&
                          `, ${orderDetails.shippingAddress.landmark}`}
                        <br />
                        {[
                          orderDetails.shippingAddress?.city,
                          orderDetails.shippingAddress?.state,
                          orderDetails.shippingAddress?.zip,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                        <br />
                        {orderDetails.shippingAddress?.country}
                      </Text>
                    </div>
                  </div>
                </div>
              </BlockStack>
            </Card>
          </div>

          {/* Card 3: Order Information */}
          <div className="mt-6">
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Order Information
                  </Text>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Reference Number
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {orderDetails.reference || "-"}
                    </Text>
                  </div>

                  <div className="flex justify-between">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Shipping Mode
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {orderDetails.shippingMode || "-"}
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </Card>
          </div>

          {/* Card 4: Merchant Information */}
          <div className="mt-6">
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Merchant Information
                  </Text>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Merchant Name
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {orderDetails.merchant?.name || "-"}
                    </Text>
                  </div>

                  <div className="flex justify-between">
                    <Text variant="bodySm" tone="subdued" as="p">
                      Merchant ID
                    </Text>
                    <Text variant="bodyMd" as="p">
                      {orderDetails.merchant?.id || "-"}
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </Card>
          </div>

          {/* Card 5: Credit Transaction */}
          <div className="mt-6">
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Credit Transaction
                  </Text>
                </div>

                <div className="space-y-4">
                  {orderDetails.creditTransactions &&
                  orderDetails.creditTransactions.length > 0 ? (
                    orderDetails.creditTransactions.map(
                      (transaction, index) => (
                        <div
                          key={index}
                          className="border-b pb-2 last:border-b-0"
                        >
                          <div className="flex justify-between">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Type
                            </Text>
                            <Text variant="bodyMd" as="p">
                              {transaction.type || "-"}
                            </Text>
                          </div>
                          <div className="flex justify-between mt-1">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Amount
                            </Text>
                            <Text variant="bodyMd" as="p">
                              ₹{transaction.amount?.toFixed(2) || "-"}
                            </Text>
                          </div>
                          <div className="flex justify-between mt-1">
                            <Text variant="bodySm" tone="subdued" as="p">
                              Date
                            </Text>
                            <Text variant="bodyMd" as="p">
                              {transaction.date
                                ? formatDate(transaction.date)
                                : "-"}
                            </Text>
                          </div>
                        </div>
                      )
                    )
                  ) : (
                    <Text
                      variant="bodySm"
                      as="p"
                      tone="subdued"
                      alignment="center"
                    >
                      No credit transactions available
                    </Text>
                  )}
                </div>
              </BlockStack>
            </Card>
          </div>

          {/* Card 6: Cost Breakup */}
          <div className="mt-6">
            <Card>
              <BlockStack gap="400">
                <div>
                  <Text variant="headingMd" as="h3" fontWeight="bold">
                    Cost Breakup
                  </Text>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <Text variant="bodyMd" as="p">
                      Subtotal
                    </Text>
                    <Text variant="bodyMd" as="p">
                      ₹{calculateOrderTotal().toFixed(2)}
                    </Text>
                  </div>

                  {orderDetails.shippingCost !== undefined && (
                    <div className="flex justify-between">
                      <Text variant="bodyMd" as="p">
                        Shipping
                      </Text>
                      <Text variant="bodyMd" as="p">
                        ₹{orderDetails.shippingCost.toFixed(2)}
                      </Text>
                    </div>
                  )}

                  {orderDetails.tax !== undefined && (
                    <div className="flex justify-between">
                      <Text variant="bodyMd" as="p">
                        Tax
                      </Text>
                      <Text variant="bodyMd" as="p">
                        ₹{orderDetails.tax.toFixed(2)}
                      </Text>
                    </div>
                  )}

                  {orderDetails.discount !== undefined && (
                    <div className="flex justify-between">
                      <Text variant="bodyMd" as="p">
                        Discount
                      </Text>
                      <Text variant="bodyMd" as="p" tone="success">
                        -₹{orderDetails.discount.toFixed(2)}
                      </Text>
                    </div>
                  )}

                  <Divider />

                  <div className="flex justify-between">
                    <Text variant="headingSm" as="h4" fontWeight="bold">
                      Total
                    </Text>
                    <Text variant="headingSm" as="p" fontWeight="bold">
                      ₹
                      {(
                        calculateOrderTotal() +
                        (orderDetails.shippingCost || 0) +
                        (orderDetails.tax || 0) -
                        (orderDetails.discount || 0)
                      ).toFixed(2)}
                    </Text>
                  </div>
                </div>
              </BlockStack>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to determine badge tone based on planning status
function getBadgeTone(
  status: string
): "success" | "info" | "warning" | "critical" | undefined {
  switch (status) {
    case "Dispatch":
      return "success";
    case "QC":
    case "Packing":
      return "info";
    case "Picking":
    case "Printing":
    case "Preview":
    case "Kiting":
      return "warning";
    case "Received":
      return "critical";
    default:
      return undefined;
  }
}
