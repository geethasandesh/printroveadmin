"use client";

import {
  Card,
  Text,
  TextField,
  Select,
  Badge,
  Icon,
  DropZone,
  Button,
} from "@shopify/polaris";
import { SearchIcon } from "@shopify/polaris-icons";
import { useState, useEffect, useCallback } from "react";
import { UploadedImage, uploadToS3 } from "@/utils/s3Upload";
import { PricingCard } from "@/components/product/variant/PricingCard";
import { VariantSidebar } from "@/components/product/variant/VariantSidebar";
import { debounce } from "lodash";

interface VariantConfig {
  name: string;
  values: string[];
}

interface PrintConfig {
  _id?: string;
  name: string;
  options: string[];
  status: string;
}

interface ProductData {
  title: string;
  description: string;
  status: string;
  collections: string[];
  printTypes: string[];
  variants: VariantConfig[];
  avgLeadTime: string;
  avgDailyUsage: string;
  additionalInfo: string;
  printConfigs: PrintConfig[];
  // map of printConfigId (or name) -> selected option values
  printOptions?: Record<string, string[]>;
}

interface PrintLocation {
  location: string;
  basePrice: string;
  fontRate: string;
  boundingBox: {
    width: string;
    height: string;
    top: string;
    left: string;
  };
  gridlines?: Array<{ key: string; url: string }>;
}

interface SelectedPrintConfig {
  [key: string]: PrintLocation;
}

interface InventoryData {
  sku: string;
  zohoItemId: string;
  location: {
    name: string;
    unavailable: number;
    committed: number;
    available: number;
    onHand: number;
  };
}

interface ShippingData {
  productWeight: string;
  shippingWeight: string;
}

interface CompleteVariantData {
  combination: string;
  values: { name: string; value: string }[];
  thumbnails: Array<{ key: string; url: string }>;
  pricing: {
    price: string;
    compareAtPrice: string;
    costPerItem: string;
  };
  printConfigurations: Array<{
    name: string;
    locations: Array<{
      location: string;
      basePrice: string;
      fontRate: string;
      boundingBox: {
        width: string;
        height: string;
        top: string;
        left: string;
      };
      gridlines?: Array<{ key: string; url: string }>;
    }>;
  }>;
  inventory: InventoryData;
  shipping: ShippingData;
}

interface VariantConfigProps {
  productData: ProductData;
  mockupFiles: UploadedImage[];
  thumbnailFiles: UploadedImage[];
  onBackAction: () => void;
  onSaveAction: (data: any) => void;
  existingVariantData?: any;
  onDataChangeAction?: (data: any) => void;
}

const generateCombinations = (variants: VariantConfig[]): Map<string, string[]> => {
  if (variants.length === 0) return new Map();

  const groups = new Map<string, string[]>();
  
  // Generate all possible combinations
  const generate = (index: number, current: string[]) => {
    if (index === variants.length) {
      const combination = current.join(' - ');
      groups.set(combination, [...current]);
      return;
    }
    
    variants[index].values.forEach(value => {
      generate(index + 1, [...current, value]);
    });
  };
  
  generate(0, []);
  return groups;
};

