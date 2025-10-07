"use client";

import React, { useEffect, useState } from "react";
import { Card, Text, Button, Spinner } from "@shopify/polaris";
import { useRouter } from "next/navigation";
import apiClient from "@/apiClient";

interface PutAwayDetails {
  _id: string;
  putAwayId: string;
  referenceNumber: string;
  putawayType: string;
  totalQty: number;
  createdAt: string;
  createdBy: string;
  lineItems: {
    productId: string;
    productName?: string; // May be populated by backend or need to fetch
    productSku?: string; // SKU field added
    qty: number;
    binId: string;
    binNumber: string;
    binName: string; // Added for display purposes
  }[];
}

export default function PutAwayDetails({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;
  const [putAway, setPutAway] = useState<PutAwayDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPutAwayDetails = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(`/putaway/${id}`);
        if (response.data.success) {
          setPutAway(response.data.data);
        } else {
          setError("Failed to load put away details");
        }
      } catch (err) {
        setError("An error occurred while fetching put away details");
        console.error("Error fetching put away details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPutAwayDetails();
  }, [id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Spinner size="large" />
      </div>
    );
  }

  if (error || !putAway) {
    return (
      <div className="h-full p-8 bg-[#F5F5F5]">
        <Card>
          <div className="p-6">
            <Text as="h2" variant="headingMd" tone="critical">
              {error || "Put Away record not found"}
            </Text>
            <div className="mt-4">
              <Button onClick={() => router.push("/printrove/putaway")}>
                Back to Put Away List
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-full p-8 bg-[#F5F5F5] space-y-6">
      <div className="flex justify-between items-center">
        <Text as="h1" variant="headingLg">
          Put Away Details - {putAway.putAwayId}
        </Text>
        <Button onClick={() => router.push("/printrove/putaway")}>
          Back to List
        </Button>
      </div>

      {/* Put Away Info Card */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <Text as="h2" variant="headingMd">
              Put Away Information
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Text as="p" variant="bodyMd" fontWeight="bold">
                Reference Number:
              </Text>
              <Text as="p" variant="bodyMd">
                {putAway.referenceNumber}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd" fontWeight="bold">
                Put Away Type:
              </Text>
              <div className="mt-1">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    putAway.putawayType === "INCOMING"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {putAway.putawayType}
                </span>
              </div>
            </div>
            <div>
              <Text as="p" variant="bodyMd" fontWeight="bold">
                Total Quantity:
              </Text>
              <Text as="p" variant="bodyMd">
                {putAway.totalQty}
              </Text>
            </div>
            <div>
              <Text as="p" variant="bodyMd" fontWeight="bold">
                Created On:
              </Text>
              <Text as="p" variant="bodyMd">
                {formatDate(putAway.createdAt)}
              </Text>
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

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {putAway.lineItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.productName} ({item.productSku})
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.binName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  );
}
