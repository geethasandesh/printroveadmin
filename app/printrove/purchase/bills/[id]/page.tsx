"use client";

import React, { useEffect, useState } from "react";
import { Card, Text, BlockStack, Badge } from "@shopify/polaris";
import { useBillStore } from "@/store/useBillStore";
import { Button } from "@/app/components/Button";
import {
  PrintIcon,
  PageDownIcon,
  EditIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";
import { useRouter } from "next/navigation";

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentBill, isLoading, error, getBillById } = useBillStore();
  const [isPrinting, setIsPrinting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    getBillById(params.id);
  }, [params.id]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined) return "--";
    return amount.toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
    });
  };

  const handlePrint = () => {
    setIsPrinting(true);
    window.print();
    setTimeout(() => setIsPrinting(false), 500);
  };

  const handleDownloadPDF = () => {
    setIsDownloading(true);
    // Logic to download PDF would go here
    // For now, just simulate with a timeout
    setTimeout(() => {
      alert("PDF downloaded successfully");
      setIsDownloading(false);
    }, 1000);
  };

  const handleEdit = () => {
    router.push(`/printrove/purchase/bills/${params.id}/edit`);
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this bill?")) {
      // Delete API call would go here
      alert("Bill deleted successfully");
      router.push("/printrove/purchase/bills");
    }
  };

  const getStatusBadge = (status: string) => {
    let tone: "success" | "warning" | "critical" | "info" = "info";

    switch (status) {
      case "paid":
        tone = "success";
        break;
      case "partially_paid":
        tone = "warning";
        break;
      case "overdue":
        tone = "critical";
        break;
      default:
        tone = "info";
    }

    return (
      <Badge tone={tone}>
        {status
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5] flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5] flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  if (!currentBill) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5] flex items-center justify-center">
        Bill not found
      </div>
    );
  }

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-2xl font-bold">
          Purchase Bill - #{currentBill.bill_number}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="md"
            className="flex items-center gap-2"
            onClick={handlePrint}
          >
            <PrintIcon className="w-5 h-5" />
            Print
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="flex items-center gap-2"
            onClick={handleDownloadPDF}
          >
            <PageDownIcon className="w-5 h-5" />
            Download PDF
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="flex items-center gap-2"
            onClick={handleEdit}
          >
            <EditIcon className="w-5 h-5" />
            Edit
          </Button>
          <Button
            variant="secondary"
            size="md"
            className="flex items-center gap-2"
            onClick={handleDelete}
          >
            <DeleteIcon className="w-5 h-5" />
            Delete
          </Button>
        </div>
      </div>

      <BlockStack>
        {/* Card 1: Purchase Bill Information */}
        <div className="mb-4">
          <Card>
            <div className="p-4">
              <Text as="h2" variant="headingMd" fontWeight="semibold">
                Purchase Bill Information
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Vendor Name
                    </Text>
                    <div className="mt-1">{currentBill.vendor_name}</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      PB Number
                    </Text>
                    <div className="mt-1">{currentBill.bill_number}</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Status
                    </Text>
                    <div className="mt-1">
                      {getStatusBadge(currentBill.status)}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Bill Number
                    </Text>
                    <div className="mt-1">
                      {currentBill.reference_number || "--"}
                    </div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Bill Date
                    </Text>
                    <div className="mt-1">{formatDate(currentBill.date)}</div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Due Date
                    </Text>
                    <div className="mt-1">{formatDate(currentBill.date)}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Balance Due
                    </Text>
                    <div className="mt-1">
                      {formatCurrency(currentBill.total)}
                    </div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Sub Total
                    </Text>
                    <div className="mt-1">
                      {formatCurrency(currentBill.sub_total)}
                    </div>
                  </div>
                  <div>
                    <Text as="span" tone="subdued" fontWeight="semibold">
                      Total
                    </Text>
                    <div className="mt-1 font-bold">
                      {formatCurrency(currentBill.total)}
                    </div>
                  </div>
                </div>
              </div>

              {currentBill.notes && (
                <div className="mt-4">
                  <Text as="span" tone="subdued" fontWeight="semibold">
                    Notes
                  </Text>
                  <div className="mt-1 p-2 bg-gray-50 rounded">
                    {currentBill.notes}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Card 2: Line Items */}
        <Card>
          <div className="p-4">
            <Text as="h2" variant="headingMd" fontWeight="semibold">
              Line Items
            </Text>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {currentBill.line_items.map((item) => (
                  <tr key={item.line_item_id}>
                    <td className="px-4 py-3">{item.name}</td>
                    <td className="px-4 py-3">{item.sku || "--"}</td>
                    <td className="px-4 py-3 text-right">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.rate)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(item.item_total)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-gray-200">
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-medium">
                    Sub Total:
                  </td>
                  <td className="px-4 py-3 text-right">
                    {formatCurrency(currentBill.sub_total)}
                  </td>
                </tr>
                {currentBill.tax_total > 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-4 py-3 text-right font-medium"
                    >
                      Tax:
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(currentBill.tax_total)}
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={4} className="px-4 py-3 text-right font-bold">
                    Total:
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatCurrency(currentBill.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      </BlockStack>

      {/* Add print styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .p-8 {
            padding: 1rem !important;
          }
          #printSection,
          #printSection * {
            visibility: visible;
          }
          #printSection {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