export function VariantConfig({
  productData,
  mockupFiles,
  thumbnailFiles,
  onBackAction,
  onSaveAction,
  existingVariantData,
  onDataChangeAction,
}: VariantConfigProps) {
  
  // Compute variant groups
  const variantGroups = productData?.variants
    ? generateCombinations(productData.variants)
    : new Map<string, string[]>();
  // Initialize selected combination to first available
  const initialCombination =
    variantGroups.size > 0
      ? (variantGroups.values().next().value?.[0] || null)
      : null;
  const [selectedCombination, setSelectedCombination] = useState<string | null>(
    initialCombination
  );
  const [pricingData, setPricingData] = useState({
    price: "",
    compareAtPrice: "",
    costPerItem: "",
  });
  const [printLocations, setPrintLocations] = useState<SelectedPrintConfig>({});
  const [inventoryData, setInventoryData] = useState<InventoryData>({
    sku: "",
    zohoItemId: "",
    location: {
      name: "Default",
      unavailable: 0,
      committed: 0,
      available: 0,
      onHand: 0,
    },
  });
  const [shippingData, setShippingData] = useState<ShippingData>({
    productWeight: "",
    shippingWeight: "",
  });
  const [variantData, setVariantData] = useState<{
    [key: string]: CompleteVariantData;
  }>({});
  const [uploadedImages, setUploadedImages] = useState<{
    [key: string]: {
      thumbnails: Array<{ key: string; url: string; signedUrl?: string }>;
    };
  }>({});

  // Parse selected combination into individual variant values
  const getVariantValues = useCallback((combination: string) => {
    if (!combination) return [];
    return combination.split(" - ").map((value) => value.trim());
  }, []);


  // Helper function to get default bounding box values based on garment type and location
  const getDefaultBoundingBox = useCallback((garmentType: string, location: string) => {
    const defaults = {
      't-shirt': {
        'Front': { width: '13', height: '17', top: '3', left: '2' },
        'Back': { width: '13', height: '17', top: '3', left: '2' },
        'Sleeve': { width: '6', height: '8', top: '2', left: '1' }
      },
      'polo': {
        'Front': { width: '11', height: '15', top: '3', left: '2' },
        'Back': { width: '11', height: '15', top: '3', left: '2' },
        'Sleeve': { width: '5', height: '7', top: '2', left: '1' }
      },
      'sweatshirt': {
        'Front': { width: '12', height: '16', top: '3', left: '2' },
        'Back': { width: '12', height: '16', top: '3', left: '2' },
        'Sleeve': { width: '6', height: '8', top: '2', left: '1' }
      },
      'hoodie': {
        'Front': { width: '12', height: '16', top: '3', left: '2' },
        'Back': { width: '12', height: '16', top: '3', left: '2' },
        'Sleeve': { width: '6', height: '8', top: '2', left: '1' }
      }
    };

    // Determine garment type from product title - with safe fallback
    const title = (productData && typeof productData.title === 'string') ? productData.title.toLowerCase() : '';
    let type = 't-shirt';
    if (title.includes('polo')) type = 'polo';
    else if (title.includes('sweat') || title.includes('hoodie')) type = 'sweatshirt';

    return (defaults as any)[type]?.[location] || defaults['t-shirt']['Front'];
  }, [productData]);

  // Helper function to validate bounding box dimensions
  const validateBoundingBox = useCallback((boundingBox: any, location: string) => {
    const width = parseFloat(boundingBox.width || '0');
    const height = parseFloat(boundingBox.height || '0');
    const top = parseFloat(boundingBox.top || '0');
    const left = parseFloat(boundingBox.left || '0');

    const errors = [];

    // Basic validation
    if (width <= 0) errors.push('Width must be greater than 0');
    if (height <= 0) errors.push('Height must be greater than 0');
    if (top < 0) errors.push('Top position cannot be negative');
    if (left < 0) errors.push('Left position cannot be negative');

    // Reasonable size limits
    if (width > 20) errors.push('Width seems too large (>20 inches)');
    if (height > 25) errors.push('Height seems too large (>25 inches)');

    // Minimum margins from edges
    if (top < 1) errors.push('Top position should be at least 1" from collar');
    if (left < 1) errors.push('Left position should be at least 1" from edge');

    return errors;
  }, []);

  // Save current variant data to the main state
  const saveCurrentVariantData = useCallback(() => {
    if (!selectedCombination) return;

    // Group print locations by print config name
    const groupedPrintConfigs: Record<string, any[]> = {};
    Object.entries(printLocations).forEach(([key, location]) => {
      const [printConfigName, locationName] = key.split('-');
      if (!groupedPrintConfigs[printConfigName]) {
        groupedPrintConfigs[printConfigName] = [];
      }
      groupedPrintConfigs[printConfigName].push({
        location: locationName,
        basePrice: location.basePrice || "",
        fontRate: location.fontRate || "",
        boundingBox: location.boundingBox,
        gridlines: location.gridlines || [],
      });
    });

    const currentData: CompleteVariantData = {
      combination: selectedCombination,
      values: getVariantValues(selectedCombination).map((value, index) => ({
        name: productData.variants[index]?.name || `Variant ${index + 1}`,
        value,
      })),
      thumbnails: uploadedImages[selectedCombination]?.thumbnails || [],
      pricing: pricingData,
      printConfigurations: Object.entries(groupedPrintConfigs).map(([printConfigName, locations]) => ({
        name: printConfigName,
        locations: locations,
      })),
      inventory: {
        sku: inventoryData.sku || "",
        zohoItemId: inventoryData.zohoItemId || "",
        location: inventoryData.location || { name: "Default", unavailable: 0, committed: 0, available: 0, onHand: 0 },
      },
      shipping: {
        productWeight: shippingData.productWeight || "",
        shippingWeight: shippingData.shippingWeight || "",
      },
    };

    console.log('Saving variant data for:', selectedCombination, currentData);
    setVariantData(prev => ({
      ...prev,
      [selectedCombination]: currentData,
    }));

    // Notify parent component of data changes
    if (onDataChangeAction) {
      const updatedData = {
        ...variantData,
        [selectedCombination]: currentData,
      };
      onDataChangeAction(updatedData);
    }
  }, [
    selectedCombination,
    getVariantValues,
    productData.variants,
    uploadedImages,
    pricingData,
    printLocations,
    inventoryData,
    shippingData,
    variantData,
    onDataChangeAction,
  ]);

  // Load existing variant data when combination changes
  useEffect(() => {
    if (selectedCombination && variantData[selectedCombination]) {
      const currentVariantData = variantData[selectedCombination];
      const locations: SelectedPrintConfig = {};

      currentVariantData.printConfigurations?.forEach((printConfig) => {
        printConfig.locations?.forEach((location) => {
          const key = `${printConfig.name}-${location.location}`;
          locations[key] = {
            location: location.location,
            basePrice: location.basePrice || "",
            fontRate: location.fontRate || "",
            boundingBox: {
              width: location.boundingBox?.width || "",
              height: location.boundingBox?.height || "",
              top: location.boundingBox?.top || "",
              left: location.boundingBox?.left || "",
            },
            gridlines: location.gridlines || [],
          };
        });
      });

      setPrintLocations(locations);

      if (currentVariantData.pricing) {
        setPricingData(currentVariantData.pricing);
      }
      if (currentVariantData.inventory) {
        setInventoryData(currentVariantData.inventory);
      }
      if (currentVariantData.shipping) {
        setShippingData(currentVariantData.shipping);
      }
      if (currentVariantData.thumbnails) {
        setUploadedImages((prev) => ({
          ...prev,
          [selectedCombination]: {
            thumbnails: currentVariantData.thumbnails,
          },
        }));
      }
    } else {
      // Reset to default state if no data for selected combination
      setPricingData({ price: "", compareAtPrice: "", costPerItem: "" });
      setInventoryData({
        sku: "",
        zohoItemId: "",
        location: {
          name: "Default",
          unavailable: 0,
          committed: 0,
          available: 0,
          onHand: 0,
        },
      });
      setShippingData({ productWeight: "", shippingWeight: "" });
      setPrintLocations({});
    }
  }, [selectedCombination, variantData]);

  // Auto-save current variant data when it changes
  useEffect(() => {
    if (selectedCombination) {
      console.log('Auto-save triggered for:', selectedCombination, pricingData);
      const timeoutId = setTimeout(() => {
        saveCurrentVariantData();
      }, 1000); // Debounce auto-save

      return () => clearTimeout(timeoutId);
    }
  }, [
    pricingData,
    inventoryData,
    shippingData,
    printLocations,
    uploadedImages,
    selectedCombination,
    saveCurrentVariantData,
  ]);

  const handleSave = useCallback(async () => {
    // Save current variant data before final save
    saveCurrentVariantData();

    // Create updated variant data that includes current pricing
    const updatedVariantData = {
      ...variantData,
      ...(selectedCombination && {
        [selectedCombination]: {
          ...variantData[selectedCombination],
          pricing: pricingData
        }
      })
    };

    // Pricing is optional at creation; we'll allow empty/zero pricing and proceed

    // Print location pricing is optional; continue even if missing

    // Ensure all combinations are generated before save
    const allCombinationsList: string[] = Array.from(variantGroups.values()).flat();

    // Helper to build default variant data for combinations not yet visited
    const buildDefaultVariantData = (combination: string): CompleteVariantData => {
      const valuesArr = getVariantValues(combination);
      const autoSku = generateSKU(valuesArr);

      // Determine print locations to use based on selection or config defaults
      const printConfigs = (productData.printConfigs || []).map((printConfig) => {
        const key = printConfig._id || printConfig.name;
        const selectedOptions = productData.printOptions?.[key];
        const locationsToUse = selectedOptions && selectedOptions.length > 0
          ? selectedOptions
          : (printConfig.options || []);

        return {
          name: printConfig.name,
          locations: locationsToUse.map((location) => ({
            location,
            basePrice: printLocations[`${printConfig.name}-${location}`]?.basePrice || "",
            fontRate: printLocations[`${printConfig.name}-${location}`]?.fontRate || "",
            boundingBox: {
              width: printLocations[`${printConfig.name}-${location}`]?.boundingBox?.width || "",
              height: printLocations[`${printConfig.name}-${location}`]?.boundingBox?.height || "",
              top: printLocations[`${printConfig.name}-${location}`]?.boundingBox?.top || "",
              left: printLocations[`${printConfig.name}-${location}`]?.boundingBox?.left || "",
            },
            gridlines: printLocations[`${printConfig.name}-${location}`]?.gridlines || [],
          })),
        };
      });

      return {
        combination,
        values: valuesArr.map((value, index) => ({
          name: productData.variants[index].name,
          value,
        })),
        thumbnails: [],
        pricing: { price: "", compareAtPrice: "", costPerItem: "" },
        printConfigurations: printConfigs,
        inventory: {
          sku: autoSku || "",
          zohoItemId: "",
          location: { name: "Default", unavailable: 0, committed: 0, available: 0, onHand: 0 },
        },
        shipping: { productWeight: "", shippingWeight: "" },
      };
    };

    const completedVariantData = { ...variantData } as Record<string, CompleteVariantData>;

    // Fill in missing combinations with defaults
    allCombinationsList.forEach((combination) => {
      if (!completedVariantData[combination]) {
        completedVariantData[combination] = buildDefaultVariantData(combination);
      }
    });

    // Log the data structure for verification
    console.log('📦 Saving product with variant configurations:');
    console.log('Product Data:', {
      title: productData.title,
      variants: productData.variants,
      printTypes: productData.printTypes,
    });
    console.log('Variant Configurations Sample:', Object.keys(completedVariantData).slice(0, 2).map(key => ({
      combination: key,
      pricing: completedVariantData[key].pricing,
      printConfigs: completedVariantData[key].printConfigurations?.map(pc => ({
        name: pc.name,
        locations: pc.locations?.map(loc => ({
          location: loc.location,
          basePrice: loc.basePrice,
          fontRate: loc.fontRate,
          hasBoundingBox: !!loc.boundingBox?.width,
        }))
      }))
    })));

    // Call onSaveAction with combined data
    onSaveAction({
      productData,
      variantConfigurations: completedVariantData
    });
  }, [variantData, variantGroups, productData, printLocations, getVariantValues, onSaveAction]);

  const generateSKU = (values: string[]) => {
    const title = (productData && typeof productData.title === 'string') ? productData.title : 'PRD';
    const prefix = title.substring(0, 3).toUpperCase();
    const suffix = values.map(v => v.substring(0, 2).toUpperCase()).join('-');
    return `${prefix}-${suffix}`;
  };

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Configure Variants
            </h1>
            <p className="text-gray-600">
              Set up pricing, inventory, and print configurations for each variant combination.
            </p>
          </div>

          {/* Variant Combination Selector */}
          <Card>
            <div className="p-6">
              <div className="mb-4">
                <Text variant="headingMd" as="h2">
                  Variant Combinations
                </Text>
                <Text variant="bodyMd" as="p" tone="subdued">
                  Select a variant combination to configure its settings.
                </Text>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(variantGroups.keys()).map((combination) => (
                  <button
                    key={combination}
                    onClick={() => setSelectedCombination(combination)}
                    className={`p-4 rounded-lg border-2 text-left transition-all ${
                      selectedCombination === combination
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{combination}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {variantData[combination] ? 'Configured' : 'Not configured'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </Card>

          {/* Configuration Form */}
          {selectedCombination && (
            <div className="mt-6 space-y-6">
              {/* Print Configurations */}
              <Card>
                <div className="p-6">
                  <div className="mb-4">
                    <Text variant="headingMd" as="h3">
                      Print Configurations
                    </Text>
                    <Text variant="bodyMd" as="p" tone="subdued">
                      Configure print areas and pricing for each print method and location.
                    </Text>
                  </div>

                  {Object.entries(productData.printOptions || {}).map(
                    ([printConfigKey, selectedOptions]) => {
                      // Find the print config by key (could be _id or name)
                      const printConfig = productData.printConfigs.find(
                        (pc) => pc._id === printConfigKey || pc.name === printConfigKey
                      );

                      if (!printConfig) return null;

                      return (
                        <div key={printConfigKey} className="mb-6 p-4 border border-gray-200 rounded-lg">
                          <div className="mb-4">
                            <Text variant="headingSm" as="h4">
                              {printConfig.name}
                            </Text>
                          </div>

                          {selectedOptions.map((location) => (
                            <div key={location} className="mb-4 p-4 rounded-lg">
                              <div className="mb-3">
                                <Text variant="bodyMd" as="p" fontWeight="medium">
                                  {location}
                                </Text>
                              </div>

                              {/* Base Price and Font Rate - In Indian Rupees (₹) */}
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <TextField
                                  label="Base Price (₹)"
                                  type="number"
                                  prefix="₹"
                                  value={
                                    printLocations[
                                      `${printConfig.name}-${location}`
                                    ]?.basePrice || ""
                                  }
                                  onChange={(value) =>
                                    setPrintLocations((prev) => ({
                                      ...prev,
                                      [`${printConfig.name}-${location}`]: {
                                        ...prev[
                                          `${printConfig.name}-${location}`
                                        ],
                                        basePrice: value,
                                      },
                                    }))
                                  }
                                  autoComplete="off"
                                  helpText="Price in Indian Rupees"
                                />
                                <TextField
                                  label="Setup/Font Rate (₹)"
                                  type="number"
                                  prefix="₹"
                                  value={
                                    printLocations[
                                      `${printConfig.name}-${location}`
                                    ]?.fontRate || ""
                                  }
                                  onChange={(value) =>
                                    setPrintLocations((prev) => ({
                                      ...prev,
                                      [`${printConfig.name}-${location}`]: {
                                        ...prev[
                                          `${printConfig.name}-${location}`
                                        ],
                                        fontRate: value,
                                      },
                                    }))
                                  }
                                  autoComplete="off"
                                  helpText="Additional charges in Rupees"
                                />
                              </div>

                              {/* Bounding Box Section */}
                              <div className="mb-4">
                                <div className="mb-2">
                                  <Text
                                    variant="bodyMd"
                                    as="p"
                                    fontWeight="medium"
                                  >
                                    Print Area Bounding Box
                                  </Text>
                                  <Text
                                    variant="bodySm"
                                    as="p"
                                    tone="subdued"
                                  >
                                    Define the printable area on the garment in inches. Coordinates are relative to the top-left corner of the garment.
                                  </Text>
                                </div>
                                
                                {/* Helper Information */}
                                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                  <Text variant="bodySm" as="p" fontWeight="medium">
                                    💡 Standard Print Areas:
                                  </Text>
                                  <div className="mt-2 space-y-1 text-sm text-gray-600">
                                    <div><strong>T-shirt Front:</strong> 12-14" wide × 16-19" tall, positioned 2-3" from collar</div>
                                    <div><strong>T-shirt Back:</strong> 12-14" wide × 16-19" tall, positioned 2-3" from collar</div>
                                    <div><strong>Polo Front:</strong> 10-12" wide × 14-16" tall, positioned 2-3" from collar</div>
                                    <div><strong>Sweatshirt Front:</strong> 11-13" wide × 15-18" tall, positioned 2-3" from collar</div>
                                  </div>
                                </div>

                                {/* Quick Fill Buttons */}
                                <div className="mb-3 flex gap-2">
                                  <Button
                                    size="slim"
                                    onClick={() => {
                                      const defaults = getDefaultBoundingBox('', location);
                                      setPrintLocations((prev) => ({
                                        ...prev,
                                        [`${printConfig.name}-${location}`]: {
                                          ...prev[`${printConfig.name}-${location}`],
                                          boundingBox: {
                                            ...prev[`${printConfig.name}-${location}`]?.boundingBox,
                                            ...defaults,
                                          },
                                        },
                                      }));
                                    }}
                                  >
                                    Use Defaults
                                  </Button>
                                </div>
                                
                                <div className="flex flex-wrap gap-3">
                                  <div className="w-[calc(50%-6px)]">
                                    <TextField
                                      label="Width"
                                      type="number"
                                      suffix="in"
                                      value={
                                        printLocations[
                                          `${printConfig.name}-${location}`
                                        ]?.boundingBox?.width || ""
                                      }
                                      onChange={(value) =>
                                        setPrintLocations((prev) => ({
                                          ...prev,
                                          [`${printConfig.name}-${location}`]: {
                                            ...prev[
                                              `${printConfig.name}-${location}`
                                            ],
                                            boundingBox: {
                                              ...prev[
                                                `${printConfig.name}-${location}`
                                              ]?.boundingBox,
                                              width: value,
                                            },
                                          },
                                        }))
                                      }
                                      autoComplete="off"
                                    />
                                  </div>
                                  <div className="w-[calc(50%-6px)]">
                                    <TextField
                                      label="Height"
                                      type="number"
                                      suffix="in"
                                      value={
                                        printLocations[
                                          `${printConfig.name}-${location}`
                                        ]?.boundingBox?.height || ""
                                      }
                                      onChange={(value) =>
                                        setPrintLocations((prev) => ({
                                          ...prev,
                                          [`${printConfig.name}-${location}`]: {
                                            ...prev[
                                              `${printConfig.name}-${location}`
                                            ],
                                            boundingBox: {
                                              ...prev[
                                                `${printConfig.name}-${location}`
                                              ]?.boundingBox,
                                              height: value,
                                            },
                                          },
                                        }))
                                      }
                                      autoComplete="off"
                                    />
                                  </div>
                                  <div className="w-[calc(50%-6px)]">
                                    <TextField
                                      label="Top"
                                      type="number"
                                      suffix="in"
                                      value={
                                        printLocations[
                                          `${printConfig.name}-${location}`
                                        ]?.boundingBox?.top || ""
                                      }
                                      onChange={(value) =>
                                        setPrintLocations((prev) => ({
                                          ...prev,
                                          [`${printConfig.name}-${location}`]: {
                                            ...prev[
                                              `${printConfig.name}-${location}`
                                            ],
                                            boundingBox: {
                                              ...prev[
                                                `${printConfig.name}-${location}`
                                              ]?.boundingBox,
                                              top: value,
                                            },
                                          },
                                        }))
                                      }
                                      autoComplete="off"
                                    />
                                  </div>
                                  <div className="w-[calc(50%-6px)]">
                                    <TextField
                                      label="Left"
                                      type="number"
                                      suffix="in"
                                      value={
                                        printLocations[
                                          `${printConfig.name}-${location}`
                                        ]?.boundingBox?.left || ""
                                      }
                                      onChange={(value) =>
                                        setPrintLocations((prev) => ({
                                          ...prev,
                                          [`${printConfig.name}-${location}`]: {
                                            ...prev[
                                              `${printConfig.name}-${location}`
                                            ],
                                            boundingBox: {
                                              ...prev[
                                                `${printConfig.name}-${location}`
                                              ]?.boundingBox,
                                              left: value,
                                            },
                                          },
                                        }))
                                      }
                                      autoComplete="off"
                                    />
                                  </div>
                                </div>

                                {/* Validation Messages */}
                                {(() => {
                                  const boundingBox = printLocations[`${printConfig.name}-${location}`]?.boundingBox;
                                  if (!boundingBox) return null;
                                  
                                  const errors = validateBoundingBox(boundingBox, location);
                                  if (errors.length === 0) return null;
                                  
                                  return (
                                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
                                      {errors.map((error, index) => (
                                        <div key={index} className="text-sm text-red-700">
                                          ⚠️ {error}
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Gridline Upload Section */}
                              <div className="mb-4">
                                <div className="mb-2">
                                  <Text
                                    variant="bodyMd"
                                    as="p"
                                    fontWeight="medium"
                                  >
                                    Gridline Image
                                  </Text>
                                </div>

                                {/* Show uploaded gridlines */}
                                {printLocations[
                                  `${printConfig.name}-${location}`
                                ]?.gridlines &&
                                  (printLocations[
                                    `${printConfig.name}-${location}`
                                  ]?.gridlines?.length || 0) > 0 && (
                                  <div className="mb-3">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      {printLocations[
                                        `${printConfig.name}-${location}`
                                      ]?.gridlines?.map((gridline, index) => (
                                        <div key={index} className="relative">
                                          <img
                                            src={gridline.url}
                                            alt={`Gridline ${index + 1}`}
                                            className="w-full h-24 object-cover rounded border"
                                          />
                                          <button
                                            onClick={() => {
                                              setPrintLocations((prev) => ({
                                                ...prev,
                                                [`${printConfig.name}-${location}`]: {
                                                  ...prev[
                                                    `${printConfig.name}-${location}`
                                                  ],
                                                  gridlines: prev[
                                                    `${printConfig.name}-${location}`
                                                  ]?.gridlines?.filter(
                                                    (_, i) => i !== index
                                                  ),
                                                },
                                              }));
                                            }}
                                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <DropZone
                                  accept="image/*"
                                  onDrop={async (files) => {
                                    const file = files[0];
                                    if (file) {
                                      try {
                                        const uploadedImage = await uploadToS3(file, "gridline");
                                        setPrintLocations((prev) => ({
                                          ...prev,
                                          [`${printConfig.name}-${location}`]: {
                                            ...prev[
                                              `${printConfig.name}-${location}`
                                            ],
                                            gridlines: [
                                              ...(prev[
                                                `${printConfig.name}-${location}`
                                              ]?.gridlines || []),
                                              {
                                                key: uploadedImage.key,
                                                url: uploadedImage.signedUrl || uploadedImage.url,
                                              },
                                            ],
                                          },
                                        }));
                                      } catch (error) {
                                        console.error("Error uploading gridline:", error);
                                        alert("Failed to upload gridline image. Please try again.");
                                      }
                                    }
                                  }}
                                >
                                  <DropZone.FileUpload />
                                </DropZone>
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    }
                  )}
                </div>
              </Card>

              {/* Pricing Card */}
              <PricingCard
                pricingData={pricingData}
                onPriceChange={(field, value) => {
                  console.log('Price change:', field, value);
                  setPricingData((prev) => ({
                    ...prev,
                    [field]: value,
                  }));
                }}
              />

              {/* Inventory and Shipping */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <div className="p-6">
                    <div className="mb-4">
                      <Text variant="headingMd" as="h3">
                      Inventory
                      </Text>
                    </div>
                    <div className="space-y-4">
                      <TextField
                        label="SKU"
                        value={inventoryData.sku}
                        onChange={(value) =>
                          setInventoryData((prev) => ({
                            ...prev,
                            sku: value,
                          }))
                        }
                        autoComplete="off"
                      />
                      <TextField
                        label="Zoho Item ID"
                        value={inventoryData.zohoItemId}
                        onChange={(value) =>
                          setInventoryData((prev) => ({
                            ...prev,
                            zohoItemId: value,
                          }))
                        }
                        autoComplete="off"
                      />
                      <TextField
                        label="Location Name"
                        value={inventoryData.location.name}
                        onChange={(value) =>
                          setInventoryData((prev) => ({
                            ...prev,
                            location: {
                              ...prev.location,
                              name: value,
                            },
                          }))
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </Card>

                <Card>
                  <div className="p-6">
                    <div className="mb-4">
                      <Text variant="headingMd" as="h3">
                      Shipping
                      </Text>
                    </div>
                    <div className="space-y-4">
                      <TextField
                        label="Product Weight"
                        type="number"
                        suffix="lbs"
                        value={shippingData.productWeight}
                        onChange={(value) =>
                          setShippingData((prev) => ({
                            ...prev,
                            productWeight: value,
                          }))
                        }
                        autoComplete="off"
                      />
                      <TextField
                        label="Shipping Weight"
                        type="number"
                        suffix="lbs"
                        value={shippingData.shippingWeight}
                        onChange={(value) =>
                          setShippingData((prev) => ({
                            ...prev,
                            shippingWeight: value,
                          }))
                        }
                        autoComplete="off"
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 flex justify-between">
            <Button onClick={onBackAction}>Back</Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={!selectedCombination}
            >
              Save Variants
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <VariantSidebar
        productData={productData}
        selectedCombination={selectedCombination}
        variantGroups={variantGroups}
        mockupFiles={mockupFiles}
        onCombinationSelect={setSelectedCombination}
      />
    </div>
  );
}