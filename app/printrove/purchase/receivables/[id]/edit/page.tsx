"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Page,
  Card,
  Text,
  TextField,
  Select,
  Button,
  Spinner,
  ButtonGroup,
  BlockStack,
} from "@shopify/polaris";
import { ArrowLeftIcon } from "@shopify/polaris-icons";
import { usePurchaseReceiveStore } from "@/store/usePurchaseReceiveStore";
import { useVendorStore } from "@/store/useVendorStore";
import { UpdatePurchaseReceivePayload } from "@/types/purchase-receive";

export default function EditPurchaseReceive() {
  const { id } = useParams();
  const router = useRouter();

  const {
    selectedReceive,
    isLoadingDetails,
    error,
    fetchPurchaseReceiveById,
    updatePurchaseReceiveById,
    resetSelectedReceive,
  } = usePurchaseReceiveStore();

  const { allVendors, isLoadingAll, fetchAllVendors } = useVendorStore();

  const [vendorId, setVendorId] = useState("");
  const [date, setDate] = useState<string>("");
  const [billNumber, setBillNumber] = useState("");
  const [packagesCount, setPackagesCount] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [status, setStatus] = useState<"pending" | "completed">("pending");
  const [lineItems, setLineItems] = useState<
    Array<{ id: string; product_id: string; received_qty: string; rejected_qty: string; name?: string }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPurchaseReceiveById(id as string);
    }
    fetchAllVendors();

    return () => {
      resetSelectedReceive();
    };
  }, [id, fetchPurchaseReceiveById, fetchAllVendors, resetSelectedReceive]);

  useEffect(() => {
    if (selectedReceive) {
      setVendorId(selectedReceive.vendor_id || "");
      // Normalize to YYYY-MM-DD for input type=date
      const normalized = selectedReceive.date
        ? new Date(selectedReceive.date).toISOString().slice(0, 10)
        : "";
      setDate(normalized);
      setBillNumber(selectedReceive.bill_number || "");
      setPackagesCount(
        typeof selectedReceive.packages_count === "number"
          ? String(selectedReceive.packages_count)
          : ""
      );
      setShippingCompany(selectedReceive.shipping_company || "");
      setTrackingNumber(selectedReceive.tracking_number || "");
      setStatus(selectedReceive.status);
      setLineItems(
        (selectedReceive.line_items || []).map((li) => ({
          id: li.product_id,
          product_id: li.product_id,
          received_qty: String(li.received_qty ?? 0),
          rejected_qty: String(li.rejected_qty ?? 0),
          name: li.product_name,
        }))
      );
    }
  }, [selectedReceive]);

  const vendorOptions = useMemo(
    () => [
      { label: "Select Vendor", value: "" },
      ...allVendors.map((vendor) => ({
        label: `${vendor.vendorName}${vendor.companyName ? ` - ${vendor.companyName}` : ""}`,
        value: vendor.id,
      })),
    ],
    [allVendors]
  );

  const statusOptions = [
    { label: "Pending", value: "pending" },
    { label: "Completed", value: "completed" },
  ];

  const handleBack = () => {
    router.push(`/printrove/purchase/receivables/${id}`);
  };

  const handleLineItemChange = (
    productId: string,
    field: "received_qty" | "rejected_qty",
    value: string
  ) => {
    setLineItems((prev) =>
      prev.map((li) => (li.product_id === productId ? { ...li, [field]: value } : li))
    );
  };

  const buildUpdatePayload = (): UpdatePurchaseReceivePayload => {
    if (!selectedReceive) return {};

    const payload: UpdatePurchaseReceivePayload = {};

    if (vendorId && vendorId !== selectedReceive.vendor_id) {
      payload.vendor_id = vendorId;
    }

    if (date) {
      const normalized = new Date(date).toISOString().slice(0, 10);
      const existing = selectedReceive.date
        ? new Date(selectedReceive.date).toISOString().slice(0, 10)
        : "";
      if (normalized !== existing) {
        payload.date = normalized;
      }
    }

    if (billNumber !== (selectedReceive.bill_number || "")) {
      payload.bill_number = billNumber;
    }

    const pkgNum = packagesCount ? parseInt(packagesCount) : undefined;
    if (
      typeof pkgNum === "number" &&
      !Number.isNaN(pkgNum) &&
      pkgNum !== selectedReceive.packages_count
    ) {
      payload.packages_count = pkgNum;
    }

    if (shippingCompany !== (selectedReceive.shipping_company || "")) {
      payload.shipping_company = shippingCompany;
    }

    if (trackingNumber !== (selectedReceive.tracking_number || "")) {
      payload.tracking_number = trackingNumber;
    }

    if (status !== selectedReceive.status) {
      payload.status = status;
    }

    // Line items: include only changed items
    const changedLineItems = lineItems
      .map((li) => ({
        product_id: li.product_id,
        received_qty: parseInt(li.received_qty || "0"),
        rejected_qty: parseInt(li.rejected_qty || "0"),
      }))
      .filter((updated) => {
        const original = selectedReceive.line_items.find(
          (o) => o.product_id === updated.product_id
        );
        if (!original) return true;
        return (
          (original.received_qty ?? 0) !== (updated.received_qty ?? 0) ||
          (original.rejected_qty ?? 0) !== (updated.rejected_qty ?? 0)
        );
      });

    if (changedLineItems.length > 0) {
      payload.line_items = changedLineItems;
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!id || !selectedReceive) return;
    const payload = buildUpdatePayload();

    if (Object.keys(payload).length === 0) {
      router.push(`/printrove/purchase/receivables/${id}`);
      return;
    }

    setIsSubmitting(true);
    const success = await updatePurchaseReceiveById(id as string, payload);
    setIsSubmitting(false);
    if (success) {
      router.push(`/printrove/purchase/receivables/${id}`);
    }
  };

  if (isLoadingDetails) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !selectedReceive) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Error loading purchase receive
            </Text>
            <Text as="span">{error || "Purchase receive not found"}</Text>
            <Button onClick={() => router.push("/printrove/purchase/receivables")}>Back to List</Button>
          </BlockStack>
        </Card>
      </div>
    );
  }

  return (
    <Page title={`Edit Purchase Receive: ${selectedReceive.purchase_receive_id}`}>
      <BlockStack>
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Basic Details
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Vendor"
                options={vendorOptions}
                value={vendorId}
                onChange={(val) => setVendorId(val)}
                disabled={isLoadingAll}
              />
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(val) => setDate(val)}
              />
              <TextField
                label="Bill Number"
                value={billNumber}
                onChange={(val) => setBillNumber(val)}
                autoComplete="off"
              />
              <TextField
                label="Packages Count"
                type="number"
                value={packagesCount}
                onChange={(val) => setPackagesCount(val)}
                autoComplete="off"
                min="0"
              />
              <TextField
                label="Shipping Company"
                value={shippingCompany}
                onChange={(val) => setShippingCompany(val)}
                autoComplete="off"
              />
              <TextField
                label="Tracking Number"
                value={trackingNumber}
                onChange={(val) => setTrackingNumber(val)}
                autoComplete="off"
              />
              <Select
                label="Status"
                options={statusOptions}
                value={status}
                onChange={(val) => setStatus(val as "pending" | "completed")}
              />
            </div>
          </BlockStack>
        </Card>

        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Line Items
            </Text>
            {lineItems.length === 0 ? (
              <Text>No line items found.</Text>
            ) : (
              <div className="space-y-3">
                {lineItems.map((li) => (
                  <div key={li.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                    <div className="md:col-span-2">
                      <Text variant="bodyMd" as="p">
                        {li.name || li.product_id}
                      </Text>
                    </div>
                    <TextField
                      label="Accepted Qty"
                      type="number"
                      value={li.received_qty}
                      min="0"
                      onChange={(val) => handleLineItemChange(li.product_id, "received_qty", val)}
                    />
                    <TextField
                      label="Rejected Qty"
                      type="number"
                      value={li.rejected_qty}
                      min="0"
                      onChange={(val) => handleLineItemChange(li.product_id, "rejected_qty", val)}
                    />
                  </div>
                ))}
              </div>
            )}
          </BlockStack>
        </Card>

        <div className="flex justify-between items-center mt-4">
          <Button icon={ArrowLeftIcon} onClick={handleBack}>
            Back to Details
          </Button>
          <ButtonGroup>
            <Button onClick={handleBack} variant="secondary" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="primary" loading={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Receive"}
            </Button>
          </ButtonGroup>
        </div>
      </BlockStack>
    </Page>
  );
}


