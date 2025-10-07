"use client";

import React, { useState, useEffect } from "react";
import {
  TextField,
  Card,
  Button,
  Text,
  Select,
  Icon,
  Modal,
} from "@shopify/polaris";
import { SearchIcon, PlusIcon, ArrowRightIcon } from "@shopify/polaris-icons";
import { useRouter } from "next/navigation";
import { CustomDatePicker } from "@/app/components/DatePicker";
import Link from "next/link";
import { useVendorStore } from "@/store/useVendorStore";
import { useBillStore } from "@/store/useBillStore";

interface PurchaseReceive {
  id: string;
  date: string;
  receiveNumber: string;
  vendorBillNumber: string;
  vendorName: string;
  status:
    | "Started"
    | "Recon completed"
    | "Completed"
    | "Recon Pending"
    | "Open";
  total: number;
  accepted: number;
  rejected: number;
  reconReportUrl: string;
}

const StatusBadge = ({ status }: { status: PurchaseReceive["status"] }) => {
  const getStatusStyles = () => {
    switch (status) {
      case "Started":
        return "bg-blue-100 text-blue-700";
      case "Recon completed":
        return "bg-green-500 text-white";
      case "Completed":
        return "bg-blue-500 text-white";
      case "Recon Pending":
        return "bg-orange-100 text-black";
      case "Open":
        return "bg-gray-100 text-black";
      default:
        return "bg-gray-100 text-black";
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

export default function PurchaseReceivesPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: "",
    billDate: new Date(),
    billNumber: "",
    packagesCount: "",
    shippingCompany: "",
    trackingNumber: "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [daysFilter, setDaysFilter] = useState("30");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const {
    allVendors,
    isLoadingAll: isLoadingVendors,
    fetchAllVendors,
  } = useVendorStore();
  const { bills, isLoading: isLoadingBills, fetchAllBills } = useBillStore();

  useEffect(() => {
    fetchAllVendors();
    fetchAllBills();
  }, [fetchAllVendors, fetchAllBills]);

  const vendorOptions = [
    { label: "Select Vendor", value: "" },
    ...allVendors.map((vendor) => ({
      label: `${vendor.vendorName}${
        vendor.companyName ? ` - ${vendor.companyName}` : ""
      }`,
      value: vendor.id,
    })),
  ];

  const shippingCompanies = [
    { label: "Select Company", value: "" },
    { label: "FedEx", value: "fedex" },
    { label: "DHL", value: "dhl" },
  ];

  const daysOptions = [
    { label: "30 Days", value: "30" },
    { label: "60 Days", value: "60" },
    { label: "90 Days", value: "90" },
  ];

  const tableData = bills.map((bill) => ({
    id: bill.bill_id,
    date: bill.date,
    receiveNumber: bill.bill_number,
    vendorBillNumber: bill.reference_number || "-",
    vendorName: bill.vendor_name,
    status: "Open" as PurchaseReceive["status"],
    total: bill.total,
    accepted: 0,
    rejected: 0,
    reconReportUrl: `/reports/${bill.bill_id}`,
  }));

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleModalSubmit = () => {
    router.push(
      `/printrove/purchase/receives/create?vendor=${formData.vendorId}`
    );
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          Purchase Receives
        </Text>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsModalOpen(true)}
            variant="primary"
            icon={PlusIcon}
          >
            New Purchase Receive
          </Button>
          <Button onClick={() => {}} variant="secondary">
            Export Data
          </Button>
        </div>
      </div>

      {/* Create Purchase Receive Modal */}
      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Purchase Receive"
        primaryAction={{
          content: "Create",
          onAction: handleModalSubmit,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setIsModalOpen(false),
          },
        ]}
      >
        <Modal.Section>
          <div className="space-y-4">
            <div>
              <Text as="span" variant="headingMd">
                Vendor Name
              </Text>
              <Select
                options={vendorOptions}
                value={formData.vendorId}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, vendorId: value }))
                }
                label="Select Vendor"
              />
            </div>

            <div>
              <Text variant="headingMd" as="span">
                Select Date
              </Text>
              <CustomDatePicker
                selected={formData.billDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, billDate: date }))
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

            <div>
              <Text variant="headingMd" as="span">
                Shipping Company
              </Text>
              <Select
                options={shippingCompanies}
                value={formData.shippingCompany}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, shippingCompany: value }))
                }
                label="Select Shipping Company"
              />
            </div>

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

      {/* Filters */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[200px]">
          <Select
            label=""
            options={daysOptions}
            value={daysFilter}
            onChange={setDaysFilter}
          />
        </div>
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search your order here"
            value={searchQuery}
            onChange={setSearchQuery}
            prefix={<SearchIcon />}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="p-6">
          {isLoadingBills ? (
            <div className="text-center py-4">Loading...</div>
          ) : (
            <table className="w-full">
              <thead className="bg-[#F5F5F5]">
                <tr>
                  <th className="p-4 text-left">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(tableData.map((item) => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                  </th>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Purchase Receive #</th>
                  <th className="p-4 text-left">Vendor Bill #</th>
                  <th className="p-4 text-left">Vendor Name</th>
                  <th className="p-4 text-left">Status</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Accepted</th>
                  <th className="p-4 text-right">Rejected</th>
                  <th className="p-4 text-center">Recon Report</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems([...selectedItems, item.id]);
                          } else {
                            setSelectedItems(
                              selectedItems.filter((id) => id !== item.id)
                            );
                          }
                        }}
                      />
                    </td>
                    <td className="p-4">{item.date}</td>
                    <td className="p-4">{item.receiveNumber}</td>
                    <td className="p-4">{item.vendorBillNumber}</td>
                    <td className="p-4">{item.vendorName}</td>
                    <td className="p-4">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="p-4 text-right">{item.total}</td>
                    <td className="p-4 text-right">{item.accepted}</td>
                    <td className="p-4 text-right">{item.rejected}</td>
                    <td className="p-4 text-center">
                      <Link href={item.reconReportUrl}>
                        <Icon
                          source={ArrowRightIcon}
                          accessibilityLabel="View Recon Report"
                        />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}
