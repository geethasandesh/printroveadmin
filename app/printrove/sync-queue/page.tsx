"use client";

import React, { useEffect, useState } from "react";
import { Card, Text, Badge, Button, DataTable, Toast } from "@shopify/polaris";
import { useVendorStore } from "@/store/useVendorStore";

export default function SyncQueuePage() {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  
  const { 
    failedSyncItems, 
    fetchFailedSyncItems, 
    retrySyncItem 
  } = useVendorStore();

  useEffect(() => {
    fetchFailedSyncItems();
  }, []);

  const handleRetry = async (id: string) => {
    await retrySyncItem(id);
    setToastMessage("Retry initiated successfully");
    setShowToast(true);
    
    // Refresh the list after a short delay
    setTimeout(() => {
      fetchFailedSyncItems();
    }, 1000);
  };

  const getEntityTypeBadge = (type: string) => {
    switch (type) {
      case "vendor":
        return <Badge>Vendor</Badge>;
      case "bill":
        return <Badge tone="info">Bill</Badge>;
      case "purchase_order":
        return <Badge tone="warning">Purchase Order</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === "failed") {
      return <Badge tone="critical">Failed (Exhausted)</Badge>;
    } else if (status === "pending") {
      return <Badge tone="attention">Pending Retry</Badge>;
    }
    return <Badge>{status}</Badge>;
  };

  const rows = failedSyncItems.map((item) => [
    getEntityTypeBadge(item.entityType),
    item.entityId === "bulk_sync" ? "Bulk Vendor Sync" : item.entityId,
    getStatusBadge(item.status),
    item.retryCount,
    <Text variant="bodySm" as="span">
      {item.lastError && item.lastError.length > 100
        ? `${item.lastError.substring(0, 100)}...`
        : item.lastError || "-"}
    </Text>,
    <Button size="slim" onClick={() => handleRetry(item._id)}>
      Retry Now
    </Button>,
  ]);

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      {showToast && (
        <Toast 
          content={toastMessage} 
          onDismiss={() => setShowToast(false)} 
          duration={4500} 
        />
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <Text variant="headingLg" as="h3" fontWeight="bold">
            Sync Queue
          </Text>
          <Text variant="bodyMd" as="p" tone="subdued">
            {failedSyncItems.length} item{failedSyncItems.length !== 1 ? "s" : ""} pending retry or failed
          </Text>
        </div>
        <Button onClick={fetchFailedSyncItems}>Refresh</Button>
      </div>

      <Card>
        {failedSyncItems.length === 0 ? (
          <div className="p-8 text-center">
            <Text variant="headingMd" as="h4" tone="subdued">
              No items in queue
            </Text>
            <Text variant="bodyMd" as="p" tone="subdued">
              All sync operations are successful or have been resolved
            </Text>
          </div>
        ) : (
          <DataTable
            columnContentTypes={["text", "text", "text", "numeric", "text", "text"]}
            headings={[
              "Entity Type",
              "Entity ID",
              "Status",
              "Retry Count",
              "Last Error",
              "Actions",
            ]}
            rows={rows}
          />
        )}
      </Card>

      <div className="mt-6">
        <Card>
          <div className="p-5">
            <Text variant="headingMd" as="h4">
              About Sync Queue
            </Text>
            <div className="mt-4 space-y-2">
              <Text variant="bodyMd" as="p">
                The sync queue automatically retries failed sync operations with exponential backoff:
              </Text>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>
                  <Text variant="bodyMd" as="span">
                    1st retry: 5 minutes after failure
                  </Text>
                </li>
                <li>
                  <Text variant="bodyMd" as="span">
                    2nd retry: 15 minutes after failure
                  </Text>
                </li>
                <li>
                  <Text variant="bodyMd" as="span">
                    3rd retry: 30 minutes after failure
                  </Text>
                </li>
              </ul>
              <Text variant="bodyMd" as="p">
                After 3 failed attempts, the item will remain in this queue until manually retried.
              </Text>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

