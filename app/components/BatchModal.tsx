import React, { useState, useEffect } from "react";
import {
  Modal,
  TextField,
  Text,
  Select,
  Banner,
  Checkbox,
} from "@shopify/polaris";
import { CustomDatePicker } from "@/app/components/DatePicker";
import { MultiSelect } from "@/components/MultiSelect";
import { Button } from "@/app/components/Button";
import { useBatchStore } from "@/store/useBatchStore";
import { useRouter } from "next/navigation";

interface BatchFormData {
  type: "RUSH" | "OUTSOURCED" | "IN-HOUSE NON TSHIRT" | "";
  dtgCount: string;
  dtfCount: string;
  plainInventoryCount: string;
  inHouseNonTshirtCount: string;
  orderIds: Array<{ id: string; name: string }>;
  fromDate: Date;
  toDate: Date;
}

interface BatchSuggestion {
  id: string;
  name: string;
  products: Array<{
    id: string;
    printType: string;
    qty: number;
    sku: string;
  }>;
  totalQty: number;
}

const initialFormData: BatchFormData = {
  type: "", // No default selection
  dtgCount: "",
  dtfCount: "",
  plainInventoryCount: "0",
  inHouseNonTshirtCount: "0",
  orderIds: [],
  fromDate: new Date(),
  toDate: new Date(),
};

