"use client";

import React, { useState, useEffect } from "react";
import { TextField, Select, Card } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { useOrderStore } from "@/store/useOrderStore";
import Link from "next/link";

export default function OrdersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const { orders, total, isLoading, fetchOrders } = useOrderStore();

  useEffect(() => {
    fetchOrders(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN");
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <b className="text-2xl font-extrabold">Orders</b>
      </div>

      <div className="flex justify-between items-center mt-4 mb-4">
        <Select
          label=""
          placeholder="Sort by date"
          value="date"
          options={[
            { label: "Sort by date", value: "date" },
            { label: "Newest First", value: "newest" },
            { label: "Oldest First", value: "oldest" },
          ]}
          onChange={() => {}}
        />
        <div className="flex-1 max-w-[40%]">
          <TextField
            label=""
            placeholder="Search orders"
            value={searchQuery}
            onChange={handleSearchChange}
            prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
            autoComplete="off"
          />
        </div>
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
            "text",
          ]}
          headings={[
            "Placed on",
            "Type",
            "Order ID",
            "Reference",
            "Merchant",
            "Customer Name",
            "Shipping Mode",
            "Tracking ID",
            "Status",
            "EDD",
          ]}
          rows={orders.map((order) => [
            formatDate(order?.createdAt),
            "RUSH", // Placeholder - Add type to order model if needed
            <Link
              href={`/printrove/production/orders/${order._id}`}
              className="text-[#005BD3] underline"
              key={order?.orderId}
            >
              {order?.orderId}
            </Link>,
            "REF123", // Placeholder - Add reference to order model if needed
            order?.merchant.name,
            order?.shippingAddress.fullName,
            "Standard", // Placeholder - Add shipping mode to order model if needed
            "TRK123", // Placeholder - Add tracking ID to order model if needed
            <span
              className={`px-2 py-1 rounded-full text-sm ${
                order?.orderStatus === "Created"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-green-100 text-green-800"
              }`}
            >
              {order?.orderStatus}
            </span>,
            formatDate(order?.createdAt), // Placeholder - Add EDD to order model if needed
          ])}
          pagination={{
            hasPrevious: currentPage > 1,
            hasNext: currentPage < Math.ceil(total / itemsPerPage),
            onPrevious: () => setCurrentPage(currentPage - 1),
            onNext: () => setCurrentPage(currentPage + 1),
            label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
              currentPage * itemsPerPage,
              total
            )} of ${total}`,
            totalCount: total,
          }}
        />
      </Card>

      {isLoading && <div>Loading...</div>}
    </div>
  );
}
