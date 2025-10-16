"use client";

import { useState, useEffect } from "react";
import { Card, Text, Select, TextField, Button, Badge } from "@shopify/polaris";
import { format } from "date-fns";
import { getApiBaseUrl } from "../../../lib/apiUrl";

interface LocationHistoryViewProps {
  productId: string;
  productName: string;
  onBack: () => void;
}

interface HistoryItem {
  _id: string;
  productId: string;
  productName: string;
  binId: string;
  binName: string;
  action: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  notes?: string;
  performedBy: string;
  performedAt: string;
}

export default function LocationHistoryView({ 
  productId, 
  productName,
  onBack 
}: LocationHistoryViewProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    action: "",
    referenceType: "",
    startDate: "",
    endDate: "",
  });
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    if (productId) {
      fetchHistory();
    }
  }, [productId, page]);

  const fetchHistory = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (filters.action) params.append("action", filters.action);
      if (filters.referenceType) params.append("referenceType", filters.referenceType);
      if (filters.startDate) params.append("startDate", filters.startDate);
      if (filters.endDate) params.append("endDate", filters.endDate);

      const response = await fetch(
        `${getApiBaseUrl()}/api/inventory/bin-transfers/location-history/${productId}?${params}`
      );
      const data = await response.json();

      console.log("Location history response:", data);

      if (data.success) {
        setHistory(data.history || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error("Error fetching location history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchHistory();
  };

  const handleClearFilters = () => {
    setFilters({
      action: "",
      referenceType: "",
      startDate: "",
      endDate: "",
    });
    setPage(1);
    setTimeout(() => fetchHistory(), 100);
  };

  const getActionBadge = (action: string) => {
    const tones: Record<string, any> = {
      IN: "success",
      OUT: "info",
      TRANSFER_IN: "success",
      TRANSFER_OUT: "warning",
      ADJUSTMENT: "attention",
    };

    return <Badge tone={tones[action] || "info"}>{action}</Badge>;
  };

  const getReferenceTypeBadge = (refType: string) => {
    const tones: Record<string, any> = {
      PUTAWAY: "info",
      TRANSFER: "warning",
      PICKING: "critical",
      ADJUSTMENT: "attention",
    };

    return <Badge tone={tones[refType] || "info"}>{refType}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="plain">
          ← Back to Bins
        </Button>
        <div className="flex-1">
          <Text variant="headingLg" as="h2">
            Location History
          </Text>
          <Text variant="bodyMd" as="p" tone="subdued">
            Product: {productName}
          </Text>
        </div>
        <div className="text-sm text-gray-500">
          Total Movements: {total}
        </div>
      </div>

      {/* Filters Card */}
      <Card>
        <div className="p-6">
          <Text variant="headingMd" as="h3">
            Filters
          </Text>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Select
                label="Action Type"
                options={[
                  { label: "All Actions", value: "" },
                  { label: "IN", value: "IN" },
                  { label: "OUT", value: "OUT" },
                  { label: "TRANSFER IN", value: "TRANSFER_IN" },
                  { label: "TRANSFER OUT", value: "TRANSFER_OUT" },
                  { label: "ADJUSTMENT", value: "ADJUSTMENT" },
                ]}
                value={filters.action}
                onChange={(value) => setFilters({ ...filters, action: value })}
              />
            </div>

            <div>
              <Select
                label="Reference Type"
                options={[
                  { label: "All Types", value: "" },
                  { label: "Putaway", value: "PUTAWAY" },
                  { label: "Transfer", value: "TRANSFER" },
                  { label: "Picking", value: "PICKING" },
                  { label: "Adjustment", value: "ADJUSTMENT" },
                ]}
                value={filters.referenceType}
                onChange={(value) => setFilters({ ...filters, referenceType: value })}
              />
            </div>

            <div>
              <TextField
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(value) => setFilters({ ...filters, startDate: value })}
                autoComplete="off"
              />
            </div>

            <div>
              <TextField
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(value) => setFilters({ ...filters, endDate: value })}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <Button onClick={handleApplyFilters}>Apply Filters</Button>
            <Button onClick={handleClearFilters} variant="plain">
              Clear Filters
            </Button>
            <Button onClick={fetchHistory} variant="plain">
              Refresh
            </Button>
          </div>
        </div>
      </Card>

      {/* History Table Card */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date/Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Quantity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reference ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Performed By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                      <span className="text-sm text-gray-500">Loading history...</span>
                    </div>
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="text-gray-400 text-5xl mb-3">📦</div>
                    <p className="text-sm text-gray-500 mb-2">
                      No location history found for this product.
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      History will appear here after putaway, transfers, or picking operations.
                    </p>
                    <Button onClick={fetchHistory} size="slim" variant="plain">
                      Refresh to Check Again
                    </Button>
                  </td>
                </tr>
              ) : (
                history.map((item) => (
                  <tr key={item._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(new Date(item.performedAt), "MMM dd, yyyy HH:mm")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.binName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getActionBadge(item.action)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getReferenceTypeBadge(item.referenceType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-mono">
                      {item.referenceId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.performedBy}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div className="max-w-xs truncate" title={item.notes || ""}>
                        {item.notes || "-"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} movements
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                size="slim"
              >
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page * limit >= total}
                size="slim"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="p-4">
            <Text variant="headingSm" as="h4" tone="subdued">
              Total Movements
            </Text>
            <Text variant="heading2xl" as="p">
              {total}
            </Text>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <Text variant="headingSm" as="h4" tone="subdued">
              Bins Used
            </Text>
            <Text variant="heading2xl" as="p">
              {new Set(history.map((h) => h.binId)).size}
            </Text>
          </div>
        </Card>

        <Card>
          <div className="p-4">
            <Text variant="headingSm" as="h4" tone="subdued">
              Total Quantity Moved
            </Text>
            <Text variant="heading2xl" as="p">
              {history.reduce((sum, h) => {
                return h.action.includes('IN') ? sum + h.quantity : sum;
              }, 0)}
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
}

