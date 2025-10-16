"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/app/components/Button";
import { getApiBaseUrl } from "@/lib/apiUrl";

interface BinTransferModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface Bin {
  _id: string;
  name: string;
  category: string;
  capacity: number;
}

interface Product {
  _id: string;
  name: string;
  sku: string;
}

interface BinStock {
  binId: string;
  binName: string;
  quantity: number;
}

export default function BinTransferModal({
  open,
  onClose,
  onSuccess,
}: BinTransferModalProps) {
  const [formData, setFormData] = useState({
    productId: "",
    fromBinId: "",
    toBinId: "",
    quantity: 1,
    reason: "",
    transferredBy: "admin@printrove.com", // Could be from auth context
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [bins, setBins] = useState<Bin[]>([]);
  const [availableStock, setAvailableStock] = useState<number>(0);
  const [binStocks, setBinStocks] = useState<BinStock[]>([]);
  const [destCapacityInfo, setDestCapacityInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  // Fetch products and bins on mount
  useEffect(() => {
    if (open) {
      fetchProducts();
      fetchBins();
      // Reset form when modal opens
      setFormData({
        productId: "",
        fromBinId: "",
        toBinId: "",
        quantity: 1,
        reason: "",
        transferredBy: "admin@printrove.com",
      });
      setError("");
      setSuccessMessage("");
      setAvailableStock(0);
      setBinStocks([]);
      setDestCapacityInfo(null);
    }
  }, [open]);

  // Fetch bins containing selected product
  useEffect(() => {
    if (formData.productId) {
      fetchBinsForProduct(formData.productId);
    } else {
      setBinStocks([]);
      setAvailableStock(0);
    }
  }, [formData.productId]);

  // Fetch available stock when source bin is selected
  useEffect(() => {
    if (formData.fromBinId && binStocks.length > 0) {
      const stock = binStocks.find((s) => s.binId === formData.fromBinId);
      setAvailableStock(stock?.quantity || 0);
    } else {
      setAvailableStock(0);
    }
  }, [formData.fromBinId, binStocks]);

  // Check destination bin capacity
  useEffect(() => {
    if (formData.toBinId && formData.quantity > 0) {
      checkDestinationCapacity();
    } else {
      setDestCapacityInfo(null);
    }
  }, [formData.toBinId, formData.quantity]);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching products with stock...");
      
      // Use direct fetch to avoid CORS issues
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/inventory/bins/products-with-stock`);
      console.log("Response status:", response.status);
      
      const data = await response.json();
      console.log("Products with stock response:", data);
      
      if (data.success && data.data && data.data.length > 0) {
        const productData = data.data.map((p: any) => ({
          _id: p.productId,
          name: p.productName,
          sku: `${p.totalStock} items in ${p.binCount} bin(s)`,
        }));
        
        console.log("✅ Products available for transfer:", productData);
        setProducts(productData);
      } else {
        console.log("⚠️ No products with stock found");
        setProducts([]);
        setError("No products with stock in bins. Add stock via putaway first.");
      }
    } catch (error: any) {
      console.error("❌ Error fetching products:", error);
      setProducts([]);
      setError("Unable to load products. Ensure backend is running on port 5001.");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBins = async () => {
    try {
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/inventory/bins/all`);
      const data = await response.json();
      console.log("Bins response:", data);
      
      if (data.success) {
        setBins(data.data);
      }
    } catch (error) {
      console.error("Error fetching bins:", error);
    }
  };

  const fetchBinsForProduct = async (productId: string) => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/inventory/bins/product/${productId}`
      );
      const data = await response.json();
      console.log("Bins for product response:", data);
      
      if (data.success) {
        const stocks = data.data.map((bin: any) => ({
          binId: bin._id,
          binName: bin.name,
          quantity: bin.stockQty || 0,
        }));
        setBinStocks(stocks);
        console.log("✅ Found stock in bins:", stocks);
      }
    } catch (error) {
      console.error("Error fetching bins for product:", error);
      setBinStocks([]);
    }
  };

  const checkDestinationCapacity = async () => {
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/inventory/bins/${formData.toBinId}/validate-capacity`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: formData.quantity })
        }
      );
      const data = await response.json();
      console.log("Capacity validation:", data);
      
      if (data.success) {
        setDestCapacityInfo(data.data);
      }
    } catch (error: any) {
      console.error("Error checking capacity:", error);
      setDestCapacityInfo(null);
    }
  };

  const handleInputChange = useCallback(
    (field: string, value: any) => {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
      setError("");
    },
    []
  );

  const handleTransfer = async () => {
    // Validation
    if (!formData.productId) {
      setError("Please select a product");
      return;
    }
    if (!formData.fromBinId) {
      setError("Please select a source bin");
      return;
    }
    if (!formData.toBinId) {
      setError("Please select a destination bin");
      return;
    }
    if (formData.fromBinId === formData.toBinId) {
      setError("Source and destination bins must be different");
      return;
    }
    if (formData.quantity < 1) {
      setError("Quantity must be at least 1");
      return;
    }
    if (formData.quantity > availableStock) {
      setError(
        `Insufficient stock. Only ${availableStock} items available in source bin`
      );
      return;
    }
    if (!formData.reason.trim()) {
      setError("Please provide a reason for transfer");
      return;
    }

    setIsTransferring(true);
    setError("");

    try {
      console.log("Executing transfer with data:", formData);
      
      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/inventory/bin-transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      console.log("Transfer response:", data);

      if (data.success) {
        const fromBinName = bins.find((b) => b._id === formData.fromBinId)?.name || 'source bin';
        const toBinName = bins.find((b) => b._id === formData.toBinId)?.name || 'destination bin';
        
        setSuccessMessage(
          `✅ Transfer successful! ${formData.quantity} items moved from ${fromBinName} to ${toBinName}`
        );

        // Wait 2 seconds then close
        setTimeout(() => {
          if (onSuccess) onSuccess();
          onClose();
        }, 2000);
      } else {
        setError(data.message || "Transfer failed");
      }
    } catch (error: any) {
      console.error("Transfer error:", error);
      const errorMessage = error.message || "Transfer failed. Check console for details.";
      setError(errorMessage);
    } finally {
      setIsTransferring(false);
    }
  };

  const sourceBinOptions = binStocks.filter((s) => s.quantity > 0);
  const destBinOptions = bins.filter((b) => b._id !== formData.fromBinId);

  return (
    <Transition.Root show={open} as="div">
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as="div"
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as="div"
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-lg bg-white p-6 shadow-xl transition-all">
                <div className="flex justify-between items-center mb-6">
                  <Dialog.Title className="text-2xl font-semibold text-gray-900">
                    Bin-to-Bin Transfer
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                    disabled={isTransferring}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {successMessage && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-medium">{successMessage}</p>
                  </div>
                )}

                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                  </div>
                )}

                <div className="space-y-6">
                  {/* Product Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.productId}
                      onChange={(e) => handleInputChange("productId", e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-base"
                      disabled={isTransferring || isLoading}
                    >
                      <option value="">
                        {isLoading 
                          ? "Loading products..." 
                          : products.length === 0 
                          ? "No products available" 
                          : "Select a product..."}
                      </option>
                      {products.map((product) => (
                        <option key={product._id} value={product._id}>
                          {product.name} - {product.sku}
                        </option>
                      ))}
                    </select>
                    {products.length === 0 && !isLoading && (
                      <p className="mt-1 text-sm text-gray-500">
                        No products found. Add products via inventory management.
                      </p>
                    )}
                  </div>

                  {/* Source Bin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Bin (Source) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.fromBinId}
                      onChange={(e) => handleInputChange("fromBinId", e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-base"
                      disabled={isTransferring || !formData.productId}
                    >
                      <option value="">Select source bin...</option>
                      {sourceBinOptions.map((stock) => (
                        <option key={stock.binId} value={stock.binId}>
                          {stock.binName} - Available: {stock.quantity} items
                        </option>
                      ))}
                    </select>
                    {formData.productId && sourceBinOptions.length === 0 && (
                      <p className="mt-1 text-sm text-red-600">
                        No bins contain this product
                      </p>
                    )}
                  </div>

                  {/* Available Stock Display */}
                  {availableStock > 0 && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                      <p className="text-sm text-blue-800">
                        📦 <strong>Available in source bin:</strong> {availableStock}{" "}
                        items
                      </p>
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max={availableStock}
                      value={formData.quantity}
                      onChange={(e) =>
                        handleInputChange("quantity", parseInt(e.target.value) || 1)
                      }
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-base"
                      disabled={isTransferring || !formData.fromBinId}
                    />
                    {availableStock > 0 && (
                      <p className="mt-1 text-sm text-gray-500">
                        Maximum: {availableStock} items
                      </p>
                    )}
                  </div>

                  {/* Destination Bin */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      To Bin (Destination) <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.toBinId}
                      onChange={(e) => handleInputChange("toBinId", e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-base"
                      disabled={isTransferring || !formData.fromBinId}
                    >
                      <option value="">Select destination bin...</option>
                      {destBinOptions.map((bin) => (
                        <option key={bin._id} value={bin._id}>
                          {bin.name} - {bin.category} (Capacity: {bin.capacity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Destination Capacity Warning */}
                  {destCapacityInfo && (
                    <div
                      className={`p-3 rounded-md border ${
                        !destCapacityInfo.canAccommodate
                          ? "bg-red-50 border-red-200"
                          : destCapacityInfo.isWarning
                          ? "bg-yellow-50 border-yellow-200"
                          : "bg-green-50 border-green-200"
                      }`}
                    >
                      <p
                        className={`text-sm ${
                          !destCapacityInfo.canAccommodate
                            ? "text-red-800"
                            : destCapacityInfo.isWarning
                            ? "text-yellow-800"
                            : "text-green-800"
                        }`}
                      >
                        {!destCapacityInfo.canAccommodate ? "🚫 " : destCapacityInfo.isWarning ? "⚠️ " : "✅ "}
                        {destCapacityInfo.message ||
                          `Destination bin will be ${destCapacityInfo.utilization.toFixed(
                            1
                          )}% full`}
                      </p>
                    </div>
                  )}

                  {/* Reason */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Transfer <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.reason}
                      onChange={(e) => handleInputChange("reason", e.target.value)}
                      rows={3}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-2.5 px-3 text-base"
                      placeholder="E.g., Warehouse reorganization, consolidating stock, etc."
                      disabled={isTransferring}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex justify-end gap-4">
                  <Button
                    variant="secondary"
                    onClick={onClose}
                    disabled={isTransferring}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleTransfer}
                    disabled={
                      isTransferring ||
                      !formData.productId ||
                      !formData.fromBinId ||
                      !formData.toBinId ||
                      !formData.reason.trim() ||
                      (destCapacityInfo && !destCapacityInfo.canAccommodate)
                    }
                    className="px-6 py-2"
                  >
                    {isTransferring ? "Transferring..." : "Transfer Items"}
                  </Button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

