"use client";

import React, { useState } from "react";
import { Modal, TextField, Text } from "@shopify/polaris";
import { Button } from "@/app/components/Button";
import useInventoryAdjustmentStore from "@/store/useInventoryAdjustmentStore";
import { toast } from "react-hot-toast";

interface CycleCountModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CycleCountModal({
  open,
  onClose,
}: CycleCountModalProps) {
  const [count, setCount] = useState("10");
  const [step, setStep] = useState<"input" | "list">("input");

  const {
    isLoading,
    cycleCountItems,
    fetchCycleCount,
    updateQtyOnHand,
    saveCycleCount,
    resetStore,
  } = useInventoryAdjustmentStore();

  const handleStartCycleCount = async () => {
    const countValue = parseInt(count);
    if (isNaN(countValue) || countValue <= 0) {
      toast.error("Please enter a valid number");
      return;
    }

    await fetchCycleCount(countValue);
    setStep("list");
  };

  const handleSaveCycleCount = async () => {
    const success = await saveCycleCount();
    if (success) {
      handleClose();
      window.location.reload(); // Refresh the page to show updated data
    }
  };

  const handleClose = () => {
    setStep("input");
    resetStore();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === "input" ? "Start Cycle Count" : "Cycle Count Items"}
      primaryAction={
        step === "input"
          ? {
              content: "Start Cycle Count",
              onAction: handleStartCycleCount,
              loading: isLoading,
            }
          : {
              content: "Save Cycle Count",
              onAction: handleSaveCycleCount,
              loading: isLoading,
              disabled: cycleCountItems.length === 0,
            }
      }
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
        },
      ]}
    >
      <Modal.Section>
        {step === "input" ? (
          <div>
            <Text as="p" variant="bodyMd" color="subdued">
              Enter the number of random items to check
            </Text>
            <div className="mt-4">
              <TextField
                label="Number of items"
                type="number"
                min="1"
                max="100"
                value={count}
                onChange={(value) => setCount(value)}
                placeholder="Enter count (1-100)"
                helpText="Maximum 100 items can be selected"
                autoComplete="off"
              />
            </div>
          </div>
        ) : (
          <div>
            <Text as="p" variant="bodyMd" color="subdued" className="mb-4">
              Verify the quantity of each item and update if necessary
            </Text>
            {isLoading ? (
              <div className="text-center p-6">Loading...</div>
            ) : cycleCountItems.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                No items found for cycle count
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-12 gap-4 mb-2 font-medium bg-[#F5F5F5] p-3 rounded">
                  <div className="col-span-3">Product</div>
                  <div className="col-span-2">SKU</div>
                  <div className="col-span-2">Bin</div>
                  <div className="col-span-2 text-right">System Qty</div>
                  <div className="col-span-2 text-right">Actual Qty</div>
                  <div className="col-span-1 text-right">Difference</div>
                </div>

                {cycleCountItems.map((item) => {
                  const qtyDiff =
                    (item.qtyOnHand !== undefined ? item.qtyOnHand : item.qty) -
                    item.qty;

                  return (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 gap-4 p-3 border-b ${
                        item.isModified ? "bg-yellow-50" : ""
                      }`}
                    >
                      <div className="col-span-3">{item.productName}</div>
                      <div className="col-span-2">{item.productSku}</div>
                      <div className="col-span-2">{item.binName}</div>
                      <div className="col-span-2 text-right">{item.qty}</div>
                      <div className="col-span-2 text-right">
                        <TextField
                          label=""
                          type="number"
                          value={
                            item.qtyOnHand !== undefined
                              ? item.qtyOnHand.toString()
                              : item.qty.toString()
                          }
                          onChange={(value) =>
                            updateQtyOnHand(item.id, parseInt(value) || 0)
                          }
                          autoComplete="off"
                        />
                      </div>
                      <div className="col-span-1 text-right font-medium">
                        {qtyDiff > 0 ? (
                          <span style={{ color: "#108043" }}>+{qtyDiff}</span>
                        ) : qtyDiff < 0 ? (
                          <span style={{ color: "#DE3618" }}>{qtyDiff}</span>
                        ) : (
                          <span className="text-gray-500">0</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </Modal.Section>
    </Modal>
  );
}
