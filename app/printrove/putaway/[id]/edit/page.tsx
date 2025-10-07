"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Text,
  Button,
  Select,
  TextField,
  Banner,
  Layout,
  BlockStack,
  InlineStack,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { IconButton } from "@/app/components/iconButton";
import { useRouter } from "next/navigation";
import usePutAwayStore from "@/store/usePutAwayStore";
import { useProductStore } from "@/store/useProductStore";
import { useBinStore } from "@/store/useBinStore"; // Import the useBinStore

export default function PutAwayEdit({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [showErrorBanner, setShowErrorBanner] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Get state and actions from stores
  const {
    formData,
    isSaving,
    setFormField,
    addLineItem,
    updateLineItem,
    removeLineItem,
    savePutAwayWithLineItems,
  } = usePutAwayStore();

  const {
    allProducts,
    isLoadingAll: isLoadingProducts,
    fetchAllProducts,
  } = useProductStore();

  // Use the useBinStore instead of bins from usePutAwayStore
  const { allBins, isLoadingAll: isLoadingBins, fetchAllBins } = useBinStore();

  // Initial load of products and bins
  useEffect(() => {
    fetchAllProducts();
    fetchAllBins(); // Use the fetchAllBins function from useBinStore
  }, [fetchAllProducts, fetchAllBins]);

  // Add first line item if none exist
  useEffect(() => {
    if (formData.lineItems.length === 0) {
      addLineItem();
    }
  }, [formData.lineItems.length, addLineItem]);

  // Product options for dropdown - similar to Purchase Order
  const productOptions = [
    { label: "Select Product", value: "" },
    ...allProducts.map((product) => ({
      label: `${product.name} (${product.sku || "No SKU"})`,
      value: product._id || product.item_id, // Handle both _id and item_id patterns
    })),
  ];

  // Bin options for dropdown - Use allBins from useBinStore
  const binOptions = [
    { label: "Select Bin", value: "" },
    ...allBins.map((bin) => ({
      label: bin.name,
      value: bin._id,
    })),
  ];

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate required fields
    if (!formData.referenceNumber) {
      newErrors["referenceNumber"] = "Reference number is required";
    }

    // Check if we have at least one valid line item
    const hasValidItems = formData.lineItems.some(
      (item) => item.productId && item.binNumber && item.qty > 0
    );

    if (!hasValidItems) {
      newErrors["lineItems"] = "At least one valid item is required";
    }

    // Validate line items individually
    formData.lineItems.forEach((item, index) => {
      if (item.productId) {
        // Only validate items that have a product selected
        if (!item.binNumber) {
          newErrors[`lineItems.${index}.binNumber`] = "Bin is required";
        }

        if (!item.qty || item.qty <= 0) {
          newErrors[`lineItems.${index}.qty`] = "Quantity must be positive";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      setShowErrorBanner(true);
      return;
    }

    try {
      // Filter out any incomplete line items before saving
      const validLineItems = formData.lineItems.filter(
        (item) => item.productId && item.binNumber && item.qty > 0
      );

      // Update the form data with only valid line items
      setFormField("lineItems", validLineItems);

      await savePutAwayWithLineItems();
      router.push("/printrove/putaway");
    } catch (error) {
      console.error("Error saving put away:", error);
      setShowErrorBanner(true);
    }
  };

  // Function to handle duplicate product check - like in Purchase Order
  const handleProductChange = (index: number, productId: string) => {
    if (productId) {
      const isDuplicate = formData.lineItems.some(
        (item, idx) => idx !== index && item.productId === productId
      );

      if (isDuplicate) {
        setErrors((prev) => ({
          ...prev,
          [`lineItems.${index}.productId`]:
            "This product is already selected in another line",
        }));
        return;
      } else {
        // Clear error if exists
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`lineItems.${index}.productId`];
          return updated;
        });
      }
    }

    updateLineItem(index, "productId", productId);
  };

  // Update isLoading to include bin loading state
  const isLoading = isLoadingProducts || isLoadingBins || isSaving;

  // Determine if we should show the "Add Item" button at the bottom
  const showAddItemButton =
    formData.lineItems.length === 0 ||
    formData.lineItems.some((item) => item.productId && item.binNumber);

  return (
    <div className="h-full p-4 md:p-8 bg-[#F5F5F5] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Text as="h1" variant="headingLg">
          Create Put Away - {formData.referenceNumber || "New Put Away"}
        </Text>
      </div>

      {showErrorBanner && (
        <Banner
          title="There were some issues with your form submission"
          tone="critical"
          onDismiss={() => setShowErrorBanner(false)}
        >
          <p>Please check the form for errors and try again.</p>
          {errors["lineItems"] && (
            <p className="mt-1 text-red-600">{errors["lineItems"]}</p>
          )}
        </Banner>
      )}

      {/* Basic Info Card */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <Text as="h2" variant="headingMd">
              Put Away Information
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <TextField
                label="Reference Number"
                value={formData.referenceNumber}
                onChange={(value) => setFormField("referenceNumber", value)}
                error={errors["referenceNumber"]}
                autoComplete="off"
                disabled={isLoading}
                requiredIndicator
              />
            </div>

            <div>
              <Select
                label="Put Away Type"
                options={[
                  { label: "Incoming", value: "INCOMING" },
                  { label: "Production", value: "PRODUCTION" },
                ]}
                value={formData.putawayType}
                onChange={(value) =>
                  setFormField(
                    "putawayType",
                    value as "INCOMING" | "PRODUCTION"
                  )
                }
                disabled={isLoading}
                requiredIndicator
              />
            </div>

            <div>
              <TextField
                label="Total Quantity"
                type="number"
                value={formData.totalQty.toString()}
                onChange={(value) =>
                  setFormField("totalQty", parseInt(value) || 0)
                }
                autoComplete="off"
                disabled={true} // Auto-calculated from line items
                helpText="Auto-calculated from line items"
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

          <div className="space-y-4">
            {/* Header row */}
            <div className="grid grid-cols-10 gap-4 mb-2 font-medium bg-[#F5F5F5] p-4 rounded">
              <div className="col-span-4">Product</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-3">Bin Location</div>
              <div className="col-span-1">Action</div>
            </div>

            {/* Line items */}
            {formData.lineItems.map((item, index) => (
              <div key={index} className="grid grid-cols-10 gap-4">
                <div className="col-span-4">
                  <Select
                    label=""
                    options={productOptions}
                    value={item.productId}
                    onChange={(value) => handleProductChange(index, value)}
                    error={errors[`lineItems.${index}.productId`]}
                    disabled={isLoading}
                  />
                </div>

                <div className="col-span-2">
                  <TextField
                    label=""
                    type="number"
                    value={item.qty.toString()}
                    onChange={(value) =>
                      updateLineItem(index, "qty", parseInt(value) || 0)
                    }
                    error={errors[`lineItems.${index}.qty`]}
                    autoComplete="off"
                    disabled={isLoading}
                  />
                </div>

                <div className="col-span-3">
                  <Select
                    label=""
                    options={binOptions}
                    value={item.binNumber}
                    onChange={(value) =>
                      updateLineItem(index, "binNumber", value)
                    }
                    error={errors[`lineItems.${index}.binNumber`]}
                    disabled={isLoading}
                  />
                </div>

                <div className="col-span-1 flex items-center">
                  {formData.lineItems.length > 1 && (
                    <IconButton
                      icon={DeleteIcon}
                      onClick={() => removeLineItem(index)}
                      ariaLabel="Delete item"
                    />
                  )}
                </div>
              </div>
            ))}

            {/* Add Item Button */}
            <div className="mt-6">
              <Button
                variant="primary"
                tone="success"
                onClick={addLineItem}
                disabled={isLoading}
              >
                Add New Item
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button
          variant="plain"
          onClick={() => router.push("/printrove/putaway")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          loading={isSaving}
          disabled={isLoading}
        >
          Save Put Away
        </Button>
      </div>
    </div>
  );
}
