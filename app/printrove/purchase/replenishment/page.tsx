"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Page,
  Card,
  TextField,
  Text,
  Select,
  InlineStack,
  Spinner,
  Modal,
  IndexTable,
  useIndexResourceState,
  Pagination,
  Button,
  ButtonGroup,
  Icon,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import apiClient from "@/apiClient";
import { useVendorStore } from "@/store/useVendorStore";
import { useProductStore } from "@/store/useProductStore";
import { usePurchaseOrderStore } from "@/store/usePurchaseOrderStore";
import { useRouter } from "next/navigation";
import VendorSplitModal from "@/app/components/VendorSplitModal";

interface ApiRow {
  productId: string;
  productName: string;
  sku: string;
  currentStock: number;
  productsYetToBeReceived: number;
  lastNDaysDemand: number;
  maximumPeriodUsage: number;
  averageDailyUsage: number;
  avgLeadTimeDays: number;
  maxLeadTimeDays: number;
  leadTimeDemand: number;
  safetyStock: number;
  rop: number;
  estimate: number;
  lowStockValue: number;
}

interface VendorSplit {
  vendorId: string;
  vendorName: string;
  quantity: number;
  rate: number;
}

interface ReplenishmentItem extends ApiRow {
  id: string; // local id key for selection
  toOrder: number; // editable by user; default max(0, estimate)
  vendorSplits?: VendorSplit[]; // Store vendor splits
}

