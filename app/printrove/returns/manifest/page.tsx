"use client";

import React, { useState, useEffect } from "react";
import {
  TextField,
  Card,
  Button,
  Icon,
  Toast,
  EmptyState,
  Badge,
  Page,
  Select,
} from "@shopify/polaris";
import { SearchIcon, ArrowDiagonalIcon } from "@shopify/polaris-icons";
import { useReturnManifestStore } from "@/store/useReturnManifestStore";
import { CreateReturnManifestModal } from "@/app/components/CreateReturnManifestModal";
import GenericDataTable from "@/app/components/dataTable";
import { useRouter } from "next/navigation";

export default function ReturnManifestPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState({
    active: false,
    content: "",
    error: false,
  });
  const [sortOption, setSortOption] = useState("newest");

  const itemsPerPage = 10;

  const {
    returnManifests,
    total,
    isLoading,
    fetchReturnManifests,
    createReturnManifest,
    error,
  } = useReturnManifestStore();

  useEffect(() => {
    fetchReturnManifests(currentPage, itemsPerPage, searchQuery, sortOption);
  }, [currentPage, itemsPerPage, searchQuery, sortOption]);

  // Show error toast if there's an error from the store
  useEffect(() => {
    if (error) {
      setActiveToast({
        active: true,
        content: error,
        error: true,
      });
    }
  }, [error]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortOption(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const handleCreateManifest = async (manifestData: {
    pickupPerson: string;
    pickupPersonNumber: string;
    shippingCompany: string;
  }) => {
    try {
      const success = await createReturnManifest(manifestData);
      if (success) {
        setIsModalOpen(false);
        setActiveToast({
          active: true,
          content: "Return manifest created successfully",
          error: false,
        });
        // Refresh manifests
        fetchReturnManifests(
          currentPage,
          itemsPerPage,
          searchQuery,
          sortOption
        );
      }
    } catch (error: any) {
      setActiveToast({
        active: true,
        content: error.message || "Failed to create return manifest",
        error: true,
      });
    }
  };

  const toggleToast = () =>
    setActiveToast({ ...activeToast, active: !activeToast.active });

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let tone = "info";

    if (status === "COMPLETED") {
      tone = "success";
    } else if (status === "CANCELLED") {
      tone = "critical";
    } else if (status === "PROCESSING") {
      tone = "warning";
    }

    return <Badge tone={tone}>{status}</Badge>;
  };

  // View manifest details
  const handleViewManifest = (manifestId: string) => {
    router.push(`/printrove/returns/manifest/${manifestId}`);
  };

  return (
    <Page
      title="Return Manifests"
      primaryAction={{
        content: "Create Return Manifest",
        onAction: () => setIsModalOpen(true),
      }}
    >
      {/* Search and Sort Section */}
      <div className="flex justify-between items-center mb-4">
        <Select
          label=""
          labelHidden
          value={sortOption}
          options={[
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
          ]}
          onChange={handleSortChange}
        />
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search by Manifest ID, Pickup Person, or Courier"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<Icon source={SearchIcon} />}
            autoComplete="off"
            clearButton
            onClearButtonClick={() => setSearchQuery("")}
          />
        </div>
      </div>

      {/* Manifests Table */}
      <Card>
        {isLoading ? (
          <div className="p-16 flex justify-center">
            <span className="inline-block w-8 h-8 border-4 border-t-blue-600 rounded-full animate-spin"></span>
          </div>
        ) : returnManifests.length > 0 ? (
          <GenericDataTable
            columnContentTypes={[
              "text", // Date
              "numeric", // Returns Count
              "text", // Received By
              "text", // Courier Company
              "text", // Delivery Person
              "text", // Status
              "numeric", // Qty
              "text", // Actions
            ]}
            headings={[
              "Date",
              "Returns",
              "Received By",
              "Courier",
              "Delivery Person",
              "Status",
              "Qty",
              "Actions",
            ]}
            rows={returnManifests.map((manifest) => [
              formatDate(manifest.date),
              manifest.returnCount,
              manifest.receivedBy || "N/A",
              manifest.courierCompany,
              manifest.deliveryPerson,
              renderStatusBadge(manifest.status),
              manifest.qty,
              <div
                className="flex justify-left"
                key={`action-${manifest.manifestId}`}
              >
                <Button
                  icon={ArrowDiagonalIcon}
                  onClick={() => handleViewManifest(manifest.manifestId)}
                  variant="plain"
                  accessibilityLabel="View return manifest details"
                />
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
        ) : (
          <EmptyState
            heading="No return manifests found"
            image="/empty-state.svg"
            action={{
              content: "Create return manifest",
              onAction: () => setIsModalOpen(true),
            }}
          >
            <p>Create your first return manifest to start processing returns</p>
          </EmptyState>
        )}
      </Card>

      {/* Create Return Manifest Modal */}
      <CreateReturnManifestModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateManifest}
      />

      {/* Toast notification */}
      {activeToast.active && (
        <Toast
          content={activeToast.content}
          error={activeToast.error}
          onDismiss={toggleToast}
          duration={4000}
        />
      )}
    </Page>
  );
}
