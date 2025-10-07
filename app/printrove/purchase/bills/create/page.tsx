"use client";
import React, { useState, useEffect, useRef } from "react";
import { Card, Select, TextField, Text } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { Button } from "@/app/components/Button";
import { IconButton } from "@/app/components/iconButton";
import { CustomDatePicker } from "@/app/components/DatePicker";
import { useVendorStore } from "@/store/useVendorStore";
import { useProductStore } from "@/store/useProductStore";
import { useBillStore } from "@/store/useBillStore";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

interface LineItem {
  id: string;
  productId: string;
  quantity: string;
  rate: string;
  amount: string;
  receivedQty?: string;
  rejectedQty?: string;
}

interface BillFormData {
  vendorId: string;
  reference: string;
  billNumber: string;
  billDate: Date;
  dueDate: Date;
  items: LineItem[];
}

const initialFormData: BillFormData = {
  vendorId: "",
  reference: "",
  billNumber: "",
  billDate: new Date(),
  dueDate: new Date(),
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

export default function CreateBills() {
  const [formData, setFormData] = useState<BillFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [purchaseReceive, setPurchaseReceive] = useState<any>(null);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const { allVendors, isLoadingAll, fetchAllVendors } = useVendorStore();
  const {
    allProducts,
    isLoadingAll: isLoadingProducts,
    fetchAllProducts,
  } = useProductStore();

  const { createBill, isCreating, fetchPurchaseReceivesByBillNumber } =
    useBillStore();

  const router = useRouter();

  useEffect(() => {
    fetchAllVendors();
    fetchAllProducts();
  }, [fetchAllVendors, fetchAllProducts]);

  const vendorOptions = [
    { label: "Select Vendor", value: "" },
    ...allVendors.map((vendor) => ({
      label: `${vendor.vendorName}${
        vendor.companyName ? ` - ${vendor.companyName}` : ""
      }`,
      value: vendor.id,
    })),
  ];

  const productOptions = [
    { label: "Select Product", value: "" },
    ...allProducts.map((product) => ({
      label: `${product.name} (${product.sku})`,
      value: product.item_id,
    })),
  ];

  // Handle vendor bill number change with debounce for focus preservation
  const handleBillNumberChange = (value: string) => {
    setFormData((prev) => ({ ...prev, billNumber: value }));

    // Debounce API calls instead of calling on every keystroke
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(async () => {
      if (value.trim().length > 0) {
        try {
          console.log("Fetching purchase receive data for bill number:", value);
          const response = await fetchPurchaseReceivesByBillNumber(
            value,
            formData.vendorId || undefined
          );
          console.log("API Response:", response);

          // Process the response and update the form
          processPurchaseReceiveResponse(response);
        } catch (error) {
          console.error("Error fetching purchase receive data:", error);
          toast.error("Failed to fetch purchase receive data");
        }
      }
    }, 500);
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
    const updatedItems = [...formData.items];

    if (field === "productId" && value) {
      const isDuplicate = formData.items.some(
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
        setErrors((prev) => {
          const updated = { ...prev };
          delete updated[`product-${index}`];
          return updated;
        });
      }
    }

    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === "productId") {
      const selectedProduct = allProducts.find((p) => p.item_id === value);
      if (selectedProduct) {
        updatedItems[index].rate = selectedProduct.rate.toString();
        if (updatedItems[index].quantity) {
          updatedItems[index].amount = calculateAmount(
            updatedItems[index].quantity,
            selectedProduct.rate.toString()
          );
        }
      }
    }

    if (field === "quantity" || field === "rate") {
      updatedItems[index].amount = calculateAmount(
        field === "quantity" ? value : updatedItems[index].quantity,
        field === "rate" ? value : updatedItems[index].rate
      );
    }

    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const validateForm = (): boolean => {
    const formErrors: { [key: string]: string } = {};

    if (!formData.vendorId) {
      formErrors.vendorId = "Vendor is required";
    }

    // Validate line items
    let hasInvalidQuantity = false;
    formData.items.forEach((item, index) => {
      // Skip empty lines
      if (!item.productId) return;

      const qty = parseFloat(item.quantity) || 0;

      // Check if quantity is provided
      if (qty <= 0) {
        formErrors[`qty-${index}`] = "Quantity must be greater than 0";
        hasInvalidQuantity = true;
      }

      // For items with received quantities, ensure entered quantity doesn't exceed
      if (item.receivedQty && qty > parseFloat(item.receivedQty)) {
        formErrors[
          `qty-${index}`
        ] = `Quantity cannot exceed received quantity (${item.receivedQty})`;
        hasInvalidQuantity = true;
      }
    });

    if (hasInvalidQuantity) {
      formErrors.items = "Please correct quantity errors";
    } else {
      const hasValidItems = formData.items.some(
        (item) =>
          item.productId && item.quantity && parseFloat(item.quantity) > 0
      );

      if (!hasValidItems) {
        formErrors.items = "At least one item with valid quantity is required";
      }
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSaveAsOpen = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Format data for API
      const poId = purchaseReceive?.po_id?.purchaseorder_id || null;
      console.log("Using PO ID:", poId);

      const vendorId =
        purchaseReceive?.vendor_id?.contact_id || formData.vendorId;
      console.log("Using vendor ID:", vendorId);

      const payload = {
        vendorId: vendorId,
        reference: formData.reference,
        billNumber: formData.billNumber,
        billDate: formData.billDate.toISOString(),
        dueDate: formData.dueDate.toISOString(),
        items: formData.items.filter((item) => item.productId && item.quantity),
        purchaseOrders: poId ? [poId] : [],
      };

      const response = await createBill(payload);
      toast.success("Bill created successfully!");
      router.push("/printrove/purchase/bills");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create bill"
      );
    }
  };

  const addNewRow = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: (prev.items.length + 1).toString(),
          productId: "",
          quantity: "",
          rate: "",
          amount: "0",
        },
      ],
    }));
  };

  const deleteLineItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  // Add this function to your component
  const processPurchaseReceiveResponse = (data: any) => {
    const purchaseReceive = data[0];
    setPurchaseReceive(purchaseReceive);
    if (
      purchaseReceive.po_id &&
      purchaseReceive.po_id.line_items &&
      purchaseReceive.po_id.line_items.length > 0 &&
      purchaseReceive.line_items &&
      purchaseReceive.line_items.length > 0
    ) {
      console.log(
        "Found PO with line items:",
        purchaseReceive.po_id.line_items
      );
      console.log("Found PR line items:", purchaseReceive.line_items);

      // Map line items properly
      const lineItems: any[] = [];

      // Process each line item from the purchase receive
      for (let i = 0; i < purchaseReceive.line_items.length; i++) {
        const prLineItem = purchaseReceive.line_items[i];

        // For each PR line item, find the matching PO line item (if available)
        // Since we don't have a direct ID match, we'll use the index if product_id is null
        // This assumes the line items are in the same order as the PO
        const poItemIndex =
          i < purchaseReceive.po_id.line_items.length ? i : null;
        const poItem =
          poItemIndex !== null
            ? purchaseReceive.po_id.line_items[poItemIndex]
            : null;

        // Create line item for the bill
        lineItems.push({
          id: (i + 1).toString(),
          productId: poItem?.item_id || "",
          quantity: prLineItem.received_qty.toString(),
          rate: poItem?.rate?.toString() || "0",
          amount: calculateAmount(
            prLineItem.received_qty.toString(),
            poItem?.rate?.toString() || "0"
          ),
          receivedQty: prLineItem.received_qty.toString(),
          rejectedQty: prLineItem.rejected_qty.toString(),
        });
      }

      console.log("Created bill line items:", lineItems);

      // Update form data with purchase receive info
      setFormData((prev) => ({
        ...prev,
        vendorId: purchaseReceive.vendor_id?._id || purchaseReceive.vendor_id,
        billNumber: purchaseReceive.bill_number,
        items: lineItems,
        billDate: new Date(purchaseReceive.date),
        dueDate: new Date(
          new Date(purchaseReceive.date).getTime() + 30 * 24 * 60 * 60 * 1000
        ), // Default to 30 days from bill date
      }));

      toast.success(
        `Loaded ${lineItems.length} items from Purchase Receive ${purchaseReceive.purchase_receive_id}`
      );
    } else {
      console.log("Missing required data in purchase receive response:");
      console.log("PO exists:", !!purchaseReceive.po_id);
      console.log(
        "PO line items:",
        purchaseReceive.po_id?.line_items?.length || 0
      );
      console.log("PR line items:", purchaseReceive.line_items?.length || 0);
      toast.error(
        "Could not load items from purchase receive. Missing required data."
      );
    }
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          New Purchase Bill
        </Text>
      </div>

      <div className="space-y-6">
        <Card>
          <div className="p-6">
            <div className="mb-4">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Bill Information
              </Text>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Vendor Name *"
                options={vendorOptions}
                value={formData.vendorId}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, vendorId: value }))
                }
                error={errors.vendorId}
                disabled={isLoadingAll}
              />

              <TextField
                label="Vendor Bill"
                value={formData.billNumber}
                onChange={handleBillNumberChange}
                autoComplete="off"
              />

              <TextField
                label="Reference"
                value={formData.reference}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, reference: value }))
                }
                autoComplete="off"
              />

              <div className="col-span-2 grid grid-cols-2 gap-4">
                <CustomDatePicker
                  label="Bill Date"
                  selected={formData.billDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, billDate: date }))
                  }
                />

                <CustomDatePicker
                  label="Due Date"
                  selected={formData.dueDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, dueDate: date }))
                  }
                />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="mb-4">
              <Text as="h3" variant="headingMd" fontWeight="bold">
                Items
              </Text>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4 mb-2 font-medium bg-[#F5F5F5] p-4 rounded">
                <div className="col-span-3">Product</div>
                <div className="col-span-2">Received Qty</div>
                <div className="col-span-2">Rejected Qty</div>
                <div className="col-span-1">Quantity</div>
                <div className="col-span-1">Rate</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-1">Action</div>
              </div>

              {formData.items.map((item, index) => (
                <div key={item.id} className="grid grid-cols-12 gap-4">
                  <div className="col-span-3">
                    <Select
                      label=""
                      options={productOptions}
                      value={item.productId}
                      onChange={(value) =>
                        handleLineItemChange(index, "productId", value)
                      }
                      error={errors[`product-${index}`]}
                      disabled={isLoadingProducts || !!item.receivedQty}
                    />
                  </div>
                  <div className="col-span-2">
                    <TextField
                      label=""
                      type="number"
                      value={item.receivedQty || ""}
                      disabled
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-2">
                    <TextField
                      label=""
                      type="number"
                      value={item.rejectedQty || ""}
                      disabled
                      autoComplete="off"
                    />
                  </div>
                  <div className="col-span-1">
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
                  <div className="col-span-1">
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
                    {formData.items.length > 1 && (
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
            {errors.items && (
              <div className="text-red-600 text-sm mt-2">{errors.items}</div>
            )}
            <div className="mt-4">
              <Button variant="secondary" onClick={addNewRow}>
                Add More Rows
              </Button>
            </div>
          </div>
        </Card>

        <div className="mt-4 flex justify-end gap-4">
          <Button
            variant="secondary"
            onClick={() => router.push("/printrove/purchase/bills")}
          >
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveAsOpen}>
            {isCreating ? "Creating..." : "Save as Open"}
          </Button>
        </div>
      </div>
    </div>
  );
}
