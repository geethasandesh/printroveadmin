"use client";

import React, { useState, useEffect } from "react";
import { Button, Modal, Text, Select, TextField, Card } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { CustomDatePicker } from "@/app/components/DatePicker";
import { useRouter } from "next/navigation";
import { useVendorStore } from "@/store/useVendorStore";
import { usePurchaseReceiveStore } from "@/store/usePurchaseReceiveStore";
import GenericDataTable from "@/app/components/dataTable";

// Update the interface to match the API response
interface PurchaseReceiveForm {
  vendorId: string;
  receiveDate: Date;
  billNumber: string;
  packagesCount: string;
  shippingCompany: string;
  trackingNumber: string;
}

const initialPurchaseReceive: PurchaseReceiveForm = {
  vendorId: "",
  receiveDate: new Date(),
  billNumber: "",
  packagesCount: "",
  shippingCompany: "",
  trackingNumber: "",
};

export default function PurchaseReceivables() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<PurchaseReceiveForm>(
    initialPurchaseReceive
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { purchaseReceives, total, isLoading, fetchPurchaseReceives } =
    usePurchaseReceiveStore();
  const {
    allVendors,
    isLoading: isLoadingVendors,
    fetchAllVendors,
  } = useVendorStore();

  useEffect(() => {
    fetchAllVendors();
  }, [fetchAllVendors]);

  useEffect(() => {
    fetchPurchaseReceives(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, fetchPurchaseReceives, itemsPerPage, searchQuery]);

  const vendorOptions = [
    { label: "Select Vendor", value: "" },
    ...allVendors.map((vendor) => ({
      label: `${vendor.vendorName}${
        vendor.companyName ? ` - ${vendor.companyName}` : ""
      }`,
      value: vendor.id,
    })),
  ];

  const handleModalChange = () => {
    setIsModalOpen(!isModalOpen);
    if (!isModalOpen) {
      setFormData(initialPurchaseReceive);
    }
  };

  const handleSubmit = () => {
    router.push(
      `/printrove/purchase/receivables/create?vendor=${formData.vendorId}&billNumber=${formData.billNumber}&packagesCount=${formData.packagesCount}&shippingCompany=${formData.shippingCompany}&trackingNumber=${formData.trackingNumber}`
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleReceiveClick = (id: string) => {
    router.push(`/printrove/purchase/receivables/${id}`);
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <Text variant="headingLg" as="h3" fontWeight="bold">
          Purchase Receivables
        </Text>
        <Button variant="primary" onClick={handleModalChange}>
          New Purchase Receive
        </Button>
      </div>

      {/* Search Section */}
      <div className="flex justify-end items-center mb-4">
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search receivables"
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
          columnContentTypes={[
            "text",
            "text",
            "text",
            "text",
            "text",
            "numeric",
            "numeric",
            "numeric",
          ]}
          headings={[
            "Date",
            "Receive Number",
            "Vendor Bill",
            "Vendor Name",
            "Status",
            "Total Qty",
            "Accepted",
            "Rejected",
          ]}
          rows={purchaseReceives.map((receive) => [
            formatDate(receive.date),
            // Replace the plain ID text with a clickable button/link
            <Button
              key={`receive-${receive.id}`}
              onClick={() => handleReceiveClick(receive.id)}
              variant="plain"
              textAlign="left"
            >
              {receive.purchase_receive_id}
            </Button>,
            receive.bill_number,
            receive.vendor_name,
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(
                receive.status
              )}`}
            >
              {receive.status}
            </span>,
            receive.total_items?.toString() || "0",
            receive.accepted_items?.toString() || "0",
            receive.rejected_items?.toString() || "0",
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
          loading={isLoading}
        />
      </Card>

      {/* Existing Modal Component */}
      <Modal
        open={isModalOpen}
        onClose={handleModalChange}
        title="New Purchase Receive"
        primaryAction={{
          content: "Create",
          onAction: handleSubmit,
          disabled: isLoadingVendors,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleModalChange,
          },
        ]}
      >
        <Modal.Section>
          <div className="space-y-4">
            <Select
              label="Vendor"
              options={vendorOptions}
              value={formData.vendorId}
              onChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  vendorId: value,
                }))
              }
              disabled={isLoadingVendors}
            />

            <div className="mb-4">
              <CustomDatePicker
                label="Receive Date"
                selected={formData.receiveDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, receiveDate: date }))
                }
              />
            </div>

            <TextField
              label="Bill Number"
              value={formData.billNumber}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, billNumber: value }))
              }
              autoComplete="off"
            />

            <TextField
              label="Packages Count"
              type="number"
              value={formData.packagesCount}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, packagesCount: value }))
              }
              autoComplete="off"
            />

            <TextField
              label="Shipping Company"
              value={formData.shippingCompany}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, shippingCompany: value }))
              }
              autoComplete="off"
            />

            <TextField
              label="Tracking Number"
              value={formData.trackingNumber}
              onChange={(value) =>
                setFormData((prev) => ({ ...prev, trackingNumber: value }))
              }
              autoComplete="off"
            />
          </div>
        </Modal.Section>
      </Modal>
    </div>
  );
}
