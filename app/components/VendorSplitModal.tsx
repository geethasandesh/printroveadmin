"use client";

import React, { useState, useEffect } from "react";
import {
  Modal,
  TextField,
  Select,
  Button,
  Text,
  Icon,
  InlineStack,
  BlockStack,
  Banner,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";

interface VendorSplit {
  vendorId: string;
  vendorName: string;
  quantity: number;
  rate: number;
}

interface VendorSplitModalProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  totalQuantity: number;
  vendors: Array<{
    id: string;
    vendorId: string;
    vendorName: string;
    companyName?: string;
  }>;
  onSave: (splits: VendorSplit[]) => void;
  existingSplits?: VendorSplit[];
  showSaveAndNext?: boolean;
  onSaveAndNext?: (splits: VendorSplit[]) => void;
}

export default function VendorSplitModal({
  open,
  onClose,
  productName,
  totalQuantity,
  vendors,
  onSave,
  existingSplits = [],
  showSaveAndNext = false,
  onSaveAndNext,
}: VendorSplitModalProps) {
  const [splits, setSplits] = useState<VendorSplit[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  // Initialize or reset splits only when the modal opens or totalQuantity changes.
  // Avoid depending directly on existingSplits (array identity may change each render)
  useEffect(() => {
    if (!open) return;

    setErrors([]);

    if (existingSplits && existingSplits.length > 0) {
      // Only update if different to prevent update loops
      setSplits((prev) => {
        const isSame = JSON.stringify(prev) === JSON.stringify(existingSplits);
        return isSame ? prev : existingSplits;
      });
    } else {
      setSplits([
        {
          vendorId: "",
          vendorName: "",
          quantity: totalQuantity,
          rate: 0,
        },
      ]);
    }
  }, [open, totalQuantity]);

  const vendorOptions = vendors.map((v) => ({
    label: v.vendorName
      ? `${v.vendorName}${v.companyName ? ` - ${v.companyName}` : ""}`
      : v.companyName || v.id,
    value: v.vendorId || v.id,
  }));

  const addSplit = () => {
    setSplits((prev) => [
      ...prev,
      {
        vendorId: "",
        vendorName: "",
        quantity: 0,
        rate: 0,
      },
    ]);
  };

  const removeSplit = (index: number) => {
    setSplits((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateSplit = (index: number, field: keyof VendorSplit, value: any) => {
    setSplits((prev) => {
      const updated = [...prev];

      if (field === "vendorId") {
        const vendor = vendors.find((v) => v.vendorId === value || v.id === value);
        updated[index].vendorId = value;
        updated[index].vendorName = vendor ? vendor.vendorName || vendor.companyName || "" : "";
      } else if (field === "quantity") {
        updated[index].quantity = parseFloat(value) || 0;
      } else if (field === "rate") {
        updated[index].rate = parseFloat(value) || 0;
      }

      return updated;
    });
  };

  const validateSplits = (): boolean => {
    const newErrors: string[] = [];

    // Check if all vendors are selected
    splits.forEach((split, index) => {
      if (!split.vendorId) {
        newErrors.push(`Vendor is required for split ${index + 1}`);
      }
      if (split.quantity <= 0) {
        newErrors.push(`Quantity must be greater than 0 for split ${index + 1}`);
      }
      if (split.rate < 0) {
        newErrors.push(`Rate cannot be negative for split ${index + 1}`);
      }
    });

    // Check for duplicate vendors
    const vendorIds = splits.map((s) => s.vendorId);
    const uniqueVendors = new Set(vendorIds);
    if (vendorIds.length !== uniqueVendors.size) {
      newErrors.push("Cannot assign the same vendor multiple times");
    }

    // Check if total quantity matches
    const totalSplitQty = splits.reduce((sum, split) => sum + split.quantity, 0);
    if (totalSplitQty !== totalQuantity) {
      newErrors.push(
        `Total split quantity (${totalSplitQty}) must equal order quantity (${totalQuantity})`
      );
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = () => {
    if (validateSplits()) {
      onSave(splits);
      onClose();
    }
  };

  const handleSaveAndNext = () => {
    if (validateSplits()) {
      if (onSaveAndNext) {
        onSaveAndNext(splits);
      } else {
        onSave(splits);
      }
      onClose();
    }
  };

  const totalSplitQuantity = splits.reduce((sum, split) => sum + split.quantity, 0);
  const totalAmount = splits.reduce((sum, split) => sum + split.quantity * split.rate, 0);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Split Order - ${productName}`}
      primaryAction={{
        content: showSaveAndNext ? "Save and Next" : "Save Split",
        onAction: showSaveAndNext ? handleSaveAndNext : handleSave,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: onClose,
        },
      ]}
    >
      <Modal.Section>
        <BlockStack gap="400">
          <Text variant="bodyMd" as="p">
            Total Quantity to Order: <strong>{totalQuantity} units</strong>
          </Text>

          {errors.length > 0 && (
            <Banner tone="critical">
              <BlockStack gap="200">
                {errors.map((error, index) => (
                  <Text key={index} as="p">
                    • {error}
                  </Text>
                ))}
              </BlockStack>
            </Banner>
          )}

          <div className="space-y-4">
            {splits.map((split, index) => (
              <div
                key={index}
                className="p-4 border border-gray-300 rounded-lg space-y-3"
              >
                <div className="flex justify-between items-center">
                  <Text variant="headingSm" as="h4">
                    Split {index + 1}
                  </Text>
                  {splits.length > 1 && (
                    <Button
                      size="slim"
                      icon={DeleteIcon}
                      onClick={() => removeSplit(index)}
                      tone="critical"
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select
                    label="Vendor"
                    options={[
                      { label: "Select Vendor", value: "" },
                      ...vendorOptions,
                    ]}
                    value={split.vendorId}
                    onChange={(value) => updateSplit(index, "vendorId", value)}
                  />

                  <TextField
                    label="Quantity"
                    type="number"
                    value={String(split.quantity)}
                    onChange={(value) => updateSplit(index, "quantity", value)}
                    autoComplete="off"
                    min={0}
                  />

                  <TextField
                    label="Rate per Unit (₹)"
                    type="number"
                    value={String(split.rate)}
                    onChange={(value) => updateSplit(index, "rate", value)}
                    autoComplete="off"
                    min={0}
                  />

                  <div className="flex items-end">
                    <TextField
                      label="Amount"
                      value={`₹${(split.quantity * split.rate).toLocaleString("en-IN")}`}
                      disabled
                      autoComplete="off"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={addSplit} fullWidth>
            + Add Another Vendor
          </Button>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Total Allocated Quantity:
                </Text>
                <Text
                  variant="headingMd"
                  as="p"
                  tone={totalSplitQuantity === totalQuantity ? "success" : "critical"}
                >
                  {totalSplitQuantity} / {totalQuantity} units
                </Text>
              </div>
              <div>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Total Amount:
                </Text>
                <Text variant="headingMd" as="p">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </Text>
              </div>
            </div>
          </div>
        </BlockStack>
      </Modal.Section>
    </Modal>
  );
}

