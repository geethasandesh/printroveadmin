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
  onSaveAction: (productData: any, variantData: any) => Promise<void>;
  existingVariantData?: Record<string, CompleteVariantData>;
  onDataChangeAction?: (
    variantData: Record<string, CompleteVariantData>
  ) => void; // Add this prop
}

const generateCombinations = (variants: VariantConfig[]) => {
  if (!variants.length) return new Map();

  const [firstVariant, ...otherVariants] = variants;
  const groups = new Map();

  // Helper to recursively build combinations
  const buildCombinations = (
    prefix: string,
    remainingVariants: VariantConfig[]
  ): string[] => {
    if (!remainingVariants.length) return [prefix];
    const [current, ...rest] = remainingVariants;
    return current.values.flatMap((value) =>
      buildCombinations(`${prefix} - ${value}`, rest)
    );
  };

  firstVariant.values.forEach((firstValue) => {
    const combinations = buildCombinations(firstValue, otherVariants);
    groups.set(firstValue, combinations);
  });

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
  // Move all state declarations to the top, before any conditional logic
  // Compute variant groups
  const variantGroups = productData?.variants
    ? generateCombinations(productData.variants)
    : new Map<string, string[]>();
  // Initialize selected combination to first available
  const initialCombination =
    variantGroups.size > 0
      ? variantGroups.values().next().value[0] || null
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

  const calculateProfit = useCallback((price: string, cost: string) => {
    const p = parseFloat(price || "0");
    const c = parseFloat(cost || "0");
    return p && c ? (p - c).toFixed(2) : "";
  }, []);

  const calculateMargin = useCallback((price: string, cost: string) => {
    const p = parseFloat(price || "0");
    const c = parseFloat(cost || "0");
    return p && c ? (((p - c) / p) * 100).toFixed(2) : "";
  }, []);

  const handleThumbnailUpload = useCallback(
    async (files: File[]) => {
      if (!selectedCombination) return;

      try {
        const uploadPromises = files.map((file) =>
          uploadToS3(file, "thumbnail")
        );
        const results = await Promise.allSettled(uploadPromises);

        const successfulUploads = results
          .filter(
            (result): result is PromiseFulfilledResult<UploadedImage> =>
              result.status === "fulfilled"
          )
          .map((result) => result.value);

        setUploadedImages((prev) => ({
          ...prev,
          [selectedCombination]: {
            thumbnails: [
              ...(prev[selectedCombination]?.thumbnails || []),
              ...successfulUploads,
            ],
          },
        }));
      } catch (error) {
        console.error("Failed to upload thumbnails:", error);
      }
    },
    [selectedCombination]
  );

  // Save current variant data
  const saveCurrentVariantData = useCallback(() => {
    if (!selectedCombination || !productData?.variants) return;

    const newVariantData = {
      combination: selectedCombination,
      values: getVariantValues(selectedCombination).map((value, index) => ({
        name: productData.variants[index].name,
        value,
      })),
      thumbnails: uploadedImages[selectedCombination]?.thumbnails || [],
      pricing: pricingData,
      printConfigurations: (productData.printConfigs || []).map(
        (printConfig) => {
          const key = printConfig._id || printConfig.name;
          const selectedOptions = productData.printOptions?.[key];
          const locationsToUse =
            selectedOptions && selectedOptions.length > 0
              ? selectedOptions
              : printConfig.options || [];

          return {
            name: printConfig.name,
            locations: locationsToUse.map((location) => {
              const locationKey = `${printConfig.name}-${location}`;
              const locationData = printLocations[locationKey];
              return {
                location: location,
                basePrice: locationData?.basePrice || "",
                fontRate: locationData?.fontRate || "",
                boundingBox: locationData?.boundingBox || {
                  width: "",
                  height: "",
                  top: "",
                  left: "",
                },
                gridlines: locationData?.gridlines || [],
              };
            }),
          };
        }
      ),
      inventory: inventoryData,
      shipping: shippingData,
    };

    setVariantData((prev) => ({
      ...prev,
      [selectedCombination]: newVariantData,
    }));
  }, [
    selectedCombination,
    productData,
    getVariantValues,
    uploadedImages,
    pricingData,
    printLocations,
    inventoryData,
    shippingData,
  ]);

  // Debounced save function
  const debouncedSaveVariantData = useCallback(
    debounce(() => {
      saveCurrentVariantData();
    }, 1000),
    [saveCurrentVariantData]
  );

  // Initialize from existing data
  useEffect(() => {
    if (existingVariantData && Object.keys(existingVariantData).length > 0) {
      setVariantData(existingVariantData);

      // If there's no selection, or the current selection is not in the existing data,
      // default to the first item.
      setSelectedCombination((currentSelection) => {
        if (!currentSelection || !existingVariantData[currentSelection]) {
          return Object.keys(existingVariantData)[0];
        }
        return currentSelection;
      });
    }
  }, [existingVariantData]);

  // Load data for selected combination, or reset if combination changes
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
      setPrintLocations({});
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
      if (selectedCombination) {
        setUploadedImages((prev) => ({
          ...prev,
          [selectedCombination]: { thumbnails: [] },
        }));
      }
    }
  }, [selectedCombination, variantData]);

  // Auto-save when data changes
  useEffect(() => {
    if (selectedCombination) {
      debouncedSaveVariantData();
    }
    return () => {
      debouncedSaveVariantData.cancel();
    };
  }, [
    pricingData,
    printLocations,
    inventoryData,
    shippingData,
    uploadedImages,
    debouncedSaveVariantData,
    selectedCombination,
  ]);

  // Notify parent of data changes
  useEffect(() => {
    if (Object.keys(variantData).length > 0 && onDataChangeAction) {
      onDataChangeAction(variantData);
    }
  }, [variantData, onDataChangeAction]);

  const handleSave = useCallback(async () => {
    // Save current variant data before final save
    saveCurrentVariantData();

    // Call parent save function
    await onSaveAction(productData, variantData);
  }, [saveCurrentVariantData, onSaveAction, productData, variantData]);

  // Early return ONLY after all hooks have been called
  if (
    !productData ||
    !productData.variants ||
    productData.variants.length === 0
  ) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <Text variant="headingMd" as="h2">
          No variants configured for this product.
        </Text>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="flex">
        {/* Left margin - 15% width */}
        <div className="w-[15%]"></div>

        {/* Left Sidebar */}
        <VariantSidebar
          productData={productData}
          mockupFiles={mockupFiles}
          variantGroups={variantGroups}
          selectedCombination={selectedCombination}
          onCombinationSelect={setSelectedCombination}
        />

        {/* Right Layout - 60% width */}
        <div className="w-[60%] p-6 mt-2">
          {selectedCombination && (
            <>
              {/* Existing Variant Details Card */}
              <Card>
                <div className="p-6">
                  <div className="mb-6">
                    <Text variant="headingLg" as="h2">
                      Variant Details
                    </Text>
                  </div>

                  <div className="space-y-4">
                    {/* Variant Values */}
                    {productData.variants.map((variant, index) => (
                      <div key={variant.name}>
                        <TextField
                          label={variant.name}
                          value={getVariantValues(selectedCombination)[index]}
                          readOnly
                          autoComplete="off"
                        />
                      </div>
                    ))}

                    {/* Thumbnail Upload */}
                    <div className="mt-6">
                      <div className="mb-2">
                        <Text variant="bodyMd" as="p" fontWeight="medium">
                          Thumbnail Image
                        </Text>
                      </div>

                      {/* Show uploaded thumbnails */}
                      {uploadedImages[selectedCombination!]?.thumbnails
                        ?.length > 0 && (
                        <div className="grid grid-cols-4 gap-4 mb-4">
                          {uploadedImages[selectedCombination!]?.thumbnails.map(
                            (image, index) => (
                              <div key={image.key} className="relative">
                                <img
                                  src={image.signedUrl || image.url} // Use signed URL for preview if available
                                  alt={`Thumbnail ${index + 1}`}
                                  className="w-full h-32 object-cover rounded"
                                />
                                <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                                  <Button
                                    variant="plain"
                                    onClick={() => {
                                      setUploadedImages((prev) => ({
                                        ...prev,
                                        [selectedCombination!]: {
                                          thumbnails:
                                            prev[
                                              selectedCombination!
                                            ]?.thumbnails.filter(
                                              (_, i) => i !== index
                                            ) || [],
                                        },
                                      }));
                                    }}
                                  >
                                    ×
                                  </Button>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <DropZone
                        accept="image/*"
                        type="image"
                        onDrop={(files) => handleThumbnailUpload(files)}
                      >
                        <div className="flex flex-col items-center justify-center p-6">
                          <Text variant="bodyMd" as="p">
                            Drop files to upload or
                          </Text>
                          <Button>Browse</Button>
                          <Text variant="bodySm" as="p" tone="subdued">
                            Accept JPG, PNG
                          </Text>
                        </div>
                      </DropZone>
                    </div>
                  </div>
                </div>
              </Card>

              <PricingCard
                pricingData={pricingData}
                onPriceChange={(field, value) => {
                  setPricingData((prev) => ({
                    ...prev,
                    [field]: value,
                  }));
                }}
              />

              {/* Print Configuration Cards */}
              {Object.entries(productData.printOptions || {}).map(
                ([printConfigKey, selectedOptions]) => {
                  // Find the print config by key (could be _id or name)
                  const printConfig = productData.printConfigs.find(
                    (pc) =>
                      pc._id === printConfigKey || pc.name === printConfigKey
                  );

                  if (
                    !printConfig ||
                    !selectedOptions ||
                    selectedOptions.length === 0
                  ) {
                    return null;
                  }

                  return (
                    <div className="mt-2" key={printConfigKey}>
                      <Card>
                        <div className="p-6">
                          <div className="mb-6">
                            <Text variant="headingLg" as="h2">
                              Print Configuration - {printConfig.name}
                            </Text>
                          </div>

                          {selectedOptions.map((location) => (
                            <div key={location} className="mb-6 p-4 rounded-lg">
                              <div className="mb-4">
                                <Text variant="headingSm" as="h4">
                                  {location}
                                </Text>
                              </div>

                              {/* Price Section */}
                              <div className="mb-6">
                                <div className="mb-2">
                                  <Text
                                    variant="bodyMd"
                                    as="p"
                                    fontWeight="medium"
                                  >
                                    Price
                                  </Text>
                                </div>
                                <div className="flex gap-4">
                                  <div className="w-1/2">
                                    <TextField
                                      label="Base Price"
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
                                    />
                                  </div>
                                  <div className="w-1/2">
                                    <TextField
                                      label="Font Rate per Square Inch"
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
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Bounding Box Section */}
                              <div className="mb-6">
                                <div className="mb-2">
                                  <Text
                                    variant="bodyMd"
                                    as="p"
                                    fontWeight="medium"
                                  >
                                    Bounding Box
                                  </Text>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                  <div className="w-[calc(50%-8px)]">
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
                                  <div className="w-[calc(50%-8px)]">
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
                                  <div className="w-[calc(50%-8px)]">
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
                                  <div className="w-[calc(50%-8px)]">
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
                              </div>

                              {/* Gridline Upload Section */}
                              <div className="mb-6">
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
                                  ]?.gridlines?.length ?? 0) > 0 && (
                                    <div className="grid grid-cols-4 gap-4 mb-4">
                                      {printLocations[
                                        `${printConfig.name}-${location}`
                                      ]?.gridlines?.map((image, index) => (
                                        <div
                                          key={image.key}
                                          className="relative"
                                        >
                                          <img
                                            src={image.url}
                                            alt={`Gridline ${index + 1}`}
                                            className="w-full h-32 object-cover rounded"
                                          />
                                          <div className="absolute top-2 right-2 bg-white rounded-full p-1">
                                            <Button
                                              variant="plain"
                                              onClick={() => {
                                                setPrintLocations((prev) => ({
                                                  ...prev,
                                                  [`${printConfig.name}-${location}`]:
                                                    {
                                                      ...prev[
                                                        `${printConfig.name}-${location}`
                                                      ],
                                                      gridlines:
                                                        prev[
                                                          `${printConfig.name}-${location}`
                                                        ]?.gridlines?.filter(
                                                          (_, i) => i !== index
                                                        ) || [],
                                                    },
                                                }));
                                              }}
                                            >
                                              ×
                                            </Button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                <DropZone
                                  accept="image/*"
                                  type="image"
                                  onDrop={async (files) => {
                                    try {
                                      const uploadPromises = files.map((file) =>
                                        uploadToS3(file, "gridline")
                                      );
                                      const results = await Promise.allSettled(
                                        uploadPromises
                                      );

                                      const successfulUploads = results
                                        .filter(
                                          (
                                            result
                                          ): result is PromiseFulfilledResult<UploadedImage> =>
                                            result.status === "fulfilled"
                                        )
                                        .map((result) => result.value);

                                      setPrintLocations((prev) => ({
                                        ...prev,
                                        [`${printConfig.name}-${location}`]: {
                                          ...prev[
                                            `${printConfig.name}-${location}`
                                          ],
                                          location: location,
                                          basePrice:
                                            prev[
                                              `${printConfig.name}-${location}`
                                            ]?.basePrice || "",
                                          fontRate:
                                            prev[
                                              `${printConfig.name}-${location}`
                                            ]?.fontRate || "",
                                          boundingBox: prev[
                                            `${printConfig.name}-${location}`
                                          ]?.boundingBox || {
                                            width: "",
                                            height: "",
                                            top: "",
                                            left: "",
                                          },
                                          gridlines: [
                                            ...(prev[
                                              `${printConfig.name}-${location}`
                                            ]?.gridlines || []),
                                            ...successfulUploads,
                                          ],
                                        },
                                      }));
                                    } catch (error) {
                                      console.error(
                                        "Failed to upload gridlines:",
                                        error
                                      );
                                    }
                                  }}
                                >
                                  <div className="flex flex-col items-center justify-center p-6">
                                    <Text variant="bodyMd" as="p">
                                      Drop files to upload or
                                    </Text>
                                    <Button>Browse</Button>
                                    <Text
                                      variant="bodySm"
                                      as="p"
                                      tone="subdued"
                                    >
                                      Accept JPG, PNG
                                    </Text>
                                  </div>
                                </DropZone>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>
                  );
                }
              )}

              {/* Inventory Card */}
              <div className="mt-2">
                <Card>
                  <div className="p-6">
                    <div className="mb-6">
                      <Text variant="headingLg" as="h2">
                        Inventory
                      </Text>
                    </div>

                    <div className="space-y-6">
                      {/* SKU and Zoho ID */}
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <TextField
                            label="Product SKU"
                            value={inventoryData.sku}
                            onChange={(value) =>
                              setInventoryData((prev) => ({
                                ...prev,
                                sku: value,
                              }))
                            }
                            autoComplete="off"
                            readOnly
                            disabled
                          />
                        </div>
                        <div className="w-1/2">
                          <TextField
                            label="Zoho Item ID"
                            value={inventoryData.zohoItemId}
                            readOnly
                            onChange={(value) =>
                              setInventoryData((prev) => ({
                                ...prev,
                                zohoItemId: value,
                              }))
                            }
                            autoComplete="off"
                          />
                        </div>
                      </div>

                      {/* Location Details */}
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <TextField
                            label="Location"
                            value={inventoryData.location.name}
                            readOnly
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
                        <div className="w-[10%]">
                          <TextField
                            label="Unavailable"
                            type="number"
                            value={inventoryData.location.unavailable.toString()}
                            readOnly
                            onChange={(value) =>
                              setInventoryData((prev) => ({
                                ...prev,
                                location: {
                                  ...prev.location,
                                  unavailable: parseInt(value) || 0,
                                },
                              }))
                            }
                            autoComplete="off"
                          />
                        </div>
                        <div className="w-[10%]">
                          <TextField
                            label="Committed"
                            type="number"
                            value={inventoryData.location.committed.toString()}
                            readOnly
                            onChange={(value) =>
                              setInventoryData((prev) => ({
                                ...prev,
                                location: {
                                  ...prev.location,
                                  committed: parseInt(value) || 0,
                                },
                              }))
                            }
                            autoComplete="off"
                          />
                        </div>
                        <div className="w-[10%]">
                          <TextField
                            label="Available"
                            type="number"
                            value={inventoryData.location.available.toString()}
                            readOnly
                            onChange={(value) =>
                              setInventoryData((prev) => ({
                                ...prev,
                                location: {
                                  ...prev.location,
                                  available: parseInt(value) || 0,
                                },
                              }))
                            }
                            autoComplete="off"
                          />
                        </div>
                        <div className="w-[10%]">
                          <TextField
                            label="On Hand"
                            type="number"
                            value={inventoryData.location.onHand.toString()}
                            readOnly
                            onChange={(value) =>
                              setInventoryData((prev) => ({
                                ...prev,
                                location: {
                                  ...prev.location,
                                  onHand: parseInt(value) || 0,
                                },
                              }))
                            }
                            autoComplete="off"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Shipping Card */}
              <div className="mt-2">
                <Card>
                  <div className="p-6">
                    <div className="mb-6">
                      <Text variant="headingLg" as="h2">
                        Shipping
                      </Text>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-1/2">
                        <TextField
                          label="Product Weight *"
                          type="number"
                          suffix=""
                          value={shippingData.productWeight}
                          onChange={(value) =>
                            setShippingData((prev) => ({
                              ...prev,
                              productWeight: value,
                            }))
                          }
                          autoComplete="off"
                          requiredIndicator
                        />
                      </div>
                      <div className="w-1/2">
                        <TextField
                          label="Shipping Weight *"
                          type="number"
                          suffix=""
                          value={shippingData.shippingWeight}
                          onChange={(value) =>
                            setShippingData((prev) => ({
                              ...prev,
                              shippingWeight: value,
                            }))
                          }
                          autoComplete="off"
                          requiredIndicator
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg">
        <div className="w-[85%] ml-auto p-4 flex justify-between items-center">
          <div>
            <Button onClick={onBackAction}>Back to Product Details</Button>
          </div>
          <div className="flex gap-4">
            <Button onClick={onBackAction}>Cancel</Button>
            <Button onClick={handleSave} variant="primary">
              Save Product
            </Button>
          </div>
        </div>
      </div>

      {/* Add margin bottom to main content to prevent overlap with fixed footer */}
      <div className="mb-24"></div>
    </div>
  );
}
