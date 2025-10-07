// TimelineAccordion component
import { OrderProduct } from "@/store/useOrderStore"; // Adjust the import path as needed
import { useState } from "react";

interface TimelineAccordionProps {
  id: string;
  title: string;
  product?: OrderProduct;
}

const TimelineAccordion: React.FC<TimelineAccordionProps> = ({
  id,
  title,
  product,
}) => {
  const [open, setOpen] = useState<boolean>(false);

  const toggleAccordion = () => {
    setOpen(!open);
  };

  // Format date helper
  const formatTimelineDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  return (
    <div className="border rounded-md">
      <button
        className="w-full flex items-center justify-between p-3 text-left"
        onClick={toggleAccordion}
      >
        <Text variant="bodyMd" fontWeight="medium">
          {title}
        </Text>
        <span className="transform transition-transform">
          {open ? <ChevronUpMinor /> : <ChevronDownMinor />}
        </span>
      </button>
      {open && (
        <div className="p-3 border-t bg-gray-50">
          {product &&
          product.auditEntries &&
          product.auditEntries.length > 0 ? (
            product.auditEntries.map((entry) => (
              <div key={entry.uid} className="mb-4">
                <Text variant="bodyMd" fontWeight="semibold" as="h4">
                  {entry.productName} - {entry.currentStatus}
                </Text>
                {entry.binNumber && (
                  <Text variant="bodySm" tone="subdued" as="p" className="mb-2">
                    Bin: {entry.binNumber}
                  </Text>
                )}

                <div className="ml-2 border-l-2 border-gray-300 pl-4 space-y-3 mt-2">
                  {entry.timeline.map((item, index) => (
                    <div key={index} className="relative pb-3">
                      <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-blue-500"></div>
                      <div>
                        <Text variant="bodyMd" as="p">
                          {item.message}
                        </Text>
                        <Text variant="bodySm" tone="subdued" as="p">
                          {formatTimelineDate(item.timestamp)} •{" "}
                          {item.changedBy}
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : product &&
            product.auditEntries &&
            product.auditEntries.length === 0 ? (
            <Text variant="bodySm" as="p" tone="subdued" alignment="center">
              No timeline entries available for this product.
            </Text>
          ) : (
            <Text variant="bodySm" as="p" tone="subdued" alignment="center">
              No timeline data available.
            </Text>
          )}
        </div>
      )}
    </div>
  );
};
