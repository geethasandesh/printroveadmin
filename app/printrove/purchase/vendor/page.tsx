"use client";
import React, { useState, useEffect } from "react";
import { TextField, Card, Button, Icon, Text, Toast, Badge, Banner } from "@shopify/polaris";
import { EditIcon, SearchIcon, AdjustIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { useVendorStore } from "@/store/useVendorStore";
import { useRouter } from "next/navigation";
import { IconButton } from "@/app/components/iconButton";
import Link from "next/link";

export default function VendorsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showToast, setShowToast] = useState(false);
  const [showBanner, setShowBanner] = useState(true); // Add state to control banner visibility
  const itemsPerPage = 10;

  const {
    vendors,
    total,
    isLoading,
    fetchVendors,
    syncVendorsFromZoho,
    isSyncing,
    syncMessage,
    failedSyncItems,
    fetchFailedSyncItems,
    retrySyncItem,
  } = useVendorStore();

  useEffect(() => {
    fetchVendors(currentPage, itemsPerPage, searchQuery);
    fetchFailedSyncItems();
  }, [currentPage, itemsPerPage, searchQuery]);

  // Periodically refresh failed sync items to check if they've been resolved
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFailedSyncItems();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Debug: Log failed sync items whenever they change
  useEffect(() => {
    console.log("Failed sync items updated:", failedSyncItems);
  }, [failedSyncItems]);

  // Show banner again when new failed items appear
  useEffect(() => {
    if (failedSyncItems.length > 0) {
      setShowBanner(true);
    }
  }, [failedSyncItems.length]);

  useEffect(() => {
    if (syncMessage) {
      setShowToast(true);
    }
  }, [syncMessage]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleRowClick = (rowIndex: number) => {
    const vendor = vendors[rowIndex];
    router.push(`/printrove/purchase/vendor/${vendor.id}`);
  };

  const handleSyncClick = async () => {
    await syncVendorsFromZoho();
    // Refresh failed sync items after sync completes
    await fetchFailedSyncItems();
    // Refresh vendor list to update sync status
    await fetchVendors(currentPage, itemsPerPage, searchQuery);
  };

  const toggleToast = () => setShowToast((show) => !show);

  const getSyncStatusBadge = (vendor: any) => {
    // Only check for bulk_sync failures (vendor-level sync issues)
    // Don't show individual vendor as failed if it's a bulk sync issue
    const hasBulkSyncFailed = failedSyncItems.some(
      (item) => item.entityId === "bulk_sync" && item.retryCount > 0
    );

    // Check if this specific vendor has a failed sync
    const hasVendorFailed = failedSyncItems.some(
      (item) => 
        (item.entityId === vendor.id || item.entityId === vendor.contact_id) &&
        item.entityId !== "bulk_sync"
    );

    if (hasVendorFailed) {
      return <Badge tone="critical">Sync Failed</Badge>;
    } else if (hasBulkSyncFailed) {
      // For bulk sync failures, show different status
      return <Badge tone="attention">Sync Issue</Badge>;
    } else if (vendor.syncStatus === "success" || vendor.lastSyncedAt) {
      return <Badge tone="success">Synced</Badge>;
    } else if (vendor.syncStatus === "pending") {
      return <Badge tone="attention">Syncing</Badge>;
    }
    return <Badge tone="success">Synced</Badge>; // Default to synced if no issues
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      {showToast && syncMessage && (
        <Toast content={syncMessage} onDismiss={toggleToast} duration={4500} />
      )}

      {failedSyncItems.length > 0 && showBanner && (
        <div className="mb-4">
          <Banner
            title={`${failedSyncItems.length} vendor sync${failedSyncItems.length > 1 ? "s" : ""} failed`}
            tone="critical"
            action={{
              content: "View Details",
              onAction: () => router.push("/printrove/sync-queue"),
            }}
            onDismiss={() => setShowBanner(false)}
          >
            <p>
              Some vendor syncs have failed. Click "View Details" to see the failed items and retry.
            </p>
          </Banner>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <Text variant="headingLg" as="h3" fontWeight="bold">
          Vendors
        </Text>
        <div className="flex gap-2">
          <Button
            variant="primary"
            icon={AdjustIcon}
            onClick={handleSyncClick}
            loading={isSyncing}
            disabled={isSyncing}
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </Button>
          <Button
            onClick={async () => {
              await fetchVendors(currentPage, itemsPerPage, searchQuery);
              await fetchFailedSyncItems();
            }}
          >
            Refresh
          </Button>
          <Button
            onClick={() => {
              // Add export functionality here
              console.log("Exporting data...");
            }}
          >
            Export Data
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search vendors"
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
            "text",
            "text",
            "text",
            "numeric",
            "text",
          ]}
          headings={[
            "S.NO",
            "Vendor Name",
            "Company Name",
            "Email",
            "Phone",
            "Payables",
            "Sync Status",
          ]}
          rows={vendors.map((vendor, idx) => [
            ((currentPage - 1) * itemsPerPage + idx + 1).toString(),
            <Link
              href={`/printrove/purchase/vendor/${vendor.id}`}
              className="text-blue-600 hover:text-blue-800 hover:underline"
            >
              {vendor.vendorName}
            </Link>,
            vendor.companyName || "-",
            vendor.email || "-",
            vendor.phone || "-",
            vendor.payables.toLocaleString("en-IN", {
              style: "currency",
              currency: "INR",
            }),
            getSyncStatusBadge(vendor) || "-",
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
    </div>
  );
}
