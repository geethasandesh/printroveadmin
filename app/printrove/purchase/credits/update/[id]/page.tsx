"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card, Text, Select, TextField, Button, Badge, Spinner, Banner } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { CustomDatePicker } from "@/app/components/DatePicker";
import { useProductStore } from "@/store/useProductStore";
import { useVendorStore } from "@/store/useVendorStore";
import { usePurchaseReceiveStore } from "@/store/usePurchaseReceiveStore";
import { useVendorCreditStore } from "@/store/useVendorCreditStore";
import { useParams, useRouter } from "next/navigation";

interface LineItemForm {
  _rowId: string;
  item_id: string;
  productName: string;
  sku: string;
  quantity: number;
  rate: number;
  amount: number;
}

export default function UpdateVendorCredit() {
  const router = useRouter();
  const params = useParams();
  const idParam = (params?.id as string) || "";
  const { currentCredit, isLoadingDetails, fetchVendorCreditById, updateVendorCredit } = useVendorCreditStore();
  const { variants, fetchVariants, isLoading: isLoadingVariants } = useProductStore();
  const { allVendors, fetchAllVendors, isLoadingAll: isLoadingVendors } = useVendorStore();
  const { purchaseReceives, fetchPurchaseReceives, isLoading: isLoadingReceives, error: purchaseReceiveError } = usePurchaseReceiveStore();

  const [vendorId, setVendorId] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const [referenceNumber, setReferenceNumber] = useState("");
  const [purchaseBillReference, setPurchaseBillReference] = useState("");
  const [notes, setNotes] = useState("");
  const [purchaseReceiveId, setPurchaseReceiveId] = useState("");
  const [lineItems, setLineItems] = useState<LineItemForm[]>([]);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (idParam) fetchVendorCreditById(idParam);
    fetchVariants(1, 100);
    fetchAllVendors();
    fetchPurchaseReceives(1, 100);
  }, [idParam]);

  useEffect(() => {
    if (!currentCredit) return;
    const existingVendorId = (currentCredit as any).vendorId || "";
    let resolvedVendorId = existingVendorId;
    if (!resolvedVendorId && allVendors.length) {
      const byName = allVendors.find(
        (v) => (v.vendorName || v.companyName) === ((currentCredit as any).vendorName || (currentCredit as any).vendor_name)
      );
      if (byName) resolvedVendorId = byName.vendorId || (byName as any).id;
    }
    setVendorId(resolvedVendorId);
    setDate(currentCredit.date ? new Date(currentCredit.date) : new Date());
    setReferenceNumber((currentCredit as any).reference || "");
    setPurchaseBillReference((currentCredit as any).purchaseBill || "");
    setNotes((currentCredit as any).notes || "");
    if (purchaseReceives.length) {
      const byId = purchaseReceives.find(
        (r) => r.id === (currentCredit as any).purchase_receive_id || r.pr_id === (currentCredit as any).reference
      );
      const byBill = purchaseReceives.find(
        (r) => r.bill_number === ((currentCredit as any).purchaseBill || (currentCredit as any).purchase_bill)
      );
      setPurchaseReceiveId((byId || byBill)?.id || "");
    }
    setLineItems(
      (currentCredit.items || []).map((i) => ({
        _rowId: i.id,
        item_id: i.id,
        productName: i.productName,
        sku: String(i.id),
        quantity: i.quantity,
        rate: i.rate,
        amount: i.quantity * i.rate,
      }))
    );
  }, [currentCredit, allVendors, purchaseReceives]);

  const products = useMemo(
    () => [
      { label: "Type or Select an item", value: "", sku: "", imageUrl: "" },
      ...variants.map((variant) => ({
        label: `${variant.title} - SKU: ${variant.sku}`,
        value: variant.productId,
        sku: variant.sku,
        imageUrl: variant.thumbnailUrl || "",
      })),
    ],
    [variants]
  );

  const productLookup = useMemo(
    () => [
      { value: "", sku: "", imageUrl: "" },
      ...variants.map((variant) => ({ value: variant.productId, sku: variant.sku, imageUrl: variant.thumbnailUrl || "" })),
    ],
    [variants]
  );

  const productOptions = useMemo(
    () => products.map((p) => ({ label: p.label, value: p.value })),
    [products]
  );

  const vendors = useMemo(
    () => [
      { label: "Search Vendor", value: "" },
      ...allVendors.map((v) => ({ label: `${v.vendorName || v.companyName || "Unnamed Vendor"}`, value: v.vendorId || v.id })),
    ],
    [allVendors]
  );

  const purchaseReceiveOptions = useMemo(
    () => [
      { label: "Select Purchase Receive", value: "" },
      ...purchaseReceives.map((r) => ({ label: `${r.bill_number} - ${r.vendor_name} (${r.po_id || "No PO"})`, value: r.id })),
    ],
    [purchaseReceives]
  );

  const updateLineItem = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value } as LineItemForm;
    if (field === "quantity" || field === "rate") {
      item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    }
    if (field === "item_id") {
      const selected = productLookup.find((p) => p.value === value);
      if (selected) {
        const variant = variants.find((v) => v.productId === value);
        item.productName = variant?.title || selected.sku;
        item.sku = selected.sku;
      }
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const addNewRow = () => {
    setLineItems((prev) => [
      ...prev,
      { _rowId: String(Date.now()), item_id: "", productName: "", sku: "", quantity: 1, rate: 0, amount: 0 },
    ]);
  };

  const removeRow = (index: number) => {
    setLineItems((prev) => prev.length <= 1 ? prev : prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!currentCredit) return;
    const id = (currentCredit as any).id || currentCredit._id || (currentCredit as any).vendor_credit_id || idParam;
    setSaving(true);
    const payload = {
      reference_number: referenceNumber,
      purchase_bill_reference: purchaseBillReference,
      date: date.toISOString().split("T")[0],
      notes,
      line_items: lineItems
        .filter((li) => li.item_id)
        .map((li) => ({ item_id: li.item_id, quantity: li.quantity, rate: li.rate })),
      ...(vendorId ? { vendor_id: vendorId } : {}),
      ...(purchaseReceiveId ? { purchase_receive_id: purchaseReceiveId } : {}),
    };
    const result = await updateVendorCredit(id, payload);
    setSaving(false);
    if (result.success) {
      setSuccessMessage("Vendor credit updated successfully");
      setTimeout(() => router.push(`/printrove/purchase/credits/${idParam}`), 700);
    } else {
      setErrorMessage(result.message || "Failed to update vendor credit");
    }
  };

  if (isLoadingDetails || !currentCredit) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5] flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="h-full p-8 bg-[#F5F5F5] space-y-6">
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
      <div className="flex justify-between items-center">
        <Text as="h1" variant="headingLg">Edit Vendor Credit</Text>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/printrove/purchase/credits/${idParam}`)}>Cancel</Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>Save Changes</Button>
        </div>
      </div>

      <Card>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Select label="Vendor Name" options={vendors} value={vendorId} onChange={setVendorId} disabled={isLoadingVendors} />
            </div>
            <div>
              <CustomDatePicker label="Date" selected={date} onChange={setDate} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <TextField label="Credit Note Number" value={referenceNumber} onChange={setReferenceNumber} autoComplete="off" />
            <TextField label="Purchase Bill Reference" value={purchaseBillReference} onChange={setPurchaseBillReference} autoComplete="off" />
            <Select label="Purchase Receives" options={purchaseReceiveOptions} value={purchaseReceiveId} onChange={setPurchaseReceiveId} disabled={isLoadingReceives} />
          </div>
          <TextField label="Notes" value={notes} onChange={setNotes} multiline={3} autoComplete="off" />
        </div>
      </Card>

      <Card>
        <div className="p-6">
          <div className="mb-4">
            <Text as="h2" variant="headingMd">Line Items</Text>
          </div>
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 bg-[#F5F5F5] p-4 rounded">
              <div className="col-span-5"><Text as="span" variant="bodyMd" fontWeight="bold">Product</Text></div>
              <div className="col-span-2"><Text as="span" variant="bodyMd" fontWeight="bold">Quantity</Text></div>
              <div className="col-span-2"><Text as="span" variant="bodyMd" fontWeight="bold">Rate</Text></div>
              <div className="col-span-2"><Text as="span" variant="bodyMd" fontWeight="bold">Amount</Text></div>
              <div className="col-span-1"><Text as="span" variant="bodyMd" fontWeight="bold">Actions</Text></div>
            </div>

            {lineItems.map((item, index) => (
              <div key={item._rowId} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <Select label="" options={productOptions} value={item.item_id} onChange={(v) => updateLineItem(index, "item_id", v)} />
                </div>
                <div className="col-span-2">
                  <TextField label="" type="number" value={String(item.quantity)} onChange={(v) => updateLineItem(index, "quantity", Number(v))} autoComplete="off" />
                </div>
                <div className="col-span-2">
                  <TextField label="" type="number" value={String(item.rate)} onChange={(v) => updateLineItem(index, "rate", Number(v))} autoComplete="off" />
                </div>
                <div className="col-span-2">
                  <TextField label="" value={(item.amount || 0).toFixed(2)} disabled autoComplete="off" />
                </div>
                <div className="col-span-1">
                  <Button icon={DeleteIcon} onClick={() => removeRow(index)} disabled={lineItems.length === 1} />
                </div>
              </div>
            ))}

            <div className="mt-2">
              <Button variant="secondary" onClick={addNewRow}>+ Add New Row</Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}


