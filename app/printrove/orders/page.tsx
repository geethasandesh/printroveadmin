"use client";

import { useEffect, useState } from "react";
import { Card, Text, Badge, Link } from "@shopify/polaris";
import axios from "axios";
import GenericDataTable from "@/app/components/dataTable";
import { formatDate } from "@/utils/dateFormatter";
import { useRouter } from "next/navigation";

interface Product {
  id: string;
  sku: string;
  variants: any[];
  qty: number;
  price: number;
  _id: string;
}

interface ShippingAddress {
  fullName: string;
  storeName: string;
  address1: string;
  address2: string;
  landmark: string;
  country: string;
  state: string;
  city: string;
  zip: string;
}

interface Merchant {
  id: string;
  name: string;
}

interface Order {
  _id: string;
  orderId: string;
  products: Product[];
  shippingAddress: ShippingAddress;
  merchant: Merchant;
  orderStatus: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OrdersResponse {
  success: boolean;
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const fetchOrders = async (page: number, limit: number, search?: string) => {
    setIsLoading(true);
    try {
      let url = `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
      }/order?page=${page}&limit=${limit}`;

      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }

      const response = await axios.get<OrdersResponse>(url, {
        headers: {
          "Content-Type": "application/json",
          // Add authorization header if needed
          // "Authorization": `Bearer ${token}`
        },
      });

      setOrders(response.data.data);
      setTotal(response.data.total);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<
      string,
      { tone: "success" | "warning" | "info" | "critical"; label: string }
    > = {
      Delivered: { tone: "success", label: "Delivered" },
      Shipped: { tone: "info", label: "Shipped" },
      "In Production": { tone: "warning", label: "In Production" },
      Created: { tone: "info", label: "Created" },
      Pending: { tone: "warning", label: "Pending" },
      Cancelled: { tone: "critical", label: "Cancelled" },
    };

    const config = statusConfig[status] || { tone: "warning", label: status };
    return <Badge tone={config.tone}>{config.label}</Badge>;
  };

  // Function to get product summary (first product + count if multiple)
  const getProductSummary = (products: Product[]) => {
    if (products.length === 0) return "No products";
    if (products.length === 1) return products[0].sku;
    return `${products[0].sku} + ${products.length - 1} more`;
  };

  // Calculate total order value
  const calculateOrderValue = (products: Product[]) => {
    return products.reduce(
      (total, product) => total + product.price * product.qty,
      0
    );
  };

  const handleOrderClick = (orderId: string) => {
    router.push(`/printrove/orders/details/${orderId}`);
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <Text variant="headingLg" as="h1">
          Manage Orders
        </Text>
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text", // Order ID
            "text", // Date
            "text", // Products
            "text", // Customer
            "numeric", // Value
            "text", // Merchant
            "text", // Status
          ]}
          headings={[
            "Order ID",
            "Date",
            "Products",
            "Customer",
            "Value",
            "Merchant",
            "Status",
          ]}
          rows={orders.map((order) => [
            <Link
              key={order._id}
              url={`/printrove/orders/details/${order._id}`}
              onClick={() => {
                // Prevent default navigation by returning false
                // and handle navigation programmatically
                handleOrderClick(order._id);
                return false;
              }}
            >
              {order.orderId}
            </Link>,
            formatDate(order.createdAt),
            getProductSummary(order.products),
            order.shippingAddress.fullName,
            `$${calculateOrderValue(order.products).toFixed(2)}`,
            order.merchant.name,
            getStatusBadge(order.orderStatus),
          ])}
          pagination={{
            hasNext: currentPage < Math.ceil(total / itemsPerPage),
            hasPrevious: currentPage > 1,
            onNext: () => setCurrentPage((prev) => prev + 1),
            onPrevious: () => setCurrentPage((prev) => prev - 1),
            label: `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(
              currentPage * itemsPerPage,
              total
            )} of ${total}`,
            totalCount: total,
          }}
        />
      </Card>
    </div>
  );
}
