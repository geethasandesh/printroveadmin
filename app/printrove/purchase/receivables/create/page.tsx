"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Card,
  Text,
  TextField,
  Button,
  Select,
  Banner,
} from "@shopify/polaris";
import { useSearchParams, useRouter } from "next/navigation";
import { useProductStore } from "@/store/useProductStore";
import { useVendorStore } from "@/store/useVendorStore";
import { usePurchaseReceiveStore } from "@/store/usePurchaseReceiveStore";

interface LineItem {
  id: string;
  product_id: string;
  product_name?: string;
  received_qty: number;
  rejected_qty: number;
}

interface PurchaseReceiveForm {
  vendor_id: string;
  date: Date;
  bill_number: string;
  packages_count: number;
  shipping_company: string;
  tracking_number: string;
  status: "pending" | "completed";
  line_items: LineItem[];
}

const initialLineItem: LineItem = {
  id: "1",
  product_id: "",
  received_qty: 0,
  rejected_qty: 0,
};

function PurchaseReceiveContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const vendorId = searchParams.get("vendor") || "";
  const billNumber = searchParams.get("billNumber") || "";
  const packagesCount = searchParams.get("packagesCount") || "1";
  const shippingCompany = searchParams.get("shippingCompany") || "";
  const trackingNumber = searchParams.get("trackingNumber") || "";

  const {
    allProducts,
    isLoadingAll: isLoadingProducts,
    fetchAllProducts,
  } = useProductStore();
  const {
    vendors,
    fetchAllVendors,
    isLoadingAll: isLoadingVendors,
  } = useVendorStore();
  const { createPurchaseReceive, isCreating } = usePurchaseReceiveStore();

  const [formData, setFormData] = useState<PurchaseReceiveForm>({
    vendor_id: vendorId,
    date: new Date(),
    bill_number: billNumber,
    packages_count: parseInt(packagesCount) || 1,
    shipping_company: shippingCompany,
    tracking_number: trackingNumber,
    status: "pending",
    line_items: [initialLineItem],
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showErrorBanner, setShowErrorBanner] = useState(false);

  useEffect(() => {
    fetchAllProducts();
    fetchAllVendors();
  }, [fetchAllProducts, fetchAllVendors]);

  const handleInputChange = (
    field: keyof Omit<PurchaseReceiveForm, "line_items" | "date">,
    value: any
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleDateChange = (date: Date) => {
    setFormData((prev) => ({ ...prev, date }));
    setErrors((prev) => ({ ...prev, date: "" }));
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: any
  ) => {
    const updatedLineItems = [...formData.line_items];
    updatedLineItems[index] = {
      ...updatedLineItems[index],
      [field]: field === "product_id" ? value : Number(value),
    };

    // If product_id changed, update product_name
    if (field === "product_id") {
      const selectedProduct = allProducts.find((p) => p._id === value);
      if (selectedProduct) {
        updatedLineItems[index].product_name = selectedProduct.name;
      }
    }

    setFormData((prev) => ({ ...prev, line_items: updatedLineItems }));

    // Clear error for this line item field
    setErrors((prev) => ({
      ...prev,
      [`line_items.${index}.${field}`]: "",
    }));
  };

  const addLineItem = () => {
    setFormData((prev) => ({
      ...prev,
      line_items: [
        ...prev.line_items,
        { ...initialLineItem, id: `item-${Date.now()}` },
      ],
    }));
  };

  const removeLineItem = (index: number) => {
    if (formData.line_items.length > 1) {
      const updatedLineItems = [...formData.line_items];
      updatedLineItems.splice(index, 1);
      setFormData((prev) => ({ ...prev, line_items: updatedLineItems }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    // Validate main fields
    if (!formData.vendor_id) newErrors["vendor_id"] = "Vendor is required";
    if (!formData.bill_number)
      newErrors["bill_number"] = "Bill number is required";
    if (!formData.packages_count || formData.packages_count <= 0)
      newErrors["packages_count"] = "Valid packages count is required";
    if (!formData.shipping_company)
      newErrors["shipping_company"] = "Shipping company is required";
    if (!formData.tracking_number)
      newErrors["tracking_number"] = "Tracking number is required";

    // Validate line items
    formData.line_items.forEach((item, index) => {
      if (!item.product_id) {
        newErrors[`line_items.${index}.product_id`] = "Product is required";
      }

      if (!item.received_qty || item.received_qty <= 0) {
        newErrors[`line_items.${index}.received_qty`] =
          "Valid received quantity is required";
      }

      if (item.rejected_qty < 0) {
        newErrors[`line_items.${index}.rejected_qty`] =
          "Rejected quantity cannot be negative";
      }

      if (item.rejected_qty > item.received_qty) {
        newErrors[`line_items.${index}.rejected_qty`] =
          "Rejected quantity cannot exceed received quantity";
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (status: "pending" | "completed") => {
    if (!validateForm()) {
      setShowErrorBanner(true);
      return;
    }

    try {
      // Format date to YYYY-MM-DD
      const formattedDate = formData.date.toISOString().split("T")[0];

      // Prepare payload
      const payload = {
        ...formData,
        status,
        date: formattedDate,
        line_items: formData.line_items.map((item) => ({
          product_id: item.product_id,
          received_qty: item.received_qty,
          rejected_qty: item.rejected_qty,
        })),
      };

      await createPurchaseReceive(payload);
      router.push("/printrove/purchase/receivables");
    } catch (error) {
      console.error("Error saving purchase receive:", error);
      setShowErrorBanner(true);
    }
  };

  // Add a "Select" option at the beginning of product options
  const productOptions = [
    { label: "Select Product", value: "" },
    ...allProducts.map((product) => ({
      label: `${product.name} (${product.sku || "No SKU"})`,
      value: product._id,
    })),
  ];

  const vendorName =
    vendors.find((v) => v.id === formData.vendor_id)?.vendorName ||
    "Selected Vendor";

  const isLoading = isLoadingProducts || isLoadingVendors || isCreating;

  return (
    <div className="h-full p-4 md:p-8 bg-[#F5F5F5] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Text as="h1" variant="headingLg">
          Create Purchase Receive - {vendorName}
        </Text>
      </div>

      {showErrorBanner && (
        <Banner
          title="There were some issues with your form submission"
          tone="critical"
          onDismiss={() => setShowErrorBanner(false)}
        >
          <p>Please check the form for errors and try again.</p>
        </Banner>
      )}

      {/* Basic Info Card - Read-only display */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <Text as="h2" variant="headingMd">
              Receive Information
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <TextField
                label="Bill Number"
                value={formData.bill_number}
                onChange={(value) => handleInputChange("bill_number", value)}
                error={errors["bill_number"]}
                autoComplete="off"
                disabled={isLoading || Boolean(billNumber)}
              />
            </div>

            <div>
              <TextField
                label="Date"
                type="date"
                value={formData.date.toISOString().split("T")[0]}
                onChange={(value) => handleDateChange(new Date(value))}
                error={errors["date"]}
                disabled={isLoading}
                autoComplete="off"
              />
            </div>

            <div>
              <TextField
                label="Packages Count"
                type="number"
                value={formData.packages_count.toString()}
                onChange={(value) =>
                  handleInputChange("packages_count", parseInt(value) || 0)
                }
                error={errors["packages_count"]}
                autoComplete="off"
                disabled={isLoading || Boolean(packagesCount)}
              />
            </div>

            <div>
              <TextField
                label="Shipping Company"
                value={formData.shipping_company}
                onChange={(value) =>
                  handleInputChange("shipping_company", value)
                }
                error={errors["shipping_company"]}
                autoComplete="off"
                disabled={isLoading || Boolean(shippingCompany)}
              />
            </div>

            <div>
              <TextField
                label="Tracking Number"
                value={formData.tracking_number}
                onChange={(value) =>
                  handleInputChange("tracking_number", value)
                }
                error={errors["tracking_number"]}
                autoComplete="off"
                disabled={isLoading || Boolean(trackingNumber)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items Card */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <Text as="h2" variant="headingMd">
              Line Items
            </Text>
          </div>

          <div className="space-y-6">
            {formData.line_items.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 pb-4 border-b"
              >
                <div>
                  <Select
                    label="Product"
                    options={productOptions}
                    value={item.product_id}
                    onChange={(value) =>
                      handleLineItemChange(index, "product_id", value)
                    }
                    error={errors[`line_items.${index}.product_id`]}
                    disabled={isLoading || isLoadingProducts}
                    requiredIndicator
                  />
                </div>

                <div>
                  <TextField
                    label="Received Qty"
                    type="number"
                    value={item.received_qty.toString()}
                    onChange={(value) =>
                      handleLineItemChange(index, "received_qty", value)
                    }
                    error={errors[`line_items.${index}.received_qty`]}
                    autoComplete="off"
                    disabled={isLoading}
                    requiredIndicator
                  />
                </div>

                <div>
                  <TextField
                    label="Rejected Qty"
                    type="number"
                    value={item.rejected_qty.toString()}
                    onChange={(value) =>
                      handleLineItemChange(index, "rejected_qty", value)
                    }
                    error={errors[`line_items.${index}.rejected_qty`]}
                    autoComplete="off"
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-end">
                  {formData.line_items.length > 1 && (
                    <Button
                      variant="plain"
                      tone="critical"
                      onClick={() => removeLineItem(index)}
                      disabled={isLoading}
                    >
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}

            {/* Add Line Item button moved to bottom */}
            <div className="mt-4">
              <Button onClick={addLineItem} disabled={isLoading}>
                Add Line Item
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="plain"
          onClick={() => router.push("/printrove/purchase/receivables")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleSubmit("pending")}
          loading={isLoading && formData.status === "pending"}
          disabled={isLoading}
        >
          Save
        </Button>
        <Button
          variant="primary"
          onClick={() => handleSubmit("completed")}
          loading={isLoading && formData.status === "completed"}
          disabled={isLoading}
        >
          Mark as Complete
        </Button>
      </div>
    </div>
  );
}

export default function PurchaseReceiveDetails() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PurchaseReceiveContent />
    </Suspense>
  );
}
