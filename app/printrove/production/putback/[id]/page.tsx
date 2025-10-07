"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Page, Banner, Toast } from "@shopify/polaris";
import PutbackCard from "@/app/components/PutbackCard";
import { usePutbackStore } from "@/store/usePutbackStore";
import { useBinStore } from "@/store/useBinStore"; // Add this import

export default function PutbackCarouselPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id: pickingId } = params;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [toastActive, setToastActive] = useState(false);
  const [toastMessage, setToastMessage] = useState({
    content: "",
    error: false,
  });
  const [binNames, setBinNames] = useState<Record<string, string>>({});

  const {
    currentPutbackItems,
    isLoading,
    isProcessing,
    error,
    getPutbackDetailsByPickingId,
    performPutback,
    clearError,
  } = usePutbackStore();

  // Add this to get bin details
  const { getBinDetails } = useBinStore();

  // Prepare transformed items for the card component
  const [cardItems, setCardItems] = useState<any[]>([]);

  // Load the batch details when the page loads
  useEffect(() => {
    getPutbackDetailsByPickingId(pickingId);
  }, [pickingId, getPutbackDetailsByPickingId]);

  // Fetch bin names for all bins
  useEffect(() => {
    if (currentPutbackItems && currentPutbackItems.length > 0) {
      // Collect all unique bin IDs
      const binIds = new Set<string>();
      currentPutbackItems.forEach((item) => {
        if (item.binId) binIds.add(item.binId);
      });

      // Fetch bin names for each bin ID
      const fetchBinNames = async () => {
        const nameMap: Record<string, string> = {};

        for (const binId of binIds) {
          try {
            const binDetails = await getBinDetails(binId);
            if (binDetails && binDetails.name) {
              nameMap[binId] = binDetails.name;
            }
          } catch (error) {
            console.error(`Error fetching bin details for ${binId}:`, error);
          }
        }

        setBinNames(nameMap);
      };

      fetchBinNames();
    }
  }, [currentPutbackItems, getBinDetails]);

  // Transform the putback items for the card component
  useEffect(() => {
    if (currentPutbackItems && currentPutbackItems.length > 0) {
      // Filter only items that still have pending quantities
      const itemsWithPending = currentPutbackItems.filter(
        (item) => item.pendingQty > 0
      );

      // Map to the format expected by PutbackCard
      const transformedItems = itemsWithPending.map((item) => ({
        _id: item._id,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        variantId: item.variantId,
        surplusQty: item.surplusQty,
        pendingQty: item.pendingQty,
        binId: item.binId || "default",
        // Use the fetched bin name if available, otherwise use a formatted version of binId
        binName: item.binName,
        batchId: pickingId,
        batchName: item.batchName,
        image: undefined, // You can add image URLs here if available
      }));

      setCardItems(transformedItems);

      // Reset current index if it's now out of bounds
      if (
        currentIndex >= transformedItems.length &&
        transformedItems.length > 0
      ) {
        setCurrentIndex(transformedItems.length - 1);
      }
    }
  }, [currentPutbackItems, pickingId, currentIndex, binNames]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < cardItems.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const showToast = (content: string, error: boolean = false) => {
    setToastMessage({ content, error });
    setToastActive(true);
    setTimeout(() => setToastActive(false), 5000);
  };

  const handlePutback = async (itemId: string, quantity: number) => {
    const item = cardItems.find((item) => item._id === itemId);
    if (!item) return;

    try {
      const result = await performPutback(pickingId, [
        {
          productId: item.productId,
          binId: item.binId,
          quantity: quantity,
          surplusId: itemId,
        },
      ]);

      if (result.success) {
        showToast(
          `Successfully put back ${quantity} units to ${
            binNames[item.binId] || "bin"
          }`,
          false
        );

        // If all items have been put back, go back to the putback list
        if (cardItems.length === 1) {
          setTimeout(() => {
            router.push("/printrove/production/putback");
          }, 1500);
          return;
        }

        // If the current item was the last one, go to the previous item
        if (currentIndex === cardItems.length - 1 && currentIndex > 0) {
          setCurrentIndex(currentIndex - 1);
        }
      } else {
        showToast(result.message || "Failed to perform putback", true);
      }
    } catch (error: any) {
      showToast("An error occurred while processing the putback", true);
    }
  };

  const handleBack = () => {
    router.push("/printrove/production/putback");
  };

  if (isLoading) {
    return (
      <Page title="Loading Putback Details...">
        <div className="h-48 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </Page>
    );
  }

  const batchName =
    currentPutbackItems && currentPutbackItems.length > 0
      ? currentPutbackItems[0].batchName || "Putback Details"
      : "Putback Details";

  return (
    <Page
      title={`Putback for ${batchName}`}
      backAction={{ content: "Back to Putback List", onAction: handleBack }}
    >
      <div className="space-y-6">
        {error && (
          <Banner tone="critical" title="Error" onDismiss={() => clearError()}>
            {error}
          </Banner>
        )}

        {cardItems.length === 0 && !isLoading && (
          <Banner tone="success">
            All items have been successfully put back. You can return to the
            putback list.
          </Banner>
        )}

        <PutbackCard
          items={cardItems}
          currentIndex={currentIndex}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onPutback={handlePutback}
          isProcessing={isProcessing}
        />
      </div>

      {toastActive && (
        <Toast
          content={toastMessage.content}
          error={toastMessage.error}
          onDismiss={() => setToastActive(false)}
        />
      )}
    </Page>
  );
}
