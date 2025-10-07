"use client";
import React, { useState, useEffect } from "react";
import { TextField, Card, Button, Text, Select, Badge, Spinner } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { useVendorCreditStore } from "@/store/useVendorCreditStore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface VendorCredit {
  vendor_credit_id?: string;
  _id?: string;
  date: string;
  creditNumber?: string;
  vendor_credit_number?: string;
  purchaseBill?: string;
  purchase_bill?: string;
  purchaseBillReference?: string;
  purchase_bill_reference?: string;
  vendorName?: string;
  vendor_name?: string;
  status: string;
  amount?: {
    value: number;
    formatted: string;
  };
  total_formatted?: string;
}

export default function VendorCreditsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedDays, setSelectedDays] = useState("all");
  const itemsPerPage = 10;

  const { vendorCredits, total, isLoading, fetchVendorCredits } =
    useVendorCreditStore();

  useEffect(() => {
    fetchVendorCredits(currentPage, itemsPerPage, searchQuery, selectedDays);
  }, [currentPage, itemsPerPage, searchQuery, selectedDays]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleDaysChange = (value: string) => {
    setSelectedDays(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const handleViewCredit = (id: string) => {
    router.push(`/printrove/purchase/credits/${id}`);
  };

  const getCreditId = (credit: VendorCredit) => {
    return credit.vendor_credit_id || credit.id || 'unknown';
  };

  const getCreditNumber = (credit: VendorCredit) => {
    return credit.vendor_credit_number || credit.creditNumber || 'Unknown';
  };

  const getVendorName = (credit: VendorCredit) => {
    return credit.vendor_name || credit.vendorName || 'Unknown';
  };

  const getPurchaseBillReference = (credit: VendorCredit) => {
    return credit.purchaseBill || credit.purchaseBillReference || '-';
  };

  const getAmount = (credit: VendorCredit) => {
    return credit.total_formatted || credit.amount?.formatted || '0.00';
  };

  const renderStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    if (normalizedStatus === 'draft') {
      return (
        <Badge tone="info">
          Draft
        </Badge>
      );
    } else if (normalizedStatus === 'active' || normalizedStatus === 'open') {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
          Open
        </span>
      );
    } else {
      return (
        <Badge tone="warning">
          {status}
        </Badge>
      );
    }
  };

  const daysOptions = [
      { label: "All time", value: "all" },
    { label: "Last 7 days", value: "7" },
    { label: "Last 15 days", value: "15" },
    { label: "Last 30 days", value: "30" },
    { label: "Last 60 days", value: "60" },
    { label: "Last 90 days", value: "90" },
    { label: "Last 120 days", value: "120" },
    { label: "Last 180 days", value: "180" },
    { label: "Last 365 days", value: "365" },
  ];
  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Text variant="headingLg" as="h3" fontWeight="bold">
            Vendor Credits
          </Text>
          {!isLoading && (
            <Text variant="bodyMd" tone="subdued" as="p">
              {total} credit{total !== 1 ? 's' : ''} found
            </Text>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={() => {
              router.push("/printrove/purchase/credits/create");
            }}
          >
            New Credit Note
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
        <div className="w-auto">
          <Select
            label=""
            options={daysOptions}
            value={selectedDays}
            onChange={handleDaysChange}
          />
          {selectedDays !== "all" && (
            <div className="mt-1">
              <Text variant="bodySm" tone="subdued" as="p">
                Showing vendor credits from the last {selectedDays} days
              </Text>
            </div>
          )}
          {isLoading && (
            <div className="mt-2">
              <Spinner size="small" />
              <Text variant="bodySm" tone="subdued" as="span">
                Refreshing data...
              </Text>
            </div>
          )}
        </div>
        <div className="flex-1 max-w-[30%] ml-auto">
          <TextField
            label=""
            placeholder="Search vendor credits"
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
          ]}
          headings={[
            "Date",
            "Credit Number",
            "Purchase Bill Ref",
            "Vendor Name",
            "Status",
            "Amount",
          ]}
          rows={vendorCredits.map((credit) => [
            formatDate(credit.date),
            <Link
              href="#"
              className="text-[#005BD3] underline"
              key={getCreditId(credit)}
              onClick={(e) => {
                console.log(credit)
                e.preventDefault();
                handleViewCredit(getCreditId(credit));
              }}
            >
              {getCreditNumber(credit)}
            </Link>,
            getPurchaseBillReference(credit),
            getVendorName(credit),
            renderStatusBadge(credit.status),
            getAmount(credit),
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
    </div>
  );
}
