"use client";

import React, { useState, useEffect } from "react";
import { Card, Text, Select, TextField, Button, Badge, Banner, Modal } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { CustomDatePicker } from "@/app/components/DatePicker";
import { useProductStore } from "@/store/useProductStore";
import { useVendorStore } from "@/store/useVendorStore";
import { usePurchaseReceiveStore } from "@/store/usePurchaseReceiveStore";
import { useVendorCreditStore } from "@/store/useVendorCreditStore";
import { useRouter } from "next/navigation";

interface LineItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface VendorCredit {
  vendorId: string;
  date: Date;
  creditNoteNumber: string;
  purchaseBillReference: string;
  purchaseReceiveId: string;
  lineItems: LineItem[];
}

export default function CreateVendorCredit() {
  const router = useRouter();
  const [vendorCredit, setVendorCredit] = useState<VendorCredit>({
    vendorId: "",
    date: new Date(),
    creditNoteNumber: "",
    purchaseBillReference: "",
    purchaseReceiveId: "",
    lineItems: [
      {
        id: "1",
        productId: "",
        productName: "",
        sku: "",
        quantity: 1,
        rate: 0,
        amount: 0,
      },
    ],
  });

  const [validationErrors, setValidationErrors] = useState<{
    vendorId?: string;
    purchaseReceiveId?: string;
    lineItems?: string;
  }>({});

  const { variants, isLoading, fetchVariants } = useProductStore();
  const { allVendors, isLoadingAll: isLoadingVendors, fetchAllVendors } = useVendorStore();
  const { purchaseReceives, isLoading: isLoadingReceives, fetchPurchaseReceives, error: purchaseReceiveError } = usePurchaseReceiveStore();
  const { createVendorCredit, createDraft, completeDraft, updateStatus, isCreating, error: createError } = useVendorCreditStore();

  const [draftId, setDraftId] = useState<string | null>(null);
  const [isDraft, setIsDraft] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const getDraftIdString = () => {
    if (!draftId) return '';
    if (typeof draftId === 'string') return draftId;
    if (typeof draftId === 'object' && draftId !== null) {
      return (draftId as any).vendor_credit_id || (draftId as any)._id || 'Unknown ID';
    }
    return String(draftId);
  };

  useEffect(() => {
    generateCreditNoteNumber();
  }, []);

  useEffect(() => {
    fetchVariants(1, 100); 
    fetchAllVendors();
    fetchPurchaseReceives(1, 100); 
  }, [fetchVariants, fetchAllVendors, fetchPurchaseReceives]);

  const generateCreditNoteNumber = () => {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const creditNumber = `CN-${timestamp}-${random}`;
    setVendorCredit(prev => ({ ...prev, creditNoteNumber: creditNumber }));
  };

  const vendors = [
    { label: "Search Vendor", value: "" },
    // // Dummy vendors for testing
    // { label: "Test Vendor 1", value: "test-vendor-001" },
    // { label: "Test Vendor 2", value: "test-vendor-002" },
    ...allVendors.map(vendor => ({
      label: `${vendor.vendorName || vendor.companyName || 'Unnamed Vendor'}`,
      value: vendor.vendorId || vendor.id // Use contact_id as primary, fallback to id
    }))
  ];

  const purchaseReceiveOptions = [
    { label: "Select Purchase Receive", value: "" },
    // // Dummy data for testing
    // { label: "PR-TEST-001 - Test Vendor (PO-12345)", value: "test-pr-001" },
    // { label: "PR-TEST-002 - Another Vendor (PO-67890)", value: "test-pr-002" },
    ...purchaseReceives.map(receive => ({
      label: `${receive.bill_number} - ${receive.vendor_name} (${receive.po_id || 'No PO'})`,
      value: receive.id
    }))
  ];

  const products = [
    { label: "Type or Select an item", value: "", sku: "", imageUrl: "" },
    // // Dummy products for testing
    // { label: "Test Product 1 - SKU: TEST-001", value: "test-prod-001", sku: "TEST-001", imageUrl: "" },
    // { label: "Test Product 2 - SKU: TEST-002", value: "test-prod-002", sku: "TEST-002", imageUrl: "" },
    // { label: "Test Product 3 - SKU: TEST-003", value: "test-prod-003", sku: "TEST-003", imageUrl: "" },
    ...variants.map(variant => ({
      label: `${variant.title} - SKU: ${variant.sku}`,
      value: variant.productId,
      sku: variant.sku,
      imageUrl: variant.thumbnailUrl || ""
    }))
  ];

  const productLookup = [
    { value: "", sku: "", imageUrl: "" },
    // // Dummy products for testing
    // { value: "test-prod-001", sku: "TEST-001", imageUrl: "" },
    // { value: "test-prod-002", sku: "TEST-002", imageUrl: "" },
    // { value: "test-prod-003", sku: "TEST-003", imageUrl: "" },
    ...variants.map(variant => ({
      value: variant.productId,
      sku: variant.sku,
      imageUrl: variant.thumbnailUrl || ""
    }))
  ];

  // Clean products array for Select component (only label and value)
  const productOptions = products.map(product => ({
    label: product.label,
    value: product.value
  }));

  const addNewRow = () => {
    const newRow: LineItem = {
      id: Date.now().toString(),
      productId: "",
      productName: "",
      sku: "",
      quantity: 1,
      rate: 0,
      amount: 0,
    };
    setVendorCredit(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, newRow]
    }));
  };

  const removeRow = (index: number) => {
    if (vendorCredit.lineItems.length > 1) {
      const newLineItems = vendorCredit.lineItems.filter((_, i) => i !== index);
      setVendorCredit(prev => ({
        ...prev,
        lineItems: newLineItems
      }));
    }
  };

  const updateLineItem = (index: number, field: keyof LineItem, value: any) => {
    const newLineItems = [...vendorCredit.lineItems];
    newLineItems[index] = { ...newLineItems[index], [field]: value };
    
    if (field === 'quantity' || field === 'rate') {
      newLineItems[index].amount = newLineItems[index].quantity * newLineItems[index].rate;
    }
    
    if (field === 'productId') {
      const selectedProduct = productLookup.find(p => p.value === value);
      if (selectedProduct) {
        if (value.startsWith('test-')) {
          newLineItems[index].productName = selectedProduct.sku; 
        } else {
          const variant = variants.find(v => v.productId === value);
          newLineItems[index].productName = variant?.title || '';
        }
        newLineItems[index].sku = selectedProduct.sku;
      }
    }
    
    setVendorCredit(prev => ({
      ...prev,
      lineItems: newLineItems
    }));
  };

  const validateForm = () => {
    const errors: typeof validationErrors = {};

    if (!vendorCredit.vendorId) {
      errors.vendorId = 'Please select a vendor';
    }

    if (!vendorCredit.purchaseReceiveId) {
      errors.purchaseReceiveId = 'Please select a purchase receive';
    }

    const hasEmptyProducts = vendorCredit.lineItems.some(item => !item.productId);
    const hasInvalidQuantities = vendorCredit.lineItems.some(item => item.quantity <= 0);
    const hasInvalidRates = vendorCredit.lineItems.some(item => item.rate < 0);

    if (hasEmptyProducts) {
      errors.lineItems = 'Please select products for all line items';
    } else if (hasInvalidQuantities) {
      errors.lineItems = 'All quantities must be greater than 0';
    } else if (hasInvalidRates) {
      errors.lineItems = 'All rates must be non-negative';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (status: 'draft' | 'open') => {
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    try {
      if (status === 'draft') {
        const draftData = {
          vendor_id: vendorCredit.vendorId,
          date: vendorCredit.date.toISOString().split('T')[0],
          reference_number: vendorCredit.creditNoteNumber,
          purchase_bill_reference: vendorCredit.purchaseBillReference,
          line_items: vendorCredit.lineItems
            .filter(item => item.productId) 
            .map(item => ({
              item_id: item.productId,
              quantity: item.quantity,
              rate: item.rate
            }))
        };

        const result = await createDraft(draftData);
        
        if (result.success && result.data) {
          setDraftId(result.data);
          setIsDraft(true);
          setSuccessMessage('Draft saved successfully!');
        } else {
          setErrorMessage(`Failed to save draft: ${result.error}`);
        }
      } else {
        if (isDraft && draftId) {
          const completeData = {
            reference_number: vendorCredit.creditNoteNumber,
            date: vendorCredit.date.toISOString().split('T')[0],
            purchase_bill_reference: vendorCredit.purchaseBillReference,
            line_items: vendorCredit.lineItems.map(item => ({
              item_id: item.productId,
              quantity: item.quantity,
              rate: item.rate
            }))
          };

          const success = await completeDraft(draftId, completeData);
          
          if (success) {
            const statusSuccess = await updateStatus(draftId, 'active');
            if (statusSuccess) {
              setSuccessMessage('Vendor credit completed and activated successfully!');
              setTimeout(() => router.push('/printrove/purchase/credits'), 800);
            } else {
              setErrorMessage('Draft completed but failed to activate');
            }
          } else {
            setErrorMessage('Failed to complete draft');
          }
        } else {
          const payload = {
            vendor_id: vendorCredit.vendorId,
            date: vendorCredit.date.toISOString().split('T')[0],
            reference_number: vendorCredit.creditNoteNumber,
            purchase_bill_reference: vendorCredit.purchaseBillReference,
            line_items: vendorCredit.lineItems.map(item => ({
              item_id: item.productId,
              quantity: item.quantity,
              rate: item.rate
            }))
          };

          const success = await createVendorCredit(payload);
          
          if (success) {
            setSuccessMessage('Vendor credit created successfully!');
            setTimeout(() => router.push('/printrove/purchase/credits'), 800);
          } else {
            setErrorMessage('Failed to create vendor credit');
          }
        }
      }
    } catch (error) {
      console.error('Error handling vendor credit:', error);
      setErrorMessage('An error occurred while processing the vendor credit');
    }
  };

  const handleSaveDraft = async () => {
    if (!vendorCredit.vendorId) {
      setErrorMessage('Please select a vendor to save draft');
      return;
    }

    try {
      const draftData = {
        vendor_id: vendorCredit.vendorId,
        date: vendorCredit.date.toISOString().split('T')[0],
        reference_number: vendorCredit.creditNoteNumber,
        purchase_bill_reference: vendorCredit.purchaseBillReference,
        line_items: vendorCredit.lineItems
          .filter(item => item.productId)
          .map(item => ({
            item_id: item.productId,
            quantity: item.quantity,
            rate: item.rate
          }))
      };

      console.log('Save Draft Payload:', draftData);
      
      if (isDraft && draftId) {
        const success = await completeDraft(draftId, draftData);
        if (success) {
          setSuccessMessage('Draft updated successfully!');
          setTimeout(() => router.push('/printrove/purchase/credits'), 800);
        } else {
          setErrorMessage('Failed to update draft');
        }
      } else {
        // Create new draft
        const result = await createDraft(draftData);
        
        if (result.success && result.data) {
          const id = typeof result.data === 'string' ? result.data : 
                     (result.data as any)?.vendor_credit_id || 
                     (result.data as any)?._id || 
                     'unknown';
          
          setDraftId(id);
          setIsDraft(true);
          setSuccessMessage('Draft saved successfully!');
          setTimeout(() => router.push('/printrove/purchase/credits'), 800);
        } else {
          setErrorMessage(`Failed to save draft: ${result.error}`);
        }
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      setErrorMessage('An error occurred while saving the draft');
    }
  };

  const clearDraft = () => {
    setDraftId(null);
    setIsDraft(false);
    
    setVendorCredit({
      vendorId: "",
      date: new Date(),
      creditNoteNumber: "",
      purchaseBillReference: "",
      purchaseReceiveId: "",
      lineItems: [
        {
          id: "1",
          productId: "",
          productName: "",
          sku: "",
          quantity: 1,
          rate: 0,
          amount: 0,
        },
      ],
    });
    generateCreditNoteNumber();
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5] space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Text as="h1" variant="headingLg">
          New Vendor Credit
        </Text>
      </div>

      {/* Vendor Credit Information Card */}
      <Card>
        <div className="p-6">
          <div className="mb-4">
            <Text as="h2" variant="headingMd">
              Vendor Credit Information
            </Text>
          </div>

          <div className="space-y-4">
            {/* First Row - Vendor and Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Select
                  label="Vendor Name"
                  options={vendors}
                  value={vendorCredit.vendorId}
                  onChange={(value) =>
                    setVendorCredit((prev) => ({ ...prev, vendorId: value }))
                  }
                  disabled={isLoadingVendors}
                />
                {isLoadingVendors && (
                  <Text as="span" variant="bodySm" tone="subdued">
                    Loading vendors...
                  </Text>
                )}
                {validationErrors.vendorId && (
                  <Badge tone="critical">{validationErrors.vendorId}</Badge>
                )}
              </div>
              <div>
                <CustomDatePicker
                  label="Date"
                  selected={vendorCredit.date}
                  onChange={(date) =>
                    setVendorCredit((prev) => ({ ...prev, date: date }))
                  }
                />
              </div>
            </div>

            {/* Second Row - Credit Note, Purchase Bill Reference, Purchase Receives */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <TextField
                  label="Credit Note Number *"
                  value={vendorCredit.creditNoteNumber}
                  disabled
                  autoComplete="off"
                />
              </div>
              <div>
                <TextField
                  label="Purchase Bill Reference"
                  value={vendorCredit.purchaseBillReference}
                  onChange={(value) =>
                    setVendorCredit((prev) => ({
                      ...prev,
                      purchaseBillReference: value,
                    }))
                  }
                  placeholder="Enter bill reference"
                  autoComplete="off"
                />
              </div>
              <div>
                <Select
                  label="Purchase Receives *"
                  options={purchaseReceiveOptions}
                  value={vendorCredit.purchaseReceiveId}
                  onChange={(value) =>
                    setVendorCredit((prev) => ({
                      ...prev,
                      purchaseReceiveId: value,
                    }))
                  }
                  disabled={isLoadingReceives}
                />
                {isLoadingReceives && (
                  <Text as="span" variant="bodySm" tone="subdued">
                    Loading purchase receives...
                  </Text>
                )}
                {purchaseReceiveError && (
                  <Text as="span" variant="bodySm" tone="critical">
                    {purchaseReceiveError}
                  </Text>
                )}
                {validationErrors.purchaseReceiveId && (
                  <Badge tone="critical">{validationErrors.purchaseReceiveId}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Line Items Card */}
      <Card>
        <div className="p-6">
          <div className="mb-4">
            <Text as="h2" variant="headingMd">
              Line Items
            </Text>
            {isLoading && (
              <Text as="span" variant="bodySm" tone="subdued">
                Loading products...
              </Text>
            )}
          </div>

          <div className="space-y-4">
            {/* Header */}
            <div className="grid grid-cols-12 gap-4 bg-[#F5F5F5] p-4 rounded">
              <div className="col-span-1">
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Image
                </Text>
              </div>
              <div className="col-span-4">
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Product
                </Text>
              </div>
              <div className="col-span-2">
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Quantity
                </Text>
              </div>
              <div className="col-span-2">
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Rate
                </Text>
              </div>
              <div className="col-span-2">
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Amount
                </Text>
              </div>
              <div className="col-span-1">
                <Text as="span" variant="bodyMd" fontWeight="bold">
                  Actions
                </Text>
              </div>
            </div>

            {/* Line Items */}
            {vendorCredit.lineItems.map((item, index) => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-1">
                  {item.productId ? (
                    <img
                      src={productLookup.find(p => p.value === item.productId)?.imageUrl || ""}
                      alt={item.productName}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "";
                        (e.target as HTMLImageElement).style.display = "none";
                        const placeholder = document.createElement("div");
                        placeholder.className = "w-12 h-12 bg-gray-100 rounded flex items-center justify-center";
                        placeholder.innerHTML = '<span class="text-gray-400 text-xs">No img</span>';
                        (e.target as HTMLImageElement).parentNode?.appendChild(placeholder);
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                      <span className="text-gray-400 text-xs">No img</span>
                    </div>
                  )}
                </div>
                <div className="col-span-4">
                  <Select
                    label=""
                    options={productOptions}
                    value={item.productId}
                    onChange={(value) => updateLineItem(index, 'productId', value)}
                  />
                </div>
                <div className="col-span-2">
                  <TextField
                    label=""
                    type="number"
                    value={item.quantity.toString()}
                    onChange={(value) => updateLineItem(index, 'quantity', Number(value))}
                    autoComplete="off"
                  />
                </div>
                <div className="col-span-2">
                  <TextField
                    label=""
                    type="number"
                    value={item.rate.toString()}
                    onChange={(value) => updateLineItem(index, 'rate', Number(value))}
                    autoComplete="off"
                  />
                </div>
                <div className="col-span-2">
                  <TextField
                    label=""
                    value={item.amount.toFixed(2)}
                    disabled
                    autoComplete="off"
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    icon={DeleteIcon}
                    onClick={() => removeRow(index)}
                    disabled={vendorCredit.lineItems.length === 1}
                  />
                </div>
              </div>
            ))}

            {/* Line Items Validation Error */}
            {validationErrors.lineItems && (
              <div className="mt-2">
                <Badge tone="critical">{validationErrors.lineItems}</Badge>
              </div>
            )}

            {/* Add New Row Button */}
            <div className="mt-4">
              <Button onClick={addNewRow} variant="secondary">
                + Add New Row
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button 
          variant="secondary" 
          onClick={() => router.push('/printrove/purchase/credits')}
          disabled={isCreating}
        >
          Cancel
        </Button>
        
        {isDraft ? (
          <>
            <Button 
              variant="secondary" 
              onClick={handleSaveDraft}
              disabled={isCreating}
              loading={isCreating}
            >
              {isCreating ? 'Updating...' : 'Update Draft'}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleSubmit('open')}
              disabled={isCreating}
              loading={isCreating}
            >
              {isCreating ? 'Completing...' : 'Complete & Activate'}
            </Button>
          </>
        ) : (
          <>
            <Button 
              variant="secondary" 
              onClick={handleSaveDraft}
              disabled={isCreating}
              loading={isCreating}
            >
              {isCreating ? 'Saving...' : 'Save as Draft'}
            </Button>
            <Button 
              variant="primary" 
              onClick={() => handleSubmit('open')}
              disabled={isCreating}
              loading={isCreating}
            >
              {isCreating ? 'Creating...' : 'Create Vendor Credit'}
            </Button>
          </>
        )}
      </div>

      {successMessage && (
        <Banner tone="success" onDismiss={() => setSuccessMessage(null)}>
          <p>{successMessage}</p>
        </Banner>
      )}
      {errorMessage && (
        <Banner tone="critical" onDismiss={() => setErrorMessage(null)}>
          <p>{errorMessage}</p>
        </Banner>
      )}

      {/* Draft Status Display */}
      {isDraft && draftId && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <Text as="p" variant="bodyMd" tone="success">
                📝 Draft saved successfully! Draft ID: {getDraftIdString()}
              </Text>
              <div className="mt-2">
                <Text as="p" variant="bodySm" tone="subdued">
                  You can continue editing and save updates, or complete the draft to activate it.
                </Text>
              </div>
            </div>
            <Button 
              variant="plain" 
              onClick={clearDraft}
              size="slim"
            >
              Clear Draft
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {createError && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Text as="p" variant="bodyMd" tone="critical">
            Error: {createError}
          </Text>
        </div>
      )}

      {/* Loading Overlay */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <Text as="p" variant="bodyMd">
              Creating vendor credit...
            </Text>
          </div>
        </div>
      )}
    </div>
  );
}