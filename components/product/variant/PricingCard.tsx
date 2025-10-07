import { Card, Text, TextField } from "@shopify/polaris";

interface PricingCardProps {
  pricingData: {
    price: string;
    compareAtPrice: string;
    costPerItem: string;
  };
  onPriceChange: (field: string, value: string) => void;
}

export function PricingCard({ pricingData, onPriceChange }: PricingCardProps) {
  const calculateProfit = (price: string, cost: string) => {
    const p = parseFloat(price || "0");
    const c = parseFloat(cost || "0");
    return p && c ? (p - c).toFixed(2) : "";
  };

  const calculateMargin = (price: string, cost: string) => {
    const p = parseFloat(price || "0");
    const c = parseFloat(cost || "0");
    return p && c ? (((p - c) / p) * 100).toFixed(2) : "";
  };

  const handlePriceChange = (field: string, value: string) => {
    onPriceChange(field, value);
  };

  return (
    <div className="mt-2">
      <Card>
        <div className="p-6">
          <Text variant="headingLg" as="h2">
            Pricing
          </Text>
          <div className="flex gap-4 mb-6">
            <div className="w-[40%]">
              <TextField
                label="Price"
                type="number"
                prefix="₹"
                value={pricingData?.price || ""}
                onChange={(value) => handlePriceChange("price", value)}
                autoComplete="off"
              />
            </div>
            <div className="w-[40%]">
              <TextField
                label="Compare at Price"
                type="number"
                prefix="₹"
                value={pricingData?.compareAtPrice || ""}
                onChange={(value) => handlePriceChange("compareAtPrice", value)}
                autoComplete="off"
              />
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-[30%]">
              <TextField
                label="Cost Per Item"
                type="number"
                prefix="₹"
                value={pricingData?.costPerItem || ""}
                onChange={(value) => handlePriceChange("costPerItem", value)}
                autoComplete="off"
              />
            </div>
            <div className="w-[30%]">
              <TextField
                label="Profit"
                type="number"
                prefix="₹"
                value={calculateProfit(
                  pricingData?.price,
                  pricingData?.costPerItem
                )}
                disabled
                readOnly
                autoComplete="off"
              />
            </div>
            <div className="w-[30%]">
              <TextField
                label="Margin"
                type="number"
                suffix="%"
                value={calculateMargin(
                  pricingData?.price,
                  pricingData?.costPerItem
                )}
                disabled
                readOnly
                autoComplete="off"
              />
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
