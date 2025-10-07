"use client";

import React, { useState, useEffect } from "react";
import {
  TextField,
  Card,
  Button,
  Text,
  Layout,
  Icon,
  Toast,
  EmptyState,
  Badge,
  Page,
  Select,
} from "@shopify/polaris";
import { SearchIcon, ArrowDiagonalIcon } from "@shopify/polaris-icons";
import { useDispatchStore } from "@/store/useDispatchStore";
import { CreateManifestModal } from "@/app/components/CreateManifestModal";
import GenericDataTable from "@/app/components/dataTable";

export default function DispatchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeToast, setActiveToast] = useState({
    active: false,
    content: "",
    error: false,
  });

  const itemsPerPage = 10;

  const {
    dispatchManifests,
    total,
    isLoading,
    fetchDispatchManifests,
    createDispatchManifest,
  } = useDispatchStore();

  useEffect(() => {
    fetchDispatchManifests(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const handleCreateManifest = async (manifestData: {
    pickupPerson: string;
    pickupPersonNumber: string;
    shippingCompany: string;
    orderIds: string[];
  }) => {
    try {
      const success = await createDispatchManifest(manifestData);
      if (success) {
        setIsModalOpen(false);
        setActiveToast({
          active: true,
          content: "Manifest created successfully",
          error: false,
        });
        // Refresh dispatch manifests
        fetchDispatchManifests(currentPage, itemsPerPage, searchQuery);
      }
    } catch (error: any) {
      setActiveToast({
        active: true,
        content: error.message || "Failed to create manifest",
        error: true,
      });
    }
  };

  const toggleToast = () =>
    setActiveToast({ ...activeToast, active: !activeToast.active });

  // Courier summary data (static for now)
  const courierSummary = [
    { name: "Delhivery", count: 12 },
    { name: "Ekart", count: 8 },
    { name: "XpressBees", count: 5 },
    { name: "Blue Dart", count: 3 },
  ];

  // Format order IDs for display
  const formatOrderIds = (orderIds: string[] = []) => {
    if (orderIds.length === 0) return "-";
    const displayCount = 2;
    const shown = orderIds.slice(0, displayCount).join(", ");
    return orderIds.length > displayCount
      ? `${shown} +${orderIds.length - displayCount} more`
      : shown;
  };

  // Render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    let badgeClass = "bg-blue-100 text-blue-800"; // Default (info)

    if (status === "COMPLETED") {
      badgeClass = "bg-green-100 text-green-800";
    } else if (status === "CANCELLED") {
      badgeClass = "bg-red-100 text-red-800";
    } else if (status === "PROCESSING") {
      badgeClass = "bg-yellow-100 text-yellow-800";
    }

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${badgeClass}`}
      >
        {status}
      </span>
    );
  };

  // View manifest details
  const handleViewManifest = (manifestId: string) => {
    // Navigate to manifest details page
    window.location.href = `/printrove/production/dispatch/${manifestId}`;
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-2">
        <b className="text-2xl font-extrabold">Dispatch</b>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          Create Manifest
        </Button>
      </div>

      {/* Courier Summary Cards */}
      <Layout>
        <Layout.Section>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {courierSummary.map((courier) => (
              <Card key={courier.name}>
                <div className="p-4">
                  <Text variant="headingMd" as="h2">
                    {courier.name}
                  </Text>
                  <div className="mt-2 flex items-baseline">
                    <Text variant="headingXl" as="p">
                      {courier.count}
                    </Text>
                    <div className="ml-2 text-gray-500">
                      <Text variant="bodySm" as="p">
                        manifests
                      </Text>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Layout.Section>
      </Layout>

      {/* Search Section - Mimic Planning page with flex container */}
      <div className="flex justify-between items-center mt-4 mb-4">
        <Select
          label=""
          placeholder="Sort by date"
          value="date"
          options={[
            { label: "Sort by date", value: "date" },
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
          ]}
          onChange={() => {}}
        />
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search by Order ID, Pickup Person or Courier"
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
        ) : dispatchManifests.length > 0 ? (
          <GenericDataTable
            columnContentTypes={[
              "text",
              "text",
              "text",
              "text",
              "text",
              "text",
            ]}
            headings={[
              "Order IDs",
              "Date",
              "Pickup Person",
              "Courier",
              "Status",
              "Actions",
            ]}
            rows={dispatchManifests.map((manifest) => [
              formatOrderIds(manifest.orderIds),
              formatDate(manifest.createdTime),
              manifest.pickupPerson,
              manifest.shippingCompany,
              renderStatusBadge(manifest.status),
              <div
                className="flex justify-left"
                key={`action-${manifest.manifestId}`}
              >
                <Button
                  icon={ArrowDiagonalIcon}
                  onClick={() => handleViewManifest(manifest.manifestId)}
                  variant="plain"
                  accessibilityLabel="View manifest details"
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
            heading="No manifests found"
            image="/empty-state.svg"
            action={{
              content: "Create manifest",
              onAction: () => setIsModalOpen(true),
            }}
          >
            <p>Create your first dispatch manifest to get started</p>
          </EmptyState>
        )}
      </Card>

      {/* Create Manifest Modal */}
      <CreateManifestModal
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
    </div>
  );
}
