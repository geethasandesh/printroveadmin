import React, { useState } from 'react';
import {
  Card,
  Button,
  Badge,
  Banner,
  Text,
  Spinner,
  DataTable
} from "@shopify/polaris";
import { usePickingStore } from "@/store/usePickingStore";

interface AutoPickingPanelProps {
  pickingId: string;
}

const AutoPickingPolarisPanel: React.FC<AutoPickingPanelProps> = ({ pickingId }) => {
  const {
    stockAvailability,
    isCheckingStock,
    isAutoPicking,
    autoPickResult,
    checkStockAvailability,
    autoPickProducts,
  } = usePickingStore();

  const [showStockDetails, setShowStockDetails] = useState(false);

  const handleCheckStock = async () => {
    await checkStockAvailability(pickingId);
    setShowStockDetails(true);
  };

  const handleAutoPick = async () => {
    await autoPickProducts(pickingId);
  };

  return (
    <div>
      {stockAvailability && (
        <>
          <Banner
            title={stockAvailability.canFulfill ? "Stock Available" : "Insufficient Stock"}
            status={stockAvailability.canFulfill ? "success" : "warning"}
          >
            <p>
              {stockAvailability.canFulfill
                ? "All products have sufficient stock for this picking"
                : "Some products have insufficient stock. Review details below."}
            </p>
          </Banner>

          {showStockDetails && stockAvailability.stockStatus && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <Text variant="headingMd">Stock Details</Text>
                <Button onClick={() => setShowStockDetails(false)}>
                  Hide Details
                </Button>
              </div>
              <DataTable
                columnContentTypes={["text", "text", "numeric", "numeric", "text"]}
                headings={["Product", "Variant", "Required", "Available", "Status"]}
                rows={stockAvailability.stockStatus.map(item => [
                  item.productName,
                  item.variant,
                  item.required,
                  item.available,
                  item.isFullyAvailable ? (
                    <Badge status="success">Sufficient</Badge>
                  ) : (
                    <Badge status="critical">Insufficient</Badge>
                  )
                ])}
              />
            </div>
          )}
        </>
      )}

      {autoPickResult && (
        <div className="mt-4">
          <Banner
            title={autoPickResult.success ? "Auto-Picking Complete" : "Auto-Picking Failed"}
            status={autoPickResult.success ? "success" : "critical"}
          >
            <p>{autoPickResult.message}</p>
          </Banner>
        </div>
      )}

      <div className="flex justify-between mt-6">
        <Button 
          onClick={handleCheckStock} 
          loading={isCheckingStock}
        >
          Check Stock Availability
        </Button>
        <Button
          primary
          onClick={handleAutoPick}
          disabled={
            isAutoPicking ||
            (stockAvailability && !stockAvailability.canFulfill)
          }
          loading={isAutoPicking}
        >
          Auto-Pick Products
        </Button>
      </div>
    </div>
  );
};

export default AutoPickingPolarisPanel;
