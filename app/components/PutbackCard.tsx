"use client";

import React, { useState } from "react";
import { Button } from "@/app/components/Button";
import { Card } from "@shopify/polaris";
import { ArrowLeftIcon, ArrowRightIcon } from "@shopify/polaris-icons";
import { Icon, Text } from "@shopify/polaris";

interface SurplusItem {
  _id: string;
  productId: string;
  productName: string;
  sku: string;
  variantId: string;
  surplusQty: number;
  pendingQty: number;
  binId: string;
  binName: string;
  batchId: string;
  batchName: string;
  image?: string;
}

interface PutbackCardProps {
  items: SurplusItem[];
  currentIndex: number;
  onPrevious: () => void;
  onNext: () => void;
  onPutback: (itemId: string, quantity: number) => Promise<void>;
  isProcessing: boolean;
}

const PutbackCard: React.FC<PutbackCardProps> = ({
  items,
  currentIndex,
  onPrevious,
  onNext,
  onPutback,
  isProcessing,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (items.length === 0) {
    return (
      <Card>
        <div className="p-6 text-center">
          <Text as="h2" variant="headingMd">
            No items to put back
          </Text>
          <p className="mt-2 text-gray-500">
            All surplus items have been put back.
          </p>
        </div>
      </Card>
    );
  }

  const currentItem = items[currentIndex];
  const totalItems = items.length;

  // Format bin name - if binName is the same as binId, show "Bin: [Short ID]" instead
  const formatBinName = (binId: string, binName: string) => {
    if (!binId) return "No bin specified";

    // If binName is the same as binId (or appears to be an ID), show a shortened version
    if (binName === binId || binName.length > 20) {
      return `Bin: ${binId.substring(binId.length - 6)}`;
    }

    return binName;
  };

  const handlePutback = async () => {
    setIsSubmitting(true);
    try {
      await onPutback(currentItem._id, currentItem.pendingQty);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      {/* 1. Top Navigation Row */}
      <div className="flex justify-between items-center px-6 py-4 border-b">
        <button
          onClick={onPrevious}
          disabled={currentIndex === 0 || isSubmitting || isProcessing}
          className={`p-3 rounded-full ${
            currentIndex === 0 || isSubmitting || isProcessing
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          aria-label="Previous item"
        >
          <Icon source={ArrowLeftIcon} />
        </button>

        <div className="font-medium text-gray-700">
          {currentIndex + 1} / {totalItems}
        </div>

        <button
          onClick={onNext}
          disabled={
            currentIndex === totalItems - 1 || isSubmitting || isProcessing
          }
          className={`p-3 rounded-full ${
            currentIndex === totalItems - 1 || isSubmitting || isProcessing
              ? "text-gray-300 cursor-not-allowed"
              : "text-gray-700 hover:bg-gray-100"
          }`}
          aria-label="Next item"
        >
          <Icon source={ArrowRightIcon} />
        </button>
      </div>

      {/* 2. Main Card Body */}
      <div className="p-6 border-b">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Product Image */}
          <div className="flex justify-center items-center">
            <div className="bg-gray-200 rounded-lg w-full h-64 flex items-center justify-center">
              {currentItem.image ? (
                <img
                  src={currentItem.image}
                  alt={currentItem.productName}
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <span className="text-gray-500">Product Image</span>
              )}
            </div>
          </div>

          {/* Right: Product Details */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold">{currentItem.productName}</h2>
              <p className="text-gray-600 mt-1">
                {currentItem.sku}{" "}
                {currentItem.variantId !== "Default"
                  ? `(${currentItem.variantId})`
                  : ""}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">To Putback</h3>
              <p className="text-lg font-semibold mt-1">
                {currentItem.pendingQty}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Bin</h3>
              <p className="text-lg font-semibold mt-1">
                {formatBinName(currentItem.binId, currentItem.binName)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500">Batch ID</h3>
              <p className="font-semibold mt-1 text-gray-700">
                {currentItem.batchName || currentItem.batchId}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer Section */}
      <div className="px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left: Read-only Quantity */}
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Putback Quantity
            </h3>
            <div className="mt-2 p-2 bg-gray-100 rounded border border-gray-200">
              <p className="text-lg font-medium">{currentItem.pendingQty}</p>
            </div>
          </div>

          {/* Right: Button */}
          <div className="flex items-end">
            <Button
              variant="primary"
              onClick={handlePutback}
              disabled={isSubmitting || isProcessing}
              loading={isSubmitting || isProcessing}
              className="w-full"
            >
              Mark as Put Back
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default PutbackCard;
