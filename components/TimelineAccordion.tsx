import React, { useState } from "react";
import { Text } from "@shopify/polaris";
import { format } from "date-fns";
import { OrderProduct } from "@/store/useOrderStore";

interface TimelineAccordionProps {
  id: string;
  title?: string;
  product?: OrderProduct;
}

const TimelineAccordion: React.FC<TimelineAccordionProps> = ({
  id,
  title,
  product,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  // Format date helper
  const formatTimelineDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy h:mm a");
    } catch (e) {
      return "Invalid date";
    }
  };

  // Get the UID from audit entries if available
  const uid = product?.auditEntries?.[0]?.uid || title || id;

  // Extract timeline entries from product if they exist
  const timelineEntries =
    product?.auditEntries?.flatMap((entry) =>
      entry.timeline.map((item) => ({
        message: item.message,
        timestamp: item.timestamp,
        action: item.action,
        entityType: item.entityType,
      }))
    ) || [];

  // Determine if a status should be green based on the message content
  const isCompletedStatus = (message: string, action: string): boolean => {
    const completedKeywords = [
      "fulfilled",
      "dispatched",
      "packed",
      "shipped",
      "completed",
    ];

    // Check if message contains any of the completed keywords
    const messageHasCompletedKeyword = completedKeywords.some((keyword) =>
      message.toLowerCase().includes(keyword)
    );

    // Check if action is a completion action
    const isCompletionAction = [
      "completed",
      "passed",
      "status_changed",
    ].includes(action);

    return messageHasCompletedKeyword || isCompletionAction;
  };

  return (
    <div className="mb-4 border border-gray-200 rounded">
      {/* Accordion Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer"
        onClick={toggleAccordion}
      >
        <Text variant="bodyMd" fontWeight="semibold" as="span">
          {uid}
        </Text>
        <div className="flex items-center">
          <svg
            className={`w-5 h-5 transform ${
              isExpanded ? "rotate-90" : ""
            } transition-transform`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            ></path>
          </svg>
        </div>
      </div>

      {/* Accordion Content */}
      {isExpanded && (
        <div className="px-4 py-3 bg-white">
          {timelineEntries.length > 0 ? (
            <div className="space-y-0">
              {timelineEntries.map((item, index) => (
                <div
                  key={index}
                  className="relative pt-2 pb-2 border-b border-gray-200 last:border-b-0"
                >
                  <div className="flex justify-between items-center">
                    {/* Status Dot */}
                    <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          isCompletedStatus(item.message, item.action)
                            ? "bg-green-500"
                            : "bg-gray-400"
                        }`}
                      ></div>
                    </div>

                    {/* Message and Date with h6-like styling */}
                    <div className="pl-4 flex-1">
                      <Text
                        variant="bodySm"
                        fontWeight="semibold"
                        as="h6"
                        className="text-sm font-semibold"
                      >
                        {item.message}
                      </Text>
                    </div>
                    <div className="ml-2">
                      <Text
                        variant="bodySm"
                        tone="subdued"
                        as="span"
                        className="text-sm whitespace-nowrap"
                      >
                        {formatTimelineDate(item.timestamp)}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Text variant="bodySm" as="p" tone="subdued">
              No timeline data available.
            </Text>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineAccordion;
