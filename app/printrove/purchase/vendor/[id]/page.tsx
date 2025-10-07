"use client";

import React, { useState, useEffect, use } from "react";
import { useVendorStore } from "@/store/useVendorStore";
import {
  Page,
  Card,
  Tabs,
  DataTable,
  Text,
  Layout,
  Badge,
} from "@shopify/polaris";

export default function VendorDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const { vendorDetails, isLoadingDetails, fetchVendorDetails } =
    useVendorStore();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    fetchVendorDetails(resolvedParams.id);
  }, [resolvedParams.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const renderStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    let tone: "success" | "critical" | "warning" | "info" | undefined = undefined;
    if (["paid", "billed", "closed"].includes(s)) tone = "success";
    else if (["overdue", "partially paid", "partially billed"].includes(s)) tone = "warning";
    else if (["void", "cancelled"].includes(s)) tone = "critical";
    else tone = "info";
    return <Badge tone={tone}>{status}</Badge>;
  };

  const tabs = [
    { id: "information", content: "Information" },
    { id: "transactions", content: "Transactions" },
    { id: "bankDetails", content: "Bank Details" },
  ];

  if (isLoadingDetails) return <div>Loading...</div>;
  if (!vendorDetails) return <div>Vendor not found</div>;

  const renderInformationTab = () => (
    <Card>
      <div className="p-5 space-y-8">
        {/* Primary Contact Section */}
        <div>
          <div className="mb-4">
            <Text variant="headingMd" as="h3">
              Primary Contact
            </Text>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <Text as="p" variant="bodyMd">
                  First Name
                </Text>
                <Text as="p" variant="bodyLg">
                  {vendorDetails.personalInfo.firstName}
                </Text>
              </div>
              <div>
                <Text as="p" variant="bodyMd">
                  Phone
                </Text>
                <Text as="p" variant="bodyLg">
                  {vendorDetails.personalInfo.phone}
                </Text>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Text as="p" variant="bodyMd">
                  Last Name
                </Text>
                <Text as="p" variant="bodyLg">
                  {vendorDetails.personalInfo.lastName}
                </Text>
              </div>
              <div>
                <Text as="p" variant="bodyMd">
                  Email
                </Text>
                <Text as="p" variant="bodyLg">
                  {vendorDetails.personalInfo.email}
                </Text>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Text as="p" variant="bodyMd">
                  Company Name
                </Text>
                <Text as="p" variant="bodyLg">
                  {vendorDetails.personalInfo.companyName}
                </Text>
              </div>
              <div>
                <Text as="p" variant="bodyMd">
                  Display Name
                </Text>
                <Text as="p" variant="bodyLg">
                  {vendorDetails.personalInfo.displayName}
                </Text>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t pt-8">
          <div className="mb-4">
            <Text variant="headingMd" as="h3">
              Other Details
            </Text>
          </div>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <Text as="p" variant="bodyMd">
                MSME Type
              </Text>
              <Text as="p" variant="bodyLg">
                {vendorDetails.otherDetails.msmeType}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                PAN
              </Text>
              <Text as="p" variant="bodyLg">
                {vendorDetails.otherDetails.panNumber || "N/A"}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd">
                Website
              </Text>
              <Text as="p" variant="bodyLg">
                {vendorDetails.otherDetails.website || "N/A"}
              </Text>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );

  const renderTransactionsTab = () => (
    <Card>
      <div className="space-y-6 p-4">
        {/* Purchase Bills */}
        <div className="border rounded-md overflow-hidden">
          <div className="p-3 bg-[#F7F7F7] border-b">
            <Text variant="headingSm" as="h3">Purchase Bills</Text>
          </div>
          <div className="p-3">
            <DataTable
              columnContentTypes={["text","text","text","text","numeric","numeric"]}
              headings={["Date","Bill Number","Order Number","Payment status","Amount","Balance Due"]}
              rows={(vendorDetails.transactions?.bills || []).map((bill: any) => [
                bill.date ? formatDate(bill.date) : "-",
                bill.billNumber || "-",
                bill.orderNumber || "-",
                renderStatusBadge(bill.paymentStatus || "-"),
                formatCurrency(Number(bill.amount || 0)),
                bill.balanceDue !== undefined ? formatCurrency(Number(bill.balanceDue || 0)) : "-",
              ])}
            />
          </div>
        </div>

        {/* Purchase Order */}
        <div className="border rounded-md overflow-hidden">
          <div className="p-3 bg-[#F7F7F7] border-b">
            <Text variant="headingSm" as="h3">Purchase Order</Text>
          </div>
          <div className="p-3">
            <DataTable
              columnContentTypes={["text","text","text","text","numeric"]}
              headings={["Date","Purchase Order #","Reference Number","Status","Amount"]}
              rows={(vendorDetails.transactions?.purchaseOrders || []).map((po: any) => [
                po.date ? formatDate(po.date) : "-",
                po.poNumber || po.purchaseOrderNo || "-",
                po.referenceNumber || "-",
                renderStatusBadge(po.status || "-"),
                formatCurrency(Number(po.amount || 0)),
              ])}
            />
          </div>
        </div>

        {/* Purchase Receives */}
        <div className="border rounded-md overflow-hidden">
          <div className="p-3 bg-[#F7F7F7] border-b">
            <Text variant="headingSm" as="h3">Purchase Receives</Text>
          </div>
          <div className="p-3">
            <DataTable
              columnContentTypes={["text","text","text","numeric"]}
              headings={["Date","Purchase Received #","Purchase Order No.","Quantity"]}
              rows={(vendorDetails.transactions?.purchaseReceives || []).map((pr: any) => [
                pr.date ? formatDate(pr.date) : "-",
                pr.prNumber || pr.purchaseReceiveNo || "-",
                pr.poNumber || pr.purchaseOrderNo || "-",
                String(pr.quantity ?? pr.qty ?? 0),
              ])}
            />
          </div>
        </div>

        {/* Vendor Credit */}
        <div className="border rounded-md overflow-hidden">
          <div className="p-3 bg-[#F7F7F7] border-b">
            <Text variant="headingSm" as="h3">Vendor Credit</Text>
          </div>
          <div className="p-3">
            <DataTable
              columnContentTypes={["text","text","text","text","numeric"]}
              headings={["Date","Credit Note #","Reference Number","Status","Amount"]}
              rows={(vendorDetails.transactions?.vendorCredits || []).map((vc: any) => [
                vc.date ? formatDate(vc.date) : "-",
                vc.creditNumber || vc.creditNoteNo || "-",
                vc.referenceNumber || "-",
                renderStatusBadge(vc.status || "-"),
                formatCurrency(Number(vc.amount || 0)),
              ])}
            />
          </div>
        </div>
      </div>
    </Card>
  );

  const renderBankDetailsTab = () => (
    <Card>
      <div className="p-5">
        <Text variant="headingMd" as="h3">
          Bank Accounts
        </Text>
        {vendorDetails.bankDetails.length > 0 ? (
          <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={["Account Holder", "Account Number", "Bank Name", "IFSC"]}
            rows={vendorDetails.bankDetails.map((bank) => [
              bank.accountHolderName || "-",
              bank.accountNumber || "-",
              bank.bankName || "-",
              bank.ifsc || "-",
            ])}
          />
        ) : (
          <Text tone="disabled" as="span">
            No bank details available
          </Text>
        )}
      </div>
    </Card>
  );

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold">Vendor Details</h1>
      </div>

      <Tabs tabs={tabs} selected={selectedTab} onSelect={setSelectedTab}>
        <div className="mt-4">
          {selectedTab === 0 && renderInformationTab()}
          {selectedTab === 1 && renderTransactionsTab()}
          {selectedTab === 2 && renderBankDetailsTab()}
        </div>
      </Tabs>

      {isLoadingDetails && <div>Loading...</div>}
    </div>
  );
}
