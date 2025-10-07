"use client";

import React, { useState, useEffect } from "react";
import { Button, Modal, Text, Select, TextField, Card } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useRouter } from "next/navigation";
import usePutAwayStore from "@/store/usePutAwayStore";
import GenericDataTable from "@/app/components/dataTable";

export default function PutAwayPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    putAways,
    total,
    isLoading,
    isCreating,
    currentPage,
    limit,
    fetchPutAways,
    resetFormData,
    setFormField,
    createPutAway,
    formData,
  } = usePutAwayStore();

  // Fetch putaway records on component mount and when search or pagination changes
  useEffect(() => {
    fetchPutAways(currentPage, limit, searchQuery);
  }, [currentPage, limit, searchQuery, fetchPutAways]);

  const handleModalToggle = () => {
    if (!isModalOpen) {
      resetFormData();
    }
    setIsModalOpen(!isModalOpen);
  };

  const handleCreatePutAway = async () => {
    // Basic validation
    if (!formData.referenceNumber) {
      alert("Reference number is required");
      return;
    }

    try {
      const id = await createPutAway();
      if (id) {
        handleModalToggle();
        router.push(`/printrove/putaway/${id}/edit`);
      }
    } catch (error) {
      console.error("Failed to create putaway:", error);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US");
  };

  const getPutAwayTypeLabel = (type: string) => {
    return type === "INCOMING" ? (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
        Incoming
      </span>
    ) : (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
        Production
      </span>
    );
  };

  const handlePutAwayClick = (id: string) => {
    router.push(`/printrove/putaway/${id}`);
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <Text variant="headingLg" as="h3" fontWeight="bold">
          Put Away Records
        </Text>
        <Button variant="primary" onClick={handleModalToggle}>
          New Put Away
        </Button>
      </div>

      {/* Search Section */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search put aways"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <GenericDataTable
          columnContentTypes={["text", "text", "text", "numeric", "text"]}
          headings={[
            "Put Away ID",
            "Reference Number",
            "Type",
            "Total Quantity",
            "Created Date",
          ]}
          rows={putAways.map((putAway) => [
            <Button
              key={`putaway-${putAway._id}`}
              onClick={() => handlePutAwayClick(putAway._id)}
              variant="plain"
              textAlign="left"
            >
              {putAway.putAwayId}
            </Button>,
            putAway.referenceNumber,
            getPutAwayTypeLabel(putAway.putawayType),
            putAway.totalQty.toString(),
            formatDate(putAway.createdAt),
          ])}
          pagination={{
            hasPrevious: currentPage > 1,
            hasNext: currentPage * limit < total,
            onPrevious: () =>
              fetchPutAways(currentPage - 1, limit, searchQuery),
            onNext: () => fetchPutAways(currentPage + 1, limit, searchQuery),
            label: `${(currentPage - 1) * limit + 1}-${Math.min(
              currentPage * limit,
              total
            )} of ${total}`,
            totalCount: total,
          }}
        />
      </Card>

      {/* Modal for New Put Away */}
      <Modal
        open={isModalOpen}
        onClose={handleModalToggle}
        title="New Put Away"
        primaryAction={{
          content: "Create",
          onAction: handleCreatePutAway,
          loading: isCreating,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalToggle,
          },
        ]}
      >
        <Modal.Section>
          <div className="space-y-4">
            <TextField
              label="Reference Number"
              value={formData.referenceNumber}
              onChange={(value) => setFormField("referenceNumber", value)}
              autoComplete="off"
              requiredIndicator
              helpText="E.g. PO123, PROD456"
            />

            <Select
              label="Put Away Type"
              options={[
                { label: "Incoming", value: "INCOMING" },
                { label: "Production", value: "PRODUCTION" },
              ]}
              value={formData.putawayType}
              onChange={(value) => setFormField("putawayType", value)}
              requiredIndicator
            />
          </div>
        </Modal.Section>
      </Modal>
    </div>
  );
}
