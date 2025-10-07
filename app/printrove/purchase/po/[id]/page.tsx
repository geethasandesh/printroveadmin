"use client";

import { useEffect, useState } from "react";
import { Card, Text, DataTable, BlockStack, Button } from "@shopify/polaris";
import { useParams, useRouter } from "next/navigation";
import { usePurchaseOrderStore } from "@/store/usePurchaseOrderStore";
import { toast } from "react-hot-toast";

export default function PurchaseOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const [isMarkingAsOpen, setIsMarkingAsOpen] = useState(false);
  const {
    selectedPO,
    isLoadingDetails,
    fetchPurchaseOrderById,
    markPurchaseOrderAsOpen,
  } = usePurchaseOrderStore();

  // Helper function to calculate received quantities for each line item
  const calculateReceivedQuantities = () => {
    if (
      !selectedPO ||
      !selectedPO.purchase_receives ||
      !selectedPO.line_items
    ) {
      return {};
    }

    // Create a map to store the sum of received quantities for each item_id
    const receivedQuantities: { [key: string]: number } = {};

    // Create a mapping from item_id to line_item_id for better lookup
    const itemIdToLineItemId: { [key: string]: string } = {};
    selectedPO.line_items.forEach((item) => {
      if (item.item_id) {
        itemIdToLineItemId[item.item_id] = item.line_item_id;
      }
    });

    // Loop through all purchase receives
    selectedPO.purchase_receives.forEach((pr) => {
      // Only consider completed purchase receives
      if (pr.receive_items) {
        console.log("Processing Purchase Receive:", pr.pr_id);
        // Loop through each item in the purchase receive
        pr.receive_items.forEach((item) => {
          // Try to get the item_id, or map it to line_item_id if needed
          const itemId = item.item_id;

          if (!itemId || !item.quantity) return;

          // Try to match with line_item_id first
          let matchKey = itemId;

          // If we couldn't find a direct match with line_item_id, try to map item_id to line_item_id
          if (!selectedPO.line_items.some((li) => li.line_item_id === itemId)) {
            matchKey = itemIdToLineItemId[itemId] || itemId;
          }

          // Add the quantity to our running total
          receivedQuantities[matchKey] =
            (receivedQuantities[matchKey] || 0) + Number(item.quantity);
        });
      }
    });

    return receivedQuantities;
  };

  // Get the received quantities
  const receivedQuantities = calculateReceivedQuantities();

  useEffect(() => {
    if (params.id) {
      fetchPurchaseOrderById(params.id as string);
    }
  }, [params.id, fetchPurchaseOrderById]);

  if (isLoadingDetails || !selectedPO) {
    return <div>Loading...</div>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const handleMarkAsOpen = async () => {
    if (!selectedPO || !selectedPO.id) return;

    setIsMarkingAsOpen(true);
    try {
      const success = await markPurchaseOrderAsOpen(selectedPO.id);

      if (success) {
        toast.success("Purchase order marked as open successfully");
        // Refresh the purchase order data
        fetchPurchaseOrderById(selectedPO.id);
      } else {
        toast.error("Failed to mark purchase order as open");
      }
    } catch (error) {
      console.error("Error marking purchase order as open:", error);
      toast.error("An error occurred while marking purchase order as open");
    } finally {
      setIsMarkingAsOpen(false);
    }
  };

  return (
    <div className="h-full p-4 md:p-8 bg-[#F5F5F5]">
      {/* Header with Mark as Open button */}
      <div className="mb-6 flex justify-between items-center">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          Purchase Order - #{selectedPO.purchaseorder_number}
        </Text>

        {/* Only show the button if status is draft */}
        {selectedPO.status === "draft" && (
          <Button
            variant="primary"
            onClick={handleMarkAsOpen}
            loading={isMarkingAsOpen}
            disabled={isMarkingAsOpen}
          >
            Mark as Open
          </Button>
        )}
      </div>

      {/* Update BlockStack with larger gap */}
      <BlockStack>
        <div className="mb-4">
          <Card>
            <div className="p-4">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                Purchase Receives
              </Text>
            </div>
            <DataTable
              columnContentTypes={["text", "text", "text", "text"]}
              headings={[
                "Purchase Receive No",
                "Bill Number",
                "Date",
                "Status",
              ]}
              rows={
                selectedPO.purchase_receives &&
                selectedPO.purchase_receives.length > 0
                  ? selectedPO.purchase_receives.map((pr) => [
                      pr.pr_id,
                      pr.bill_number,
                      formatDate(pr.date),
                      <Text
                        as="span"
                        key={pr.pr_id}
                        tone={pr.status === "completed" ? "magic" : "subdued"}
                        fontWeight="medium"
                      >
                        {pr.status.charAt(0).toUpperCase() + pr.status.slice(1)}
                      </Text>,
                    ])
                  : [["No purchase receives found", "", "", ""]]
              }
              hideScrollIndicator
            />
          </Card>
        </div>

        {/* Purchase Order Information card remains unchanged */}
        <div className="mb-4">
          <Card>
            {/* Card content remains the same */}
            <div className="p-4">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                Purchase Order Information
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Vendor Name
                    </Text>
                    <div className="mt-1">{selectedPO.vendor_name}</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      PO Number
                    </Text>
                    <div className="mt-1">
                      {selectedPO.purchaseorder_number}
                    </div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Status
                    </Text>
                    <div className="mt-1">{selectedPO.status}</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Reference Number
                    </Text>
                    <div className="mt-1">
                      {selectedPO.reference_number || "--"}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      PR Number
                    </Text>
                    <div className="mt-1">--</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Date
                    </Text>
                    <div className="mt-1">{formatDate(selectedPO.date)}</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Expected Delivery Date
                    </Text>
                    <div className="mt-1">--</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Vendor Address
                    </Text>
                    <div className="mt-1">--</div>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Card 3: Line Items - Updated to show received quantities */}
        <Card>
          <div className="p-4">
            <Text as="h2" variant="headingMd" fontWeight="semibold">
              Line Items
            </Text>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-sm font-medium text-gray-600">
                    Product
                  </th>
                  <th className="p-4 text-right text-sm font-medium text-gray-600">
                    Ordered Qty
                  </th>
                  <th className="p-4 text-right text-sm font-medium text-gray-600">
                    Received Qty
                  </th>
                  <th className="p-4 text-right text-sm font-medium text-gray-600">
                    Rate
                  </th>
                  <th className="p-4 text-right text-sm font-medium text-gray-600">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {selectedPO.line_items?.map((item, index) => {
                  // Get the received quantity for this line item - use line_item_id as primary key
                  const receivedQty =
                    receivedQuantities[item.line_item_id] || 0;

                  // Calculate if the item is fully or partially received
                  const isFullyReceived = receivedQty >= item.quantity;
                  const isPartiallyReceived =
                    receivedQty > 0 && receivedQty < item.quantity;

                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="p-4 text-sm text-gray-900">{item.name}</td>
                      <td className="p-4 text-sm text-gray-900 text-right">
                        {item.quantity}
                      </td>
                      <td className="p-4 text-sm text-right">
                        <span
                          className={
                            isFullyReceived
                              ? "text-green-600 font-medium"
                              : isPartiallyReceived
                              ? "text-amber-600 font-medium"
                              : "text-gray-500"
                          }
                        >
                          {receivedQty > 0 ? receivedQty : "--"}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.rate)}
                      </td>
                      <td className="p-4 text-sm text-gray-900 text-right">
                        {formatCurrency(item.rate * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </BlockStack>
    </div>
  );
}
