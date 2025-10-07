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
import { useBillStore } from "@/store/useBillStore";
import { useVendorStore } from "@/store/useVendorStore";
import { UpdateBillPayload } from "@/types/purchase-bill";

export default function EditPurchaseBill() {
  const { id } = useParams();
  const router = useRouter();

  const {
    currentBill,
    isLoading,
    error,
    getBillById,
    updateBillById,
    isUpdating,
  } = useBillStore();

  const { allVendors, isLoadingAll, fetchAllVendors } = useVendorStore();

  const [vendorId, setVendorId] = useState("");
  const [reference, setReference] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [status, setStatus] = useState<"open" | "paid" | "partially_paid" | "overdue" | "void">("open");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [lineItems, setLineItems] = useState<
    Array<{
      id: string;
      productId: string;
      quantity: string;
      rate: string;
      amount: string;
      name?: string;
      sku?: string;
    }>
  >([]);

  useEffect(() => {
    if (id) {
      getBillById(id as string);
    }
    fetchAllVendors();
  }, [id, getBillById, fetchAllVendors]);

  useEffect(() => {
    if (currentBill) {
      setVendorId(currentBill.vendor_id || "");
      // Normalize to YYYY-MM-DD for input type=date
      const normalizedBillDate = currentBill.date
        ? new Date(currentBill.date).toISOString().slice(0, 10)
        : "";
      const normalizedDueDate = currentBill.due_date
        ? new Date(currentBill.due_date).toISOString().slice(0, 10)
        : "";
      setBillDate(normalizedBillDate);
      setDueDate(normalizedDueDate);
      setReference(currentBill.reference_number || "");
      setBillNumber(currentBill.bill_number || "");
      setStatus(currentBill.status as typeof status);
      setNotes(currentBill.notes || "");
      setTerms(currentBill.terms || "");
      setLineItems(
        (currentBill.line_items || []).map((li) => ({
          id: li.line_item_id,
          productId: li.item_id,
          quantity: String(li.quantity || 0),
          rate: String(li.rate || 0),
          amount: String(li.item_total || 0),
          name: li.name,
          sku: li.sku,
        }))
      );
    }
  }, [currentBill]);

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
    { label: "Open", value: "open" },
    { label: "Paid", value: "paid" },
    { label: "Partially Paid", value: "partially_paid" },
    { label: "Overdue", value: "overdue" },
    { label: "Void", value: "void" },
  ];

  const handleBack = () => {
    router.push(`/printrove/purchase/bills/${id}`);
  };

  const handleLineItemChange = (
    lineItemId: string,
    field: "quantity" | "rate",
    value: string
  ) => {
    setLineItems((prev) =>
      prev.map((li) => {
        if (li.id === lineItemId) {
          const updated = { ...li, [field]: value };
          // Auto-calculate amount when quantity or rate changes
          if (field === "quantity" || field === "rate") {
            const qty = parseFloat(field === "quantity" ? value : updated.quantity) || 0;
            const rate = parseFloat(field === "rate" ? value : updated.rate) || 0;
            updated.amount = String(qty * rate);
          }
          return updated;
        }
        return li;
      })
    );
  };

  const buildUpdatePayload = (): UpdateBillPayload => {
    if (!currentBill) return {};

    const payload: UpdateBillPayload = {};

    if (vendorId && vendorId !== currentBill.vendor_id) {
      payload.vendorId = vendorId;
    }

    if (reference !== (currentBill.reference_number || "")) {
      payload.reference = reference;
    }

    if (billNumber !== (currentBill.bill_number || "")) {
      payload.billNumber = billNumber;
    }

    if (billDate) {
      const normalized = new Date(billDate).toISOString().slice(0, 10);
      const existing = currentBill.date
        ? new Date(currentBill.date).toISOString().slice(0, 10)
        : "";
      if (normalized !== existing) {
        payload.billDate = normalized;
      }
    }

    if (dueDate) {
      const normalized = new Date(dueDate).toISOString().slice(0, 10);
      const existing = currentBill.due_date
        ? new Date(currentBill.due_date).toISOString().slice(0, 10)
        : "";
      if (normalized !== existing) {
        payload.dueDate = normalized;
      }
    }

    if (status !== currentBill.status) {
      payload.status = status;
    }

    if (notes !== (currentBill.notes || "")) {
      payload.notes = notes;
    }

    if (terms !== (currentBill.terms || "")) {
      payload.terms = terms;
    }

    // Line items: include only changed items
    const changedLineItems = lineItems
      .map((li) => ({
        id: li.id,
        productId: li.productId,
        quantity: li.quantity,
        rate: li.rate,
        amount: li.amount,
      }))
      .filter((updated) => {
        const original = currentBill.line_items.find(
          (o) => o.line_item_id === updated.id
        );
        if (!original) return true;
        return (
          String(original.quantity) !== updated.quantity ||
          String(original.rate) !== updated.rate ||
          String(original.item_total) !== updated.amount
        );
      });

    if (changedLineItems.length > 0) {
      payload.items = changedLineItems;
    }

    return payload;
  };

  const handleSubmit = async () => {
    if (!id || !currentBill) return;
    const payload = buildUpdatePayload();

    if (Object.keys(payload).length === 0) {
      router.push(`/printrove/purchase/bills/${id}`);
      return;
    }

    const success = await updateBillById(id as string, payload);
    if (success) {
      router.push(`/printrove/purchase/bills/${id}`);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !currentBill) {
    return (
      <div className="h-full flex items-center justify-center">
        <Card>
          <BlockStack>
            <Text variant="headingMd" as="h2">
              Error loading purchase bill
            </Text>
            <Text as="span">{error || "Purchase bill not found"}</Text>
            <Button onClick={() => router.push("/printrove/purchase/bills")}>Back to Bills</Button>
          </BlockStack>
        </Card>
      </div>
    );
  }

  return (
    <Page title={`Edit Purchase Bill: ${currentBill.bill_number}`}>
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
                label="Reference Number"
                value={reference}
                onChange={(val) => setReference(val)}
                autoComplete="off"
              />
              <TextField
                label="Bill Number"
                value={billNumber}
                onChange={(val) => setBillNumber(val)}
                autoComplete="off"
              />
              <TextField
                label="Bill Date"
                type="date"
                value={billDate}
                onChange={(val) => setBillDate(val)}
              />
              <TextField
                label="Due Date"
                type="date"
                value={dueDate}
                onChange={(val) => setDueDate(val)}
              />
              <Select
                label="Status"
                options={statusOptions}
                value={status}
                onChange={(val) => setStatus(val as typeof status)}
              />
              <div className="md:col-span-2">
                <TextField
                  label="Notes"
                  value={notes}
                  onChange={(val) => setNotes(val)}
                  multiline={3}
                  autoComplete="off"
                />
              </div>
              <div className="md:col-span-2">
                <TextField
                  label="Terms"
                  value={terms}
                  onChange={(val) => setTerms(val)}
                  multiline={2}
                  autoComplete="off"
                />
              </div>
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
                  <div key={li.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="md:col-span-2">
                      <Text variant="bodyMd" as="p">
                        {li.name || li.productId}
                      </Text>
                      {li.sku && (
                        <Text variant="bodySm" as="p" tone="subdued">
                          SKU: {li.sku}
                        </Text>
                      )}
                    </div>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={li.quantity}
                      min="0"
                      onChange={(val) => handleLineItemChange(li.id, "quantity", val)}
                    />
                    <TextField
                      label="Rate"
                      type="number"
                      value={li.rate}
                      min="0"
                      step="0.01"
                      onChange={(val) => handleLineItemChange(li.id, "rate", val)}
                    />
                    <TextField
                      label="Amount"
                      type="number"
                      value={li.amount}
                      readOnly
                      disabled
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
            <Button onClick={handleBack} variant="secondary" disabled={isUpdating}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} variant="primary" loading={isUpdating}>
              {isUpdating ? "Updating..." : "Update Bill"}
            </Button>
          </ButtonGroup>
        </div>
      </BlockStack>
    </Page>
  );
}