export default function ReplenishmentPlanningPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [daysFilter, setDaysFilter] = useState("30");
  const [items, setItems] = useState<ReplenishmentItem[]>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [modalVendorId, setModalVendorId] = useState("");
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false);
  const [selectedItemForSplit, setSelectedItemForSplit] = useState<ReplenishmentItem | null>(null);
  const [currentSplitIndex, setCurrentSplitIndex] = useState(0);
  const [itemsToSplit, setItemsToSplit] = useState<ReplenishmentItem[]>([]);
  const router = useRouter();

  // Persist user overrides for To Order across refetches
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  // Stores
  const { allVendors, isLoadingAll: isLoadingVendors, fetchAllVendors } = useVendorStore();
  const { allProducts, isLoadingAll: isLoadingProducts, fetchAllProducts } = useProductStore();
  const { createPurchaseOrder, isCreating } = usePurchaseOrderStore();

  const [vendorId, setVendorId] = useState("");

  const timezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  }, []);

  const daysOptions = [
    { label: "30 Days", value: "30" },
    { label: "60 Days", value: "60" },
    { label: "90 Days", value: "90" },
  ];

  const perPageOptions = [
    { label: "25 per Page", value: "25" },
    { label: "50 per Page", value: "50" },
    { label: "100 per Page", value: "100" },
  ];

  const fetchRows = async () => {
    setIsLoading(true);
    try {
      const body = {
        days: Number(daysFilter),
        search: searchQuery?.trim() || "",
        page,
        limit,
        skus: null as null,
        timezone,
      };

      const response = await apiClient.post<{
        total: number;
        page: number;
        limit: number;
        rows: ApiRow[];
      }>("/purchase/replenishment/rows", body);

      const rows = response.data.rows || [];
      const mapped: ReplenishmentItem[] = rows.map((r) => {
        const id = `${r.productId}-${r.sku}`;
        const suggested = Math.max(0, Math.ceil(Number(r.estimate || 0)));
        const toOrder = overrides[id] !== undefined ? overrides[id] : suggested;
        return {
          ...r,
          id,
          toOrder,
        };
      });

      setItems(mapped);
      setTotal(response.data.total || mapped.length);
    } catch (e) {
      // In case of error, keep current state and surface minimal UI feedback
      console.error("Failed to load replenishment rows", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysFilter, page, limit]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchRows();
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Load vendors and products for PO creation (rate lookup and vendor selection)
  useEffect(() => {
    fetchAllVendors();
    fetchAllProducts();
  }, [fetchAllVendors, fetchAllProducts]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleToOrderChange = (id: string, value: string) => {
    // Allow empty input while typing; coerce to number later
    const sanitized = value.replace(/[^0-9]/g, "");
    const num = sanitized === "" ? ("" as unknown as number) : Math.max(0, Math.floor(Number(sanitized)) || 0);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, toOrder: num as any, vendorSplits: undefined } : item))
    );
    // Update override only when numeric present
    if (sanitized !== "") {
      setOverrides((prev) => ({ ...prev, [id]: Math.max(0, Math.floor(Number(sanitized)) || 0) }));
    }
  };

  const handleToOrderBlur = (id: string) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const numeric = Math.max(0, Number(item.toOrder || 0));
        return { ...item, toOrder: numeric } as any;
      })
    );
  };

  const handleOpenSplitModal = (item: ReplenishmentItem) => {
    if (item.toOrder <= 0) {
      alert("Please set a 'To Order' quantity greater than 0 before splitting");
      return;
    }
    setSelectedItemForSplit(item);
    setIsSplitModalOpen(true);
  };

  const handleSaveSplit = (splits: VendorSplit[]) => {
    if (!selectedItemForSplit) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemForSplit.id
          ? { ...item, vendorSplits: splits }
          : item
      )
    );
  };

  const handleSaveSplitAndNext = (splits: VendorSplit[]) => {
    if (!selectedItemForSplit) return;

    // Save the splits for the current item
    setItems((prev) =>
      prev.map((item) =>
        item.id === selectedItemForSplit.id
          ? { ...item, vendorSplits: splits }
          : item
      )
    );

    // Check if there are more items to split
    if (currentSplitIndex < itemsToSplit.length - 1) {
      // Move to the next item
      const nextIndex = currentSplitIndex + 1;
      setCurrentSplitIndex(nextIndex);
      setSelectedItemForSplit(itemsToSplit[nextIndex]);
    } else {
      // All items have been processed, close split modal and open create modal
      setIsSplitModalOpen(false);
      setSelectedItemForSplit(null);
      setItemsToSplit([]);
      setCurrentSplitIndex(0);
      setIsCreateModalOpen(true);
    }
  };

  const handleCreatePOClick = () => {
    const selected = items.filter((i) => selectedIdsSet.has(i.id) && i.toOrder > 0);
    
    if (selected.length === 0) {
      alert("Please select items with 'To Order' quantity > 0");
      return;
    }

    // Set items to split and start with the first one
    setItemsToSplit(selected);
    setCurrentSplitIndex(0);
    setSelectedItemForSplit(selected[0]);
    setModalVendorId("");
    setIsSplitModalOpen(true);
  };

  // Polaris IndexTable selection state
  type SelectionResource = { id: string } & Record<string, unknown>;
  const selectionResources: SelectionResource[] = useMemo(
    () => items.map((i) => ({ id: i.id })),
    [items]
  );
  const { selectedResources, allResourcesSelected, handleSelectionChange } = useIndexResourceState<SelectionResource>(
    selectionResources
  );
  const selectedIdsSet = useMemo(
    () => new Set(allResourcesSelected ? items.map((i) => i.id) : (selectedResources as string[])),
    [allResourcesSelected, items, selectedResources]
  );
  const selectedCount = useMemo(
    () => (allResourcesSelected ? items.length : (selectedResources as string[]).length),
    [allResourcesSelected, items.length, selectedResources]
  );

  const vendorOptions = useMemo(
    () => [
      { label: "Select Vendor", value: "" },
      ...allVendors.map((v) => ({ label: v.vendorName || v.companyName || v.email, value: v.vendorId })),
    ],
    [allVendors]
  );

  const getVendorName = (id: string) => {
    const v = allVendors.find((x) => x.vendorId === id || x.id === id);
    return v ? (v.vendorName ? `${v.vendorName}${v.companyName ? ` - ${v.companyName}` : ""}` : v.companyName || "") : "";
  };

  const handleCreatePO = async (status: "draft" | "open" = "draft") => {
    const selected = items.filter((i) => selectedIdsSet.has(i.id) && i.toOrder > 0);
    
    if (selected.length === 0) {
      alert("Please select items with 'To Order' quantity > 0");
      return;
    }

    // Build rate map by productId (item_id) if available, otherwise by sku
    const rateByItemId = new Map(allProducts.map((p) => [p.item_id, p.rate]));

    try {
      setIsSubmitting(true);

      // Group items by vendor (handling vendor splits)
      const vendorGroups: { [vendorId: string]: any[] } = {};

      for (const item of selected) {
        if (item.vendorSplits && item.vendorSplits.length > 0) {
          // Item has vendor splits - create separate line items for each vendor
          for (const split of item.vendorSplits) {
            if (!vendorGroups[split.vendorId]) {
              vendorGroups[split.vendorId] = [];
            }
            vendorGroups[split.vendorId].push({
              productId: item.productId,
              quantity: String(split.quantity),
              rate: String(split.rate),
              amount: (split.quantity * split.rate).toFixed(2),
            });
          }
        } else {
          // No vendor split - use single vendor
          const vendorIdToUse = modalVendorId || vendorId;
          if (!vendorIdToUse) {
            alert("Please select a vendor");
            return;
          }
          
          if (!vendorGroups[vendorIdToUse]) {
            vendorGroups[vendorIdToUse] = [];
          }
          
          const qty = Number(item.toOrder) || 0;
          const rate = Number(rateByItemId.get(item.productId) ?? 0);
          vendorGroups[vendorIdToUse].push({
            productId: item.productId,
            quantity: String(qty),
            rate: String(rate),
            amount: (qty * rate).toFixed(2),
          });
        }
      }

      // Create one PO per vendor
      const createdPOs = [];
      for (const [vendorIdKey, items] of Object.entries(vendorGroups)) {
        const formattedData = {
          vendorId: vendorIdKey,
          vendorName: getVendorName(vendorIdKey),
          reference: `ROP-${new Date().toISOString().split("T")[0]}`,
          date: new Date().toISOString(),
          expectedDeliveryDate: new Date().toISOString(),
          address: "",
          status,
          items,
        };

        const result = await createPurchaseOrder(formattedData);
        createdPOs.push(result);
      }

      alert(`Created ${createdPOs.length} purchase order(s) successfully!`);
      router.push("/printrove/purchase/po");
    } catch (e) {
      console.error("Failed to create PO", e);
      alert("Failed to create purchase order(s). Please try again.");
    } finally {
      setIsSubmitting(false);
      setIsCreateModalOpen(false);
    }
  };

  const handleExport = () => {
    const headers = [
      "Product ID",
      "Product",
      "SKU",
      "Pending QTY",
      "Estimate",
      "To Order",
      "ROP",
      "Current Stock",
      "Low Stock Value",
      `${daysFilter} Day Demand`,
    ];

    const rows = items.map((r) => [
      r.productId,
      r.productName,
      r.sku,
      r.productsYetToBeReceived,
      r.estimate,
      r.toOrder,
      r.rop,
      r.currentStock,
      r.lowStockValue,
      r.lastNDaysDemand,
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((v) => {
        const s = String(v ?? "");
        // Escape quotes and wrap fields with commas/newlines in quotes
        const needsQuotes = /[",\n]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      }).join(","))
      .join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `replenishment_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ paddingLeft: 24 }}>
    <Page
      title="Replenishment Planning"
      subtitle={`Total Count: ${total}`}
      fullWidth
      secondaryActions={[{ content: "Export Data", onAction: handleExport }]}
    >
      {/* Controls row: left = No of Days, right = Search */}
      <InlineStack align="space-between" gap="400">
        <div style={{ width: 200 }}>
          <Select label="" options={daysOptions} value={daysFilter} onChange={(v) => setDaysFilter(v)} placeholder="No of Days"/>
        </div>
        <div style={{ flex: 1, maxWidth: 480 }}>
          <TextField
          
            label=""
            placeholder="Search your order here"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon />}
            autoComplete="off"
          />
        </div>
      </InlineStack>

      {/* Selection actions row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12 }}>
        <Text variant="bodyMd" as="p">{selectedCount} Selected</Text>
        <Button onClick={handleCreatePOClick} disabled={items.filter((i) => selectedIdsSet.has(i.id) && i.toOrder > 0).length === 0}>Create PO</Button>
        <Button onClick={() => { setIsSplitModalOpen(false); setSelectedItemForSplit(null); setItemsToSplit([]); setCurrentSplitIndex(0); }}>
          Cancel
        </Button>
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <InlineStack align="center">
              <Spinner accessibilityLabel="Loading" size="large" />
            </InlineStack>
          </div>
        ) : (
          <IndexTable
            resourceName={{ singular: "item", plural: "items" }}
            itemCount={items.length}
            selectedItemsCount={allResourcesSelected ? "All" : (selectedResources as string[]).length}
            onSelectionChange={handleSelectionChange}
            headings={[
              { title: "Product ID" },
              { title: "Product" },
              { title: "SKU" },
              { title: "Pending QTY" },
              { title: "Estimate" },
              { title: "To Order" },
              { title: "ROP" },
              { title: "Current Stock" },
              { title: "Low Stock Value" },
              { title: `${daysFilter} Day Demand` },
            ]}
          >
            {items.map((item: ReplenishmentItem, index: number) => (
              <IndexTable.Row id={item.id} key={item.id} selected={selectedIdsSet.has(item.id)} position={index}>
                <IndexTable.Cell>{item.productId}</IndexTable.Cell>
                <IndexTable.Cell>{item.productName}</IndexTable.Cell>
                <IndexTable.Cell>{item.sku}</IndexTable.Cell>
                <IndexTable.Cell>
                  <div style={{ textAlign: "right", width: "100%" }}>{item.productsYetToBeReceived}</div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div style={{ textAlign: "right", width: "100%" }}>{item.estimate}</div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div
                    style={{ maxWidth: 140 }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <TextField
                      label="To order"
                      labelHidden
                      type="text"
                      inputMode="numeric"
                      value={String(item.toOrder ?? "")}
                      onChange={(value) => handleToOrderChange(item.id, value)}
                      onBlur={() => handleToOrderBlur(item.id)}
                      autoComplete="off"
                    />
                  </div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div style={{ textAlign: "right", width: "100%" }}>{item.rop}</div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div style={{ textAlign: "right", width: "100%" }}>{item.currentStock}</div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div style={{ textAlign: "right", width: "100%" }}>{item.lowStockValue}</div>
                </IndexTable.Cell>
                <IndexTable.Cell>
                  <div style={{ textAlign: "right", width: "100%" }}>{item.lastNDaysDemand}</div>
                </IndexTable.Cell>
              </IndexTable.Row>
            ))}
          </IndexTable>
        )}
      </Card>

      <div className="flex justify-between items-center mt-4">
        <Text variant="bodySm" as="p">Selected: {selectedCount}</Text>
        <Pagination
          hasPrevious={page > 1}
          onPrevious={() => setPage(Math.max(1, page - 1))}
          hasNext={page < Math.ceil(total / limit)}
          onNext={() => setPage(page + 1)}
        />
      </div>

      {/* Create PO Modal */}
      <Modal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Purchase Order(s)"
        primaryAction={{
          content: isSubmitting || isCreating ? "Creating..." : "Create PO Draft",
          onAction: () => handleCreatePO("draft"),
          disabled:
            isSubmitting ||
            isCreating ||
            items.filter((i) => selectedIdsSet.has(i.id) && i.toOrder > 0).length === 0,
        }}
        secondaryActions={[{ content: "Cancel", onAction: () => setIsCreateModalOpen(false) }]}
      >
        <Modal.Section>
          <div className="space-y-4">
            <Text variant="bodyMd" as="p">
              {items.filter((i) => selectedIdsSet.has(i.id) && i.toOrder > 0).length} items selected
            </Text>

            <TextField
              label="Total Quantity"
              value={String(
                items
                  .filter((i) => selectedIdsSet.has(i.id))
                  .reduce((sum, r) => sum + Math.max(0, Number(r.toOrder) || 0), 0)
              )}
              onChange={() => {}}
              disabled
              autoComplete="off"
            />

            {/* Show vendor selection only for items without vendor splits */}
            {items.filter((i) => selectedIdsSet.has(i.id) && !i.vendorSplits).length > 0 && (
              <Select
                label="Vendor Name (for items without vendor split)"
                options={vendorOptions}
                value={modalVendorId}
                onChange={setModalVendorId}
                disabled={isLoadingVendors}
                helpText="This vendor will be used for all items that don't have vendor splits"
              />
            )}

            <div className="p-4 bg-gray-50 rounded-lg">
              <Text variant="headingSm" as="h4">
                Summary:
              </Text>
              <ul className="mt-2 space-y-1">
                <li>
                  <Text variant="bodySm" as="p">
                    Items with vendor splits:{" "}
                    {items.filter((i) => selectedIdsSet.has(i.id) && i.vendorSplits && i.vendorSplits.length > 0).length}
                  </Text>
                </li>
                <li>
                  <Text variant="bodySm" as="p">
                    Items without vendor splits:{" "}
                    {items.filter((i) => selectedIdsSet.has(i.id) && !i.vendorSplits).length}
                  </Text>
                </li>
                <li>
                  <Text variant="bodySm" as="p" tone="subdued">
                    Note: Multiple POs will be created if items are assigned to different vendors
                  </Text>
                </li>
              </ul>
            </div>
          </div>
        </Modal.Section>
      </Modal>

      {/* Vendor Split Modal */}
      {selectedItemForSplit && (
        <VendorSplitModal
          open={isSplitModalOpen}
          onClose={() => {
            setIsSplitModalOpen(false);
            setSelectedItemForSplit(null);
            setItemsToSplit([]);
            setCurrentSplitIndex(0);
          }}
          productName={`${selectedItemForSplit.productName}${itemsToSplit.length > 1 ? ` (${currentSplitIndex + 1}/${itemsToSplit.length})` : ''}`}
          totalQuantity={selectedItemForSplit.toOrder}
          vendors={allVendors}
          onSave={handleSaveSplit}
          existingSplits={selectedItemForSplit.vendorSplits}
          showSaveAndNext={itemsToSplit.length > 0}
          onSaveAndNext={handleSaveSplitAndNext}
        />
      )}
    </Page>
    </div>
  );
}