export function BatchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { orders, isCreating, error, fetchOrders, createBatch } =
    useBatchStore();
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<BatchSuggestion[]>([]);

  // New states for the suggestions modal
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [selectedSuggestions, setSelectedSuggestions] = useState<{
    [id: string]: boolean;
  }>({});
  const [aggregatedCounts, setAggregatedCounts] = useState({
    dtgCount: 0,
    dtfCount: 0,
  });

  useEffect(() => {
    if (open) {
      fetchOrders();
      // Reset form when opening modal
      setFormData(initialFormData);
      setErrors({});
      setApiErrorMessage(null);
      setSuggestions([]);
      setShowSuggestionsModal(false);
      setSelectedSuggestions({});
      setAggregatedCounts({ dtgCount: 0, dtfCount: 0 });
    }
  }, [open, fetchOrders]);

  // Calculate aggregated counts whenever selected suggestions change
  useEffect(() => {
    const counts = { dtgCount: 0, dtfCount: 0 };
    suggestions.forEach((suggestion) => {
      if (selectedSuggestions[suggestion.id]) {
        suggestion.products.forEach((product) => {
          if (product.printType === "DTG") counts.dtgCount += product.qty;
          if (product.printType === "DTF") counts.dtfCount += product.qty;
        });
      }
    });
    setAggregatedCounts(counts);
  }, [selectedSuggestions, suggestions]);

  const handleSubmit = async () => {
    const newErrors: { [key: string]: string } = {};

    // Remove batch type validation since it's not mandatory
    // if (!formData.type) {
    //   newErrors.type = "Type is required";
    // }

    if (!formData.dtgCount && !formData.dtfCount) {
      newErrors.count = "Either DTG or DTF count is required";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const result = await createBatch({
        ...formData,
        dtgCount: parseInt(formData.dtgCount) || 0,
        dtfCount: parseInt(formData.dtfCount) || 0,
        fromDate: formData.fromDate.toISOString(),
        toDate: formData.toDate.toISOString(),
        // Pass the type even if empty, API should handle it
        batchType: formData.type as
          | "RUSH"
          | "OUTSOURCED"
          | "IN-HOUSE NON TSHIRT"
          | "",
      });

      // Check both result.success AND result.data?.success if applicable
      if (
        result.success &&
        (result.data === undefined || result.data?.success !== false)
      ) {
        onClose();
        router.push("/printrove/production/batch");
      } else {
        // Handle failure - either from HTTP error or from data.success: false
        setApiErrorMessage(
          result.message || result.data?.message || "Failed to create batch"
        );

        if (result.data?.suggestions && result.data.suggestions.length > 0) {
          setSuggestions(result.data.suggestions);
          setShowSuggestionsModal(true); // Show the suggestions modal

          // Initialize selection state for each suggestion
          const initialSelections: { [id: string]: boolean } = {};
          result.data.suggestions.forEach((suggestion) => {
            initialSelections[suggestion.id] = false;
          });
          setSelectedSuggestions(initialSelections);
        }
      }
    }
  };

  const toggleSuggestionSelection = (suggestionId: string) => {
    setSelectedSuggestions((prev) => ({
      ...prev,
      [suggestionId]: !prev[suggestionId],
    }));
  };

  const applySelectedSuggestions = () => {
    // Get all selected orders
    const selectedOrders = suggestions
      .filter((suggestion) => selectedSuggestions[suggestion.id])
      .map((suggestion) => ({
        id: suggestion.id,
        name: suggestion.name,
      }));

    // Update form data with aggregated counts and selected orders
    setFormData((prev) => ({
      ...prev,
      dtgCount: aggregatedCounts.dtgCount.toString(),
      dtfCount: aggregatedCounts.dtfCount.toString(),
      orderIds: [...selectedOrders],
    }));

    // Close the suggestions modal
    setShowSuggestionsModal(false);
    setApiErrorMessage(null);
    setSuggestions([]);
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Create Batch"
        primaryAction={{
          content: "Create",
          onAction: handleSubmit,
          loading: isCreating,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: onClose,
          },
        ]}
      >
        <Modal.Section>
          <div className="space-y-6">
            {apiErrorMessage && !showSuggestionsModal && (
              <Banner tone="critical">
                <p>{apiErrorMessage}</p>
              </Banner>
            )}

            {/* Batch Type Selection - now optional */}
            <div>
              <Text as="h2" fontWeight="medium" variant="bodyMd">
                Batch Type (Optional)
              </Text>
              <div className="flex gap-4 mt-2">
                {["RUSH", "OUTSOURCED", "IN-HOUSE NON TSHIRT"].map((type) => (
                  <div
                    key={type}
                    className={`p-4 border rounded cursor-pointer ${
                      formData.type === type
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        type:
                          prev.type === type
                            ? ""
                            : (type as BatchFormData["type"]),
                      }))
                    }
                  >
                    <input
                      type="checkbox"
                      checked={formData.type === type}
                      onChange={() =>
                        setFormData((prev) => ({
                          ...prev,
                          type:
                            prev.type === type
                              ? ""
                              : (type as BatchFormData["type"]),
                        }))
                      }
                      className="mr-2"
                    />
                    {type}
                  </div>
                ))}
              </div>
              {/* Error message removed since field is not mandatory */}
            </div>

            {/* Count Fields */}
            <div className="space-y-4">
              <Text as="h2" fontWeight="medium" variant="bodyMd">
                Batch Counts
              </Text>
              <div>
                <TextField
                  label="DTG Count"
                  type="number"
                  value={formData.dtgCount}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, dtgCount: value }))
                  }
                  autoComplete="off"
                />
              </div>
              <div>
                <TextField
                  label="DTF Count"
                  type="number"
                  value={formData.dtfCount}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, dtfCount: value }))
                  }
                  autoComplete="off"
                />
              </div>
              {errors.count && (
                <div className="text-red-500 text-sm">{errors.count}</div>
              )}
            </div>

            {/* Order Selection */}
            <div>
              <MultiSelect
                label="Orders"
                options={orders.map((order) => ({
                  label: order.name,
                  value: order.id,
                }))}
                selected={formData.orderIds.map((order) => order.id)}
                onChange={(values) => {
                  const selectedOrders = orders
                    .filter((order) => values.includes(order.id))
                    .map((order) => ({
                      id: order.id,
                      name: order.name,
                    }));
                  setFormData((prev) => ({
                    ...prev,
                    orderIds: selectedOrders,
                  }));
                }}
              />
            </div>

            {/* Date Selection */}
            <div className="grid grid-cols-2 gap-4">
              <CustomDatePicker
                label="From Date"
                selected={formData.fromDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, fromDate: date }))
                }
              />
              <CustomDatePicker
                label="To Date"
                selected={formData.toDate}
                onChange={(date) =>
                  setFormData((prev) => ({ ...prev, toDate: date }))
                }
              />
            </div>

            {/* Batch Summary Table */}
            <div>
              <Text as="h2" fontWeight="medium" variant="bodyMd">
                Batch Summary
              </Text>
              <div className="border rounded overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="px-4 py-2 text-left font-medium">Batch</th>
                      <th className="px-4 py-2 text-center font-medium">
                        Plain Inventory
                      </th>
                      <th className="px-4 py-2 text-center font-medium">
                        In-House non Tshirt
                      </th>
                      <th className="px-4 py-2 text-center font-medium">DTG</th>
                      <th className="px-4 py-2 text-center font-medium">DTF</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2 border-r">Printrove</td>
                      <td className="px-4 py-2 text-center">
                        {formData.plainInventoryCount || "0"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formData.inHouseNonTshirtCount || "0"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formData.dtgCount || "0"}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formData.dtfCount || "0"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </Modal.Section>
        {error && <div className="mt-4 text-red-500 text-sm">{error}</div>}
      </Modal>

      {/* Suggestions Modal - unchanged */}
      <Modal
        open={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        title="Suggested Orders"
        primaryAction={{
          content: "Apply Selected Orders",
          onAction: applySelectedSuggestions,
          disabled: Object.values(selectedSuggestions).every(
            (selected) => !selected
          ),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setShowSuggestionsModal(false),
          },
        ]}
      >
        <Modal.Section>
          {/* Suggestions modal content unchanged */}
          <div className="space-y-4">
            <Banner tone="warning">
              <p>{apiErrorMessage}</p>
              <p className="mt-2">
                Please select a combination of orders that meets your batch
                requirements.
              </p>
            </Banner>

            <div className="flex justify-between items-center border-b pb-3 mb-4">
              <Text as="h3" variant="headingSm">
                Available Orders
              </Text>
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center space-x-6">
                <div>
                  <Text as="span" variant="bodyMd">
                    Selected:{" "}
                  </Text>
                </div>
                <div>
                  <Text as="span" variant="bodyMd">
                    DTG: {aggregatedCounts.dtgCount}
                  </Text>
                </div>
                <div>
                  <Text as="span" variant="bodyMd">
                    DTF: {aggregatedCounts.dtfCount}
                  </Text>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className={`border rounded-lg p-4 ${
                    selectedSuggestions[suggestion.id]
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Checkbox
                        checked={!!selectedSuggestions[suggestion.id]}
                        onChange={() =>
                          toggleSuggestionSelection(suggestion.id)
                        }
                        label=""
                      />
                      <span className="ml-2">
                        <Text as="span" variant="bodyMd" fontWeight="bold">
                          Order: {suggestion.name}
                        </Text>
                      </span>
                    </div>
                    <Text as="span" variant="bodyMd" fontWeight="semibold">
                      Total Quantity: {suggestion.totalQty}
                    </Text>
                  </div>

                  <div className="pl-8">
                    <Text as="p" variant="bodyMd" fontWeight="semibold">
                      Products:
                    </Text>
                    <ul className="mt-1 space-y-1">
                      {suggestion.products.map((product, idx) => (
                        <li key={idx} className="flex justify-between text-sm">
                          <span>{product.sku}</span>
                          <span>
                            {product.printType} × {product.qty}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {(() => {
                        const counts = suggestion.products.reduce(
                          (acc, product) => {
                            if (product.printType === "DTF")
                              acc.dtf += product.qty;
                            if (product.printType === "DTG")
                              acc.dtg += product.qty;
                            return acc;
                          },
                          { dtg: 0, dtf: 0 }
                        );

                        return (
                          <>
                            {counts.dtg > 0 && (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                DTG: {counts.dtg}
                              </span>
                            )}
                            {counts.dtf > 0 && (
                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                                DTF: {counts.dtf}
                              </span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal.Section>
      </Modal>
    </>
  );
}
