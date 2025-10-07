"use client";

import React, { useEffect } from "react";
import { Card, Page, Text, Spinner, Badge, Button, DataTable, Modal, TextContainer } from "@shopify/polaris";
import { useVendorCreditStore } from "@/store/useVendorCreditStore";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PrintIcon,
  PageDownIcon,
  EmailIcon,
  EditIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";

export default function VendorCreditDetails() {
  const router = useRouter();
  const routeParams = useParams();
  const id = (routeParams?.id as string) || "";
  const { currentCredit, isLoadingDetails, fetchVendorCreditById, deleteVendorCredit } =
    useVendorCreditStore();

  useEffect(() => {
    if (id) fetchVendorCreditById(id);
  }, [id]);

  useEffect(() => {
    const styleEl = document.createElement("style");
    styleEl.innerHTML = `
      .vendor-credit-datatable thead {
        background-color: #f3f4f6 !important; /* gray header */
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      document.head.removeChild(styleEl);
    };
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  const getStatusBadge = (status: string) => {
    let color: "info" | "success" | "warning" | "critical" = "info";

    switch (status.toLowerCase()) {
      case "open":
        color = "success";
        break;
      case "applied":
      case "completed":
        color = "success";
        break;
      case "pending":
        color = "warning";
        break;
      case "cancelled":
        color = "critical";
        break;
    }

    return <Badge tone={color}>{status}</Badge>;
  };

  const handleBack = () => {
    router.push("/printrove/purchase/credits");
  };

  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  // Edit moved to dedicated page for full form controls

  const handleOpenEdit = () => {
    if (!currentCredit) return;
    const id = (currentCredit as any).id || currentCredit._id || (currentCredit as any).vendor_credit_id;
    if (!id) return;
    router.push(`/printrove/purchase/credits/update/${id}`);
  };

  const handleConfirmDelete = async () => {
    if (!currentCredit) return;
    const id = (currentCredit as any).id || currentCredit._id || (currentCredit as any).vendor_credit_id;
    if (!id) return;
    const ok = await deleteVendorCredit(id);
    if (ok) {
      setIsDeleteOpen(false);
      router.push("/printrove/purchase/credits");
    } else {
      alert("Failed to delete vendor credit");
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (!currentCredit) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5]">
        <Card>
          <div className="p-6 text-center">
            <Text variant="headingMd" as="h2">Vendor credit not found</Text>
            <div className="mt-4">
              <Button onClick={handleBack}>Back to vendor credits</Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex items-center mb-6">
        <button
          className="flex items-center mr-4 text-gray-600 hover:text-blue-600"
          onClick={handleBack}
        >
          <ArrowLeftIcon className="w-5 h-5 mr-1" />
        </button>
        <Text variant="headingLg" as="h1" fontWeight="bold">
          Vendor Credit - {currentCredit.creditNumber}
        </Text>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-4 mb-6 gap-4">
        {/* Icon-only: Print */}
        <Button
          variant="secondary"
          icon={PrintIcon}
          accessibilityLabel="Print vendor credit"
          onClick={() => window.print()}
        />
        {/* Icon-only: PDF */}
        <Button
          variant="secondary"
          icon={PageDownIcon}
          accessibilityLabel="Download PDF"
          onClick={() => {
            // Implement PDF functionality
            console.log("Generate PDF");
          }}
        />
        {/* With labels + icons */}
        <Button
          variant="secondary"
          icon={EmailIcon}
          onClick={() => {
            // Implement send email functionality
            console.log("Send Email");
          }}
        >
          Send Email
        </Button>
        <Button
          variant="secondary"
          icon={EditIcon}
          onClick={handleOpenEdit}
        >
          Edit
        </Button>
        <Button
          variant="secondary"
          icon={DeleteIcon}
          tone="critical"
          onClick={() => setIsDeleteOpen(true)}
        >
          Delete
        </Button>
      </div>
      <div className="grid grid-cols-10 gap-6">
        <div className="col-span-10 lg:col-span-7 space-y-6">
        {/* Vendor Credit Information */}
        <Card>
          <div className="">
            <div className="mb-4">
              <Text variant="headingMd" as="h2" fontWeight="bold">
                Vendor Credit Information
              </Text>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Vendor Name
                </Text>
                <Text variant="bodyLg" as="p" fontWeight="medium">
                  {currentCredit.vendorName}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Vendor Credit Number
                </Text>
                <Text variant="bodyLg" as="p" fontWeight="medium">
                  {currentCredit.creditNumber}
                </Text>
              </div>

                <div>
                  <Text variant="bodyMd" as="p" tone="subdued">
                    Status
                  </Text>
                  <div className="mt-1">
                    {getStatusBadge(currentCredit.status)}
                  </div>
                </div>

              <div>
                <Text variant="bodyMd" as="p" tone="subdued">
                  PB Number
                </Text>
                <Text variant="bodyLg" as="p" fontWeight="medium">
                  {currentCredit.purchaseBill || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" as="p" tone="subdued">
                  PR Number
                </Text>
                <Text variant="bodyLg" as="p" fontWeight="medium">
                  {currentCredit.reference || "N/A"}
                </Text>
              </div>

              <div>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Date
                </Text>
                <Text variant="bodyLg" as="p" fontWeight="medium">
                  {formatDate(currentCredit.date)}
                </Text>
              </div>
            </div>

            {currentCredit.notes && (
              <div className="mt-6">
                <Text variant="bodyMd" as="p" tone="subdued">
                  Notes
                </Text>
                <div className="mt-1 p-3 bg-gray-50 rounded-md">
                  <Text variant="bodyMd" as="p">{currentCredit.notes}</Text>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Items */}
        <Card padding="0">
          <div className="vendor-credit-datatable p-0">
            {(() => {
              const items = currentCredit.items || [];
              const rows = items.map((item) => [
                (
                  <div>
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-sm text-gray-500">SKU: {item.id}</div>
                  </div>
                ),
                item.quantity,
                formatCurrency(item.rate),
                formatCurrency(item.amount),
              ]);
              const total = items.reduce(
                (sum, item) => sum + (item.amount || 0),
                0
              );
              return (
                <>
                  <DataTable
                    columnContentTypes={["text", "numeric", "numeric", "numeric"]}
                    headings={["Product", "Quantity", "Rate", "Amount"]}
                    rows={rows}
                    totals={["", "", "Total", formatCurrency(total)]}
                    showTotalsInFooter
                  />
                  <div className="flex justify-end bg-gray-50 mt-2 px-4 py-3 rounded">
                    <div className="font-medium mr-2">Credits Remaining:</div>
                    <div className="font-bold">
                      {currentCredit.amount?.formatted || formatCurrency(total)}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </Card>
        </div>
        <div className="hidden lg:block lg:col-span-3" />
      </div>

      {/* Edit moved to a dedicated full form page */}

      {/* Delete Confirmation Modal */}
      <Modal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Vendor Credit"
        primaryAction={{ content: "Delete", destructive: true, onAction: handleConfirmDelete }}
        secondaryActions={[{ content: "Cancel", onAction: () => setIsDeleteOpen(false) }]}
      >
        <Modal.Section>
          <TextContainer>
            <p>Are you sure you want to delete this vendor credit? This action cannot be undone.</p>
          </TextContainer>
        </Modal.Section>
      </Modal>
    </div>
  );
}
