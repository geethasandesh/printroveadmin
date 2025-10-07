"use client";

import React, { useState, useEffect } from "react";
import { Card, Select, TextField, Text } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { Button } from "@/app/components/Button";
import { IconButton } from "@/app/components/iconButton";
import { CustomDatePicker } from "@/app/components/DatePicker";
import { useVendorStore } from "@/store/useVendorStore";
import { useProductStore } from "@/store/useProductStore";
import { useRouter } from "next/navigation";
import { usePurchaseOrderStore } from "@/store/usePurchaseOrderStore";

interface LineItem {
  id: string;
  productId: string;
  quantity: string;
  rate: string;
  amount: string;
}

interface PurchaseOrder {
  vendorId: string;
  vendorName?: string;
  reference: string;
  date: Date;
  expectedDeliveryDate: Date;
  address: string;
  items: LineItem[];
}

const initialPurchaseOrder: PurchaseOrder = {
  vendorId: "",
  vendorName: "",
  reference: "",
  date: new Date(),
  expectedDeliveryDate: new Date(),
  address: "",
  items: [
    {
      id: "1",
      productId: "",
      quantity: "",
      rate: "",
      amount: "0",
    },
  ],
};

export default function CreatePurchaseOrder() {
  const [po, setPo] = useState<PurchaseOrder>(initialPurchaseOrder);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { allVendors, isLoadingAll, fetchAllVendors } = useVendorStore();
  const {
    allProducts,
    isLoadingAll: isLoadingProducts,
    fetchAllProducts,
  } = useProductStore();
  const router = useRouter();
  const { createPurchaseOrder, isCreating } = usePurchaseOrderStore();
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchAllVendors();
    fetchAllProducts();
  }, [fetchAllVendors, fetchAllProducts]);

  // Transform vendors data for Select component with proper display names
  const vendorOptions = [
    ...allVendors.map((vendor) => ({
      label: `${vendor.vendorName}${
        vendor.companyName ? ` - ${vendor.companyName}` : ""
      }`,
      value: vendor.vendorId,
    })),
  ];

  // Transform products data for Select component
  const productOptions = [
    { label: "Select Product", value: "" },
    ...allProducts.map((product) => ({
      label: `${product.name} (${product.sku})`,
      value: product.item_id,
    })),
  ];

  // Get selected vendor's display name
  const getSelectedVendorName = (vendorId: string) => {
    const vendor = allVendors.find((v) => v.id === vendorId);
    return vendor
      ? `${vendor.vendorName}${
          vendor.companyName ? ` - ${vendor.companyName}` : ""
        }`
      : "";
  };

  const calculateAmount = (quantity: string, rate: string): string => {
    const qty = parseFloat(quantity) || 0;
    const rt = parseFloat(rate) || 0;
    return (qty * rt).toFixed(2);
  };

  const handleLineItemChange = (
    index: number,
    field: keyof LineItem,
    value: string
  ) => {
    const updatedItems = [...po.items];

    // Check for duplicate product if the field is productId
    if (field === "productId" && value) {
      const isDuplicate = po.items.some(
        (item, idx) => idx !== index && item.productId === value
      );

      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          [`product-${index}`]:
            "This product is already selected in another line",
        }));
        return;
      } else {
        // Clear error if exists
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`product-${index}`];
          return updated;
        });
      }
    }

    updatedItems[index] = { ...updatedItems[index], [field]: value };

    // If product is selected, set the rate
    if (field === "productId") {
      const selectedProduct = allProducts.find((p) => p.item_id === value);
      if (selectedProduct) {
        updatedItems[index].rate = selectedProduct.rate.toString();
        // Recalculate amount if quantity exists
        if (updatedItems[index].quantity) {
          updatedItems[index].amount = calculateAmount(
            updatedItems[index].quantity,
            selectedProduct.rate.toString()
          );
        }
      }
    }

    // Auto calculate amount
    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount = calculateAmount(
        field === "quantity" ? value : updatedItems[index].quantity,
        field === "rate" ? value : updatedItems[index].rate
      );
    }

    // Add new row if last row has a product selected
    if (
      index === updatedItems.length - 1 &&
      updatedItems[index].productId !== ""
    ) {
      updatedItems.push({
        id: (updatedItems.length + 1).toString(),
        productId: "",
        quantity: "",
        rate: "",
        amount: "0",
      });
    }

    setPo((prev) => ({ ...prev, items: updatedItems }));
  };

  const deleteLineItem = (index: number) => {
    if (po.items.length > 1) {
      setPo((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!po.vendorId) {
      errors.vendorId = "Vendor is required";
    }

    const hasValidItems = po.items.some(
      (item) => item.productId && item.quantity && parseFloat(item.quantity) > 0
    );

    if (!hasValidItems) {
      errors.items = "At least one item with valid quantity is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (isOpen: boolean = false) => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Filter out empty items and format data
      const formattedData = {
        ...po,
        items: po.items.filter((item) => item.productId && item.quantity),
        date: po.date.toISOString(),
        expectedDeliveryDate: po.expectedDeliveryDate.toISOString(),
        status: isOpen ? "open" : "draft", // Set the status based on isOpen parameter
      };

      await createPurchaseOrder(formattedData);

      // Show success toast/message if needed
      router.push("/printrove/purchase/po");
    } catch (error) {
      setFormErrors({
        submit: "Failed to create purchase order. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-3">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          Purchase Orders
        </Text>
      </div>

      <div className="space-y-6">
        {/* PO Information Card */}
        <Card>
          <div className="p-6">
            <div className="mb-4">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                PO Information
              </Text>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Select
                    label="Vendor Name"
                    options={vendorOptions}
                    value={po.vendorId}
                    onChange={(value) =>
                      setPo((prev) => ({
                        ...prev,
                        vendorId: value,
                        vendorName: value ? getSelectedVendorName(value) : "",
                      }))
                    }
                    error={formErrors.vendorId}
                    disabled={isLoadingAll}
                    placeholder="Select a vendor"
                  />
                </div>
                <div className="col-span-1">
                  <TextField
                    label="Reference"
                    value={po.reference}
                    onChange={(value) =>
                      setPo((prev) => ({ ...prev, reference: value }))
                    }
                    autoComplete="off"
                  />
                </div>
                <CustomDatePicker
                  label="Date"
                  selected={po.date}
                  onChange={(date) => setPo((prev) => ({ ...prev, date }))}
                />
                <CustomDatePicker
                  label="Expected Delivery Date"
                  selected={po.expectedDeliveryDate}
                  onChange={(date) =>
                    setPo((prev) => ({ ...prev, expectedDeliveryDate: date }))
                  }
                />
                <div className="col-span-1">
                  <TextField
                    label="Delivery Address"
                    value={po.address}
                    onChange={(value) =>
                      setPo((prev) => ({ ...prev, address: value }))
                    }
                    multiline={4}
                    autoComplete="off"
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Items Card */}
        <Card>
          <div className="p-6">
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 mb-2 font-medium bg-[#F5F5F5] p-4 rounded">
                <div className="col-span-5">Product</div>
                <div className="col-span-2">Quantity</div>
                <div className="col-span-2">Rate</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-1">Action</div>
              </div>

              {po.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4">
                  <div className="col-span-5">
                    <Select
                      label=""
                      options={productOptions}
                      value={item.productId}
                      onChange={(value) =>
                        handleLineItemChange(index, "productId", value)
                      }
                      error={errors[`product-${index}`]}
                      disabled={isLoadingProducts}
                    />
                  </div>
                  <div className="col-span-2">
                    <TextField
                      label=""
                      type="number"
                      value={item.quantity}
                      onChange={(value) =>
                        handleLineItemChange(index, "quantity", value)
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-2">
                    <TextField
                      label=""
                      type="number"
                      value={item.rate}
                      onChange={(value) =>
                        handleLineItemChange(index, "rate", value)
                      }
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-2">
                    <TextField
                      label=""
                      value={item.amount}
                      disabled
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-1 flex items-center">
                    {po.items.length > 1 && (
                      <IconButton
                        icon={DeleteIcon}
                        onClick={() => deleteLineItem(index)}
                        ariaLabel="Delete item"
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
            {formErrors.items && (
              <div className="text-red-600 text-sm mt-2">
                {formErrors.items}
              </div>
            )}
          </div>
        </Card>

        {/* Action Buttons - replace the existing buttons with these */}
        <div className="flex justify-end space-x-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => router.push("/printrove/purchase/po")}
            disabled={isCreating || isSubmitting}
            className={
              isCreating || isSubmitting ? "opacity-50 pointer-events-none" : ""
            }
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => handleSubmit(false)}
            disabled={isCreating || isSubmitting}
            className={
              isCreating || isSubmitting ? "opacity-50 pointer-events-none" : ""
            }
          >
            Save as Draft
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => handleSubmit(true)}
            disabled={isCreating || isSubmitting}
            className={
              isCreating || isSubmitting ? "opacity-50 pointer-events-none" : ""
            }
          >
            {isSubmitting ? "Creating..." : "Save as Open"}
          </Button>
        </div>
        {formErrors.submit && (
          <div className="text-red-600 text-sm mt-2 text-center">
            {formErrors.submit}
          </div>
        )}
      </div>
    </div>
  );
}
