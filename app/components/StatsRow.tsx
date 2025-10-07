import { Select, Text, Icon } from "@shopify/polaris";
import {
  OrderIcon,
  OutboundIcon,
  IncomingIcon,
  InfoIcon,
  CheckIcon,
} from "@shopify/polaris-icons";
import { useState } from "react";

interface StatsRowProps {
  stats: {
    allOrders: number;
    fulfilled: number;
    inProduction: number;
    returnedItems: number;
    delivered: number;
  };
}

export function StatsRow({ stats }: StatsRowProps) {
  const [selected, setSelected] = useState("7");

  const handleSelectChange = (value: string) => {
    setSelected(value);
  };

  const selectOptions = [
    { label: "7 Days", value: "7" },
    { label: "30 Days", value: "30" },
    { label: "90 Days", value: "90" },
    { label: "180 Days", value: "180" },
    { label: "365 Days", value: "365" },
  ];

  return (
    <div className="flex gap-5 items-stretch">
      <div className="flex-1 bg-white rounded-lg border border-[#E3E3E3] p-4">
        <div className="grid grid-cols-[120px_1fr_1fr_1fr_1fr_1fr] gap-4">
          <div className="flex flex-col items-center border-r border-[#E3E3E3] pr-4">
            <div className="w-full [&_.Polaris-Select__Wrapper]:border-0 [&_.Polaris-Select__Input]:border-0 [&_.Polaris-Select__Content]:border-0 [&_.Polaris-Select__Backdrop]:border-0 [&_.Polaris-Select__Icon]:border-0">
              <Select
                label=""
                labelInline
                options={selectOptions}
                onChange={handleSelectChange}
                value={selected}
              />
            </div>
          </div>

          <div className="flex flex-col items-start border-r border-[#E3E3E3] pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon source={OrderIcon} />
              <Text variant="bodyMd" as="span">
                All Orders
              </Text>
            </div>
            <Text variant="headingXl" as="h2">
              {stats.allOrders}
            </Text>
          </div>

          <div className="flex flex-col items-start border-r border-[#E3E3E3] pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon source={OutboundIcon} />
              <Text variant="bodyMd" as="span">
                Fulfilled
              </Text>
            </div>
            <Text variant="headingXl" as="h2">
              {stats.fulfilled}
            </Text>
          </div>

          <div className="flex flex-col items-start border-r border-[#E3E3E3] pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon source={IncomingIcon} />
              <Text variant="bodyMd" as="span">
                In Production
              </Text>
            </div>
            <Text variant="headingXl" as="h2">
              {stats.inProduction}
            </Text>
          </div>

          <div className="flex flex-col items-start border-r border-[#E3E3E3] pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon source={InfoIcon} />
              <Text variant="bodyMd" as="span">
                Returned Items
              </Text>
            </div>
            <Text variant="headingXl" as="h2">
              {stats.returnedItems}
            </Text>
          </div>

          <div className="flex flex-col items-start">
            <div className="flex items-center gap-2 mb-2">
              <Icon source={CheckIcon} />
              <Text variant="bodyMd" as="span">
                Delivered
              </Text>
            </div>
            <Text variant="headingXl" as="h2">
              {stats.delivered}
            </Text>
          </div>
        </div>
      </div>
    </div>
  );
}
