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
  // Profit and margin fields removed from UI

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
          {/* Cost Per Item, Profit, and Margin fields removed */}
        </div>
      </Card>
    </div>
  );
}
