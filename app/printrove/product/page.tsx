"use client";
import React, { useState, useEffect } from "react";
import { TextField, Card, Checkbox } from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { Button } from "@/app/components/Button";
import { useProductStore } from "@/store/useProductStore";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const {
    variants,
    total,
    isLoading,
    fetchVariants,
    deleteProducts,
    isDeleting,
  } = useProductStore();

  useEffect(() => {
    fetchVariants(currentPage, itemsPerPage, searchQuery);
  }, [currentPage, itemsPerPage, searchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSelect = (productId: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.length === variants.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(variants.map((variant) => variant.productId));
    }
  };

  const handleCancelSelection = () => {
    setSelectedItems([]);
  };

  const handleDeleteSelected = async () => {
    if (!selectedItems.length) return;

    if (
      window.confirm(
        `Are you sure you want to delete ${selectedItems.length} item(s)?`
      )
    ) {
      const success = await deleteProducts(selectedItems);
      if (success) {
        setSelectedItems([]);
        // Optionally show a success toast/notification
      }
    }
  };

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-extrabold">Products</h1>
        <Button
          variant="primary"
          size="lg"
          className="flex items-center gap-2"
          onClick={() => router.push("/printrove/product/create")}
        >
          + New Product
        </Button>
      </div>

      <div className="flex justify-between items-center mb-4">
        {selectedItems.length > 0 ? (
          <div className="flex items-center gap-4 w-full bg-white p-4 rounded shadow">
            <Checkbox
              label={`${selectedItems.length} selected`}
              checked={selectedItems.length === variants.length}
              onChange={handleSelectAll}
            />
            <span className="text-gray-500">|</span>
            <Button
              variant="primary"
              onClick={handleDeleteSelected}
              className="flex items-center gap-2"
            >
              Delete
            </Button>
            <Button variant="primary" onClick={handleCancelSelection}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="flex-1 max-w-[40%]">
            <TextField
              label=""
              placeholder="Search products"
              value={searchQuery}
              onChange={handleSearchChange}
              prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
              autoComplete="off"
            />
          </div>
        )}
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={[
            "text", // Checkbox
            "text", // Product Number
            "text", // Image
            "text", // Product + Variant + SKU
            "text", // Description
            "numeric", // On Hand
            "numeric", // Committed
            "numeric", // Available
          ]}
          headings={[
            <Checkbox
              key="select-all"
              label=""
              checked={selectedItems.length === variants.length}
              onChange={handleSelectAll}
            />,
            "Product #",
            "Image",
            "Product",
            "Description",
            "On Hand",
            "Committed",
            "Available",
          ]}
          rows={variants.map((variant) => [
            <Checkbox
              key={`checkbox-${variant.productId}`}
              label=""
              checked={selectedItems.includes(variant.productId)}
              onChange={() => handleSelect(variant.productId)}
            />,
            <div
              key={`prod-${variant.productNumber}`}
              className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline"
              onClick={() =>
                router.push(`/printrove/product/${variant.productId}`)
              }
            >
              {variant.productNumber}
            </div>,
            <div
              key={`img-${variant.productId}`}
              className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden"
            >
              {variant.thumbnailUrl ? (
                <img
                  src={variant.thumbnailUrl}
                  alt={variant.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-400 text-xs">No image</span>
              )}
            </div>,
            <div key={`prod-${variant.productId}`} className="flex flex-col">
              <span className="font-medium">{`${variant.title} - ${variant.variantCombo}`}</span>
              <span className="text-sm text-gray-500">{`SKU: ${variant.sku}`}</span>
            </div>,
            <span className="text-sm text-gray-600">
              {variant.description}
            </span>,
            <div className="text-right">{variant.onHand}</div>,
            <div className="text-right">{variant.committed}</div>,
            <div className="text-right">{variant.available}</div>,
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
