"use client";

import React, { useState, useEffect } from "react";
import { Card, FormLayout, TextField, DatePicker } from "@shopify/polaris";
import { MultiSelect } from "@/components/MultiSelect";
import { Button } from "@/app/components/Button";
import { useRouter } from "next/navigation";
import { useBatchStore } from "@/store/useBatchStore";
import { getApiBaseUrl } from "@/lib/apiUrl";

type BatchType = "RUSH" | "OUTSOURCED" | "IN-HOUSE NON TSHIRT";

interface BatchFormData {
  batchType: BatchType;
  dtgCount: string;
  dtfCount: string;
  merchants: string[];
  orderIds: Array<{ id: string; name: string }>;
  fromDate: Date;
  toDate: Date;
}

export default function CreateBatch() {
  const router = useRouter();
  const [formData, setFormData] = useState<BatchFormData>({
    batchType: "RUSH",
    dtgCount: "",
    dtfCount: "",
    merchants: [],
    orderIds: [],
    fromDate: new Date(),
    toDate: new Date(),
  });

  const [orders, setOrders] = useState<Array<{ id: string; name: string }>>([]);
  const { createBatch, isLoading, error } = useBatchStore();

  // Fetch all orders when component mounts
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/order/all`);
        const data = await response.json();
        if (data.success) {
          setOrders(
            data.data.map((order: any) => ({
              id: order._id,
              name: order.orderId,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
  }, []);

  const handleTypeChange = (type: BatchType) => {
    setFormData((prev) => ({ ...prev, batchType: type }));
  };

  const handleSubmit = async () => {
    const payload = {
      ...formData,
      dtgCount: parseInt(formData.dtgCount) || 0,
      dtfCount: parseInt(formData.dtfCount) || 0,
      fromDate: formData.fromDate.toISOString(),
      toDate: formData.toDate.toISOString(),
    };

    const success = await createBatch(payload);
    if (success) {
      router.push("/printrove/production/batch");
    }
  };

  return (
    <div className="p-8 bg-[#F5F5F5]">
      <div className="max-w-3xl">
        <Card>
          <div className="p-6">
            <h1 className="text-2xl font-bold mb-6">Create Batch</h1>

            <FormLayout>
              {/* Batch Type Selection */}
              <div className="flex gap-4">
                {["RUSH", "OUTSOURCED", "IN-HOUSE NON TSHIRT"].map((type) => (
                  <div
                    key={type}
                    className={`p-4 border rounded cursor-pointer ${
                      formData.batchType === type
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200"
                    }`}
                    onClick={() => handleTypeChange(type as BatchType)}
                  >
                    <input
                      type="checkbox"
                      checked={formData.batchType === type}
                      onChange={() => handleTypeChange(type as BatchType)}
                      className="mr-2"
                    />
                    {type}
                  </div>
                ))}
              </div>

              {/* Count Fields */}
              <div className="grid grid-cols-2 gap-4">
                <TextField
                  label="DTG Count"
                  type="number"
                  value={formData.dtgCount}
                  onChange={(value) =>
                    setFormData((prev) => ({ ...prev, dtgCount: value }))
                  }
                  autoComplete="off"
                />
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

              {/* Order Selection */}
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

              {/* Date Selection */}
              <div className="grid grid-cols-2 gap-4">
                <DatePicker
                  month={formData.fromDate.getMonth()}
                  year={formData.fromDate.getFullYear()}
                  selected={formData.fromDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, fromDate: date }))
                  }
                  label="From Date"
                />
                <DatePicker
                  month={formData.toDate.getMonth()}
                  year={formData.toDate.getFullYear()}
                  selected={formData.toDate}
                  onChange={(date) =>
                    setFormData((prev) => ({ ...prev, toDate: date }))
                  }
                  label="To Date"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  onClick={() => router.push("/printrove/production/batch")}
                  variant="secondary"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Batch"}
                </Button>
              </div>

              {error && (
                <div className="mt-4 text-red-500 text-sm">{error}</div>
              )}
            </FormLayout>
          </div>
        </Card>
      </div>
    </div>
  );
}
