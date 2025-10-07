"use client";
import React, { useState, useEffect } from "react";
import {
  TextField,
  Card,
  Button,
  Text,
  Select,
  Badge,
  Checkbox,
  Banner,
  ButtonGroup,
  Box,
  Tooltip,
  Icon,
} from "@shopify/polaris";
import {
  SearchIcon,
  PageDownIcon,
  EmailIcon,
  DeleteIcon,
  XIcon,
} from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { usePurchaseOrderStore } from "@/store/usePurchaseOrderStore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function PurchaseOrderPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // State to track selected POs
  const [selectedPOs, setSelectedPOs] = useState<string[]>([]);

  const {
    purchaseOrders,
    total,
    isLoading,
    fetchPurchaseOrders,
    downloadPurchaseOrdersPDF,
  } = usePurchaseOrderStore();

  const router = useRouter();

  const [daysFilter, setDaysFilter] = useState("30");

  const daysOptions = [
    { label: "30 Days", value: "30" },
    { label: "60 Days", value: "60" },
    { label: "90 Days", value: "90" },
  ];

  useEffect(() => {
    fetchPurchaseOrders(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  // Reset selection when page changes or new search
  useEffect(() => {
    setSelectedPOs([]);
  }, [currentPage, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  // Helper function to get the appropriate badge for each status
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return <Badge tone="success">Open</Badge>;
      case "draft":
        return <Badge tone="info">Draft</Badge>;
      case "closed":
        return <Badge tone="warning">Closed</Badge>;
      case "billed":
        return <Badge tone="success">Billed</Badge>;
      case "cancelled":
        return <Badge tone="critical">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Handle checkbox selection
  const handleSelectPO = (id: string) => {
    setSelectedPOs((prev) => {
      if (prev.includes(id)) {
        return prev.filter((poId) => poId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Handle select all on current page
  const handleSelectAll = () => {
    if (selectedPOs.length === purchaseOrders.length) {
      // If all are selected, deselect all
      setSelectedPOs([]);
    } else {
      // Otherwise, select all visible POs
      setSelectedPOs(purchaseOrders.map((po) => po.id));
    }
  };

  // Actions for selected POs
  const handleDownloadPDF = async () => {
    if (selectedPOs.length === 0) return;

    try {
      const isDownloading = await downloadPurchaseOrdersPDF(selectedPOs);
      if (isDownloading) {
        // Show success message
        toast.success(
          selectedPOs.length === 1
            ? "Purchase order downloaded successfully"
            : "Purchase orders downloaded successfully"
        );
      } else {
        toast.error("Failed to download purchase orders");
      }
    } catch (error) {
      console.error("Error downloading PDFs:", error);
      toast.error("An error occurred while downloading");
    }
  };

  const handleSendEmail = () => {
    console.log("Sending emails for:", selectedPOs);
    // Implement email sending logic
  };

  const handleDelete = () => {
    console.log("Deleting POs:", selectedPOs);
    // Implement delete logic
  };

  const handleCancelSelection = () => {
    setSelectedPOs([]);
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5] relative">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          Purchase Orders
        </Text>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              router.push("/printrove/purchase/po/create");
            }}
          >
            New PO
          </Button>
          <Button
            onClick={() => {
              console.log("Exporting data...");
            }}
          >
            Export Data
          </Button>
        </div>
      </div>

      {/* Filter Section */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-[200px]">
          <Select
            label=""
            options={daysOptions}
            value={daysFilter}
            onChange={setDaysFilter}
            placeholder="Select days"
          />
        </div>
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search your Order here"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<Icon source={SearchIcon} />}
            autoComplete="off"
          />
        </div>
      </div>

      {/* Sticky Action Bar - Only shows when items are selected */}
      {selectedPOs.length > 0 && (
        <div className="sticky top-0 z-10 mb-4">
          <Banner tone="info">
            <Box
              paddingBlockStart="200"
              paddingBlockEnd="200"
              paddingInlineStart="400"
              paddingInlineEnd="400"
            >
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <Checkbox
                    label={`${selectedPOs.length} selected`}
                    checked={selectedPOs.length > 0}
                    onChange={handleSelectAll}
                  />
                </div>
                <ButtonGroup>
                  <Tooltip content="Download PDF">
                    <Button
                      size="slim"
                      icon={PageDownIcon}
                      onClick={handleDownloadPDF}
                    >
                      Download PDF
                    </Button>
                  </Tooltip>

                  <Button
                    size="slim"
                    icon={EmailIcon}
                    onClick={handleSendEmail}
                  >
                    Send Email
                  </Button>

                  <Button
                    size="slim"
                    tone="critical"
                    icon={DeleteIcon}
                    onClick={handleDelete}
                  >
                    Delete
                  </Button>

                  <Button
                    size="slim"
                    icon={XIcon}
                    onClick={handleCancelSelection}
                  >
                    Cancel
                  </Button>
                </ButtonGroup>
              </div>
            </Box>
          </Banner>
        </div>
      )}

      {/* Table Card */}
      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text", // Checkbox column
            "text", // Date
            "text", // PO Number
            "text", // Reference
            "text", // Vendor
            "text", // Status
            "numeric", // Amount
          ]}
          headings={[
            <Checkbox
              key="select-all"
              checked={
                selectedPOs.length === purchaseOrders.length &&
                purchaseOrders.length > 0
              }
              onChange={handleSelectAll}
              label=""
            />,
            "Date",
            "PO Number",
            "Reference",
            "Vendor",
            "Status",
            "Amount",
          ]}
          rows={purchaseOrders.map((po) => [
            <Checkbox
              key={`checkbox-${po.id}`}
              checked={selectedPOs.includes(po.id)}
              onChange={() => handleSelectPO(po.id)}
              label=""
            />,
            formatDate(po.date),
            <Link
              href={`/printrove/purchase/po/${po.id}`}
              className="text-[#005BD3] hover:underline"
              key={po.id}
            >
              {po.purchaseorder_number}
            </Link>,
            po.reference_number || "-",
            po.vendor_name,
            getStatusBadge(po.status),
            formatCurrency(po.total),
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
