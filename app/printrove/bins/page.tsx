"use client";
import React, { useState, useEffect } from "react";
import { TextField, Select, Card, Text } from "@shopify/polaris";
import {
  EditIcon,
  SearchIcon,
  SortAscendingIcon,
  SortDescendingIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";
import GenericDataTable from "@/app/components/dataTable";
import { Button } from "@/app/components/Button";
import { IconButton } from "@/app/components/iconButton";
import { useBinStore } from "@/store/useBinStore";
import { format } from "date-fns";
import CreateBinModal from "./createBin";
import BinTransferModal from "./BinTransferModal";
import LocationHistoryView from "./LocationHistoryView";

interface BinWithUtilization {
  _id: string;
  name: string;
  category: string;
  capacity: number;
  currentQuantity: number;
  availableSpace: number;
  utilizationPercent: number;
  status: 'AVAILABLE' | 'WARNING' | 'FULL';
  createdAt: string;
  updatedAt: string;
}

export default function BinsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortDirection, setSortDirection] = useState<
    "ascending" | "descending"
  >("ascending");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showHistoryView, setShowHistoryView] = useState(false);
  const [editingBin, setEditingBin] = useState<{
    _id: string;
    name: string;
    category: string;
  } | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: string;
    productName: string;
  } | null>(null);
  const [binsWithUtilization, setBinsWithUtilization] = useState<BinWithUtilization[]>([]);
  const [productsWithStock, setProductsWithStock] = useState<Array<{
    productId: string;
    productName: string;
    totalStock: number;
    binCount: number;
  }>>([]);
  const itemsPerPage = 10;

  const { bins, total, isLoading, fetchBins, deleteBin } = useBinStore();

  useEffect(() => {
    fetchBins(currentPage, itemsPerPage);
    fetchBinsWithUtilization();
    fetchProductsWithStock();
  }, [currentPage, itemsPerPage]);

  const fetchBinsWithUtilization = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/inventory/bins/utilization/all');
      const data = await response.json();
      if (data.success) {
        setBinsWithUtilization(data.data);
      }
    } catch (error) {
      console.error('Error fetching bin utilization:', error);
    }
  };

  const fetchProductsWithStock = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/inventory/bins/products-with-stock');
      const data = await response.json();
      if (data.success) {
        setProductsWithStock(data.data);
      }
    } catch (error) {
      console.error('Error fetching products with stock:', error);
    }
  };

  const handleViewHistory = (productId: string, productName: string) => {
    setSelectedProduct({ productId, productName });
    setShowHistoryView(true);
  };

  const handleBackToBins = () => {
    setShowHistoryView(false);
    setSelectedProduct(null);
    // Refresh data when returning
    fetchBins(currentPage, itemsPerPage);
    fetchBinsWithUtilization();
    fetchProductsWithStock();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleSort = () => {
    setSortDirection(
      sortDirection === "ascending" ? "descending" : "ascending"
    );
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this bin?")) {
      try {
        await deleteBin(id);
      } catch (error) {
        console.error("Failed to delete bin:", error);
      }
    }
  };

  const handleEdit = (bin: { _id: string; name: string; category: string }) => {
    setEditingBin(bin);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBin(null); // Clear editing bin data when modal is closed
  };

  // Merge bins with utilization data
  const binsWithUtilData = bins.map(bin => {
    const utilData = binsWithUtilization.find(u => u._id === bin._id);
    return {
      ...bin,
      currentQuantity: utilData?.currentQuantity || 0,
      availableSpace: utilData?.availableSpace || bin.capacity || 0,
      utilizationPercent: utilData?.utilizationPercent || 0,
      status: utilData?.status || 'AVAILABLE',
    };
  });

  const filtered = binsWithUtilData.filter((bin) =>
    bin.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sorted = [...filtered].sort((a, b) => {
    const dateA = new Date(
      sortDirection === "ascending" ? a.createdAt : b.createdAt
    );
    const dateB = new Date(
      sortDirection === "ascending" ? b.createdAt : a.createdAt
    );
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="h-full p-8 bg-[#F5F5F5]">
      {/* Show Location History View or Bins List */}
      {showHistoryView && selectedProduct ? (
        <LocationHistoryView
          productId={selectedProduct.productId}
          productName={selectedProduct.productName}
          onBack={handleBackToBins}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-extrabold">Bins Management</h1>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                size="lg"
                className="flex items-center gap-2"
                onClick={() => setIsTransferModalOpen(true)}
              >
                🔄 Transfer Items
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex items-center gap-2"
                onClick={() => setIsModalOpen(true)}
              >
                + New Bin
              </Button>
            </div>
          </div>

      {/* Products with Stock Section */}
      <Card>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <Text variant="headingMd" as="h2">
              Products in Bins - Location History
            </Text>
            <Text variant="bodySm" tone="subdued">
              {productsWithStock.length} products with stock
            </Text>
          </div>
          
          {productsWithStock.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No products in bins yet</p>
              <p className="text-sm mt-1">Add stock via putaway to see products here</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productsWithStock.map((product) => (
                <div
                  key={product.productId}
                  onClick={() => handleViewHistory(product.productId, product.productName)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-indigo-500 hover:shadow-md cursor-pointer transition-all bg-white"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-gray-900 text-sm">
                      {product.productName}
                    </h3>
                    <span className="text-xs text-indigo-600 hover:text-indigo-800">
                      View History →
                    </span>
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    <div>
                      <span className="font-medium text-gray-900">{product.totalStock}</span> items
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{product.binCount}</span> bin(s)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      <div className="flex justify-between items-center mb-4 mt-8">
        <Text variant="headingMd" as="h2">
          All Bins
        </Text>
        <div className="flex gap-4 items-center">
          <div className="flex-1 max-w-[300px]">
            <TextField
              label=""
              placeholder="Search bins"
              value={searchQuery}
              onChange={handleSearchChange}
              prefix={<SearchIcon className="w-5 h-5 fill-gray-500" />}
              autoComplete="off"
            />
          </div>
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
        </div>
      </div>

      <Card>
        <GenericDataTable
          columnContentTypes={["text", "text", "text", "text", "text", "text", "text", "text"]}
          headings={[
            "S.NO",
            <div
              key="created-date"
              className="flex items-center gap-1 cursor-pointer"
              onClick={handleSort}
            >
              Created Date
              {sortDirection === "ascending" ? (
                <SortAscendingIcon className="w-4 h-4" />
              ) : (
                <SortDescendingIcon className="w-4 h-4" />
              )}
            </div>,
            "Name",
            "Category",
            "Utilization",
            "Stock",
            "Status",
            "Actions",
          ]}
          rows={sorted.map((bin, idx) => [
            (idx + 1).toString(),
            format(new Date(bin.createdAt), "dd MMM yyyy"),
            bin.name,
            bin.category,
            // Utilization progress bar
            <div key={`util-${bin._id}`} className="flex items-center gap-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5 max-w-[120px]">
                <div
                  className={`h-2.5 rounded-full transition-all ${
                    bin.status === 'FULL' ? 'bg-red-500' :
                    bin.status === 'WARNING' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(bin.utilizationPercent, 100)}%` }}
                />
              </div>
              <span className="text-sm font-medium whitespace-nowrap">
                {bin.utilizationPercent.toFixed(0)}%
              </span>
            </div>,
            // Stock info
            <div key={`stock-${bin._id}`} className="text-sm">
              <div className="font-medium">{bin.currentQuantity} / {bin.capacity}</div>
              <div className="text-gray-500 text-xs">{bin.availableSpace} free</div>
            </div>,
            // Status badge
            <span
              key={`status-${bin._id}`}
              className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                bin.status === 'FULL' ? 'bg-red-100 text-red-800' :
                bin.status === 'WARNING' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}
            >
              {bin.status}
            </span>,
            // Actions
            <div key={bin._id} className="flex gap-2">
              <IconButton
                icon={EditIcon}
                onClick={() => handleEdit(bin)}
                ariaLabel={`Edit ${bin.name}`}
              />
              <IconButton
                icon={DeleteIcon}
                onClick={() => handleDelete(bin._id)}
                ariaLabel={`Delete ${bin.name}`}
              />
            </div>,
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

          <CreateBinModal
            open={isModalOpen}
            onClose={handleCloseModal}
            editData={editingBin}
          />

          <BinTransferModal
            open={isTransferModalOpen}
            onClose={() => setIsTransferModalOpen(false)}
            onSuccess={() => {
              // Refresh bins list and utilization after successful transfer
              fetchBins(currentPage, itemsPerPage);
              fetchBinsWithUtilization();
              fetchProductsWithStock();
            }}
          />
        </>
      )}
    </div>
  );
}
