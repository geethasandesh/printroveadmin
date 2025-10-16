"use client";

import { useState, useEffect, Suspense, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TextField,
  Card,
  FormLayout,
  Text,
  Button,
  Select,
  Tag,
  Icon,
} from "@shopify/polaris";
import {
  CircleUpIcon,
  DragHandleIcon,
  EditIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";
import { MultiSelect } from "@/components/MultiSelect";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { RichTextEditor } from "@/components/RichTextEditor";
import { VariantConfig } from "../variants/page";
import { usePrintConfig } from "@/store/usePrintConfigStore";
import { useProductStore } from "@/store/useProductStore";
import { useCollectionStore } from "@/store/useCollectionStore";
// Product type constraints removed
import { ProductImageUpload } from "@/components/ProductImageUpload";
import { UploadedImage } from "@/utils/s3Upload";
import { ICompleteProduct } from "@/types/product";

// Model presets and related uploads removed

interface Variant {
  _id: string; // Add this
  name: string;
  values: string[];
}

interface PrintConfigLocation {
  location: string;
  width: number;
  height: number;
}

// Print config options are plain string values now
type PrintConfigOption = string;

interface ProductPrintConfig {
  _id?: string;
  name: string;
  options: string[];
  locations: PrintConfigLocation[];
  status: "active" | "inactive";
}

interface FormDataType {
  title: string;
  description: string;
  status: string;
  collections: string[];
  printTypes: string[]; // This will store print config IDs
  printConfigs: ProductPrintConfig[]; // Store full config objects (include _id)
  // map of printConfigId -> selected option values
  printOptions: Record<string, string[]>;
  variants: Variant[];
  avgLeadTime: string;
  maxLeadTime: string;
  avgDailyUsage: string;
  additionalInfo: string;
  printConfig: ProductPrintConfig;
  thumbnails: UploadedImage[];
  mockImages: UploadedImage[];
  productionType: "In-house-non-tshirt" | "outsourced"; // Add the productionType field
}

const SortableVariantItem = ({
  variant,
  index,
  onEdit,
  onDelete,
}: {
  variant: Variant;
  index: number;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: variant.name });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleEditClick = (e: React.MouseEvent) => {
    console.log("Edit clicked");
    e.preventDefault();
    e.stopPropagation();
    onEdit(index);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(index);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 bg-white hover:bg-gray-50"
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-1">
          <div
            className="w-[10%] flex items-center cursor-move"
            {...attributes}
            {...listeners}
          >
            <Icon source={DragHandleIcon} />
          </div>

          <div className="w-[80%]">
            <Text variant="headingMd" as="h3">
              {variant.name}
            </Text>
            <div className="flex flex-wrap gap-2 mt-2">
              {variant.values.map((value, vIndex) => (
                <Tag key={vIndex}>{value}</Tag>
              ))}
            </div>
          </div>
        </div>

        <div className="w-[10%] flex gap-2">
          <Button
            variant="plain"
            onClick={() => {
              onEdit(index);
            }}
            icon={EditIcon}
            accessibilityLabel="Edit variant"
          />
          <Button
            variant="plain"
            tone="success"
            icon={DeleteIcon}
            onClick={() => {
              onDelete(index);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default function CreateProduct() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get("id");

  const [formData, setFormData] = useState<FormDataType>({
    title: "",
    description: "",
    status: "active",
    collections: [],
    printTypes: [],
    printConfigs: [],
    variants: [],
    avgLeadTime: "",
    maxLeadTime: "",
    avgDailyUsage: "",
    additionalInfo: "",
    printConfig: {
      name: "",
      options: [],
      locations: [],
      status: "active",
    },
    printOptions: {},
    thumbnails: [],
    mockImages: [],
    productionType: "outsourced", // Default value
  });
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [variantName, setVariantName] = useState("");
  const [variantValues, setVariantValues] = useState<string[]>([""]);
  const [showVariants, setShowVariants] = useState(false);
  const [thumbnails, setThumbnails] = useState<UploadedImage[]>([]);
  const [mockImages, setMockImages] = useState<UploadedImage[]>([]);
  const [editingVariant, setEditingVariant] = useState<{
    index: number;
    name: string;
    values: string[];
  } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Add validation state
  const [validationErrors, setValidationErrors] = useState<{
    title?: string;
    thumbnails?: string;
    mockImages?: string;
    status?: string;
    collections?: string;
    printTypes?: string;
    printOptions?: string;
    avgLeadTime?: string;
    maxLeadTime?: string;
    avgDailyUsage?: string;
    variants?: string;
    requiredFields?: string;
  }>({});

  // Position constraints removed

  // MOVE THESE TO HERE - with other state declarations
  const [variantConfigurations, setVariantConfigurations] = useState({});

  // Move this function here too - memoized to avoid re-renders in children
  const handleVariantDataChange = useCallback((data: any) => {
    setVariantConfigurations((prev) => (prev === data ? prev : data));
  }, []);

  const { configs, fetchConfigs, isLoading } = usePrintConfig();
  const {
    createProduct,
    updateProduct,
    getProduct,
    currentProduct,
    isLoadingProduct,
    error,
  } = useProductStore();
  const {
    collections,
    fetchCollections,
    isLoading: isLoadingCollections,
  } = useCollectionStore();

  useEffect(() => {
    fetchConfigs(1, 100); // Fetch 100 configs
  }, []);

  // Debug: Log configs when they change
  useEffect(() => {
    console.log('=== Print Configs Loaded ===');
    console.log('Total configs:', configs.length);
    configs.forEach(config => {
      console.log(`- ${config.name}:`, config.options || [], '(', config.options?.length || 0, 'positions)');
    });
  }, [configs]);

  useEffect(() => {
    fetchCollections(1, 100); // Fetch 100 collections
  }, []);

  useEffect(() => {
    console.log("Product ID:", productId);
    if (productId) {
      setIsEditMode(true);
      getProduct(productId);
    }
  }, [productId, getProduct]);

  // Prevent re-applying the same product data on every render
  const lastLoadedSnapshotRef = useRef<string | null>(null);
  useEffect(() => {
    if (isEditMode && currentProduct) {
      // Extract existing print options from variant configurations
      const existingPrintOptions: Record<string, string[]> = {};

      // If there are variant configurations, extract print options from the first variant
      if (
        currentProduct.variantConfigurations &&
        Object.keys(currentProduct.variantConfigurations).length > 0
      ) {
        const firstVariantKey = Object.keys(
          currentProduct.variantConfigurations
        )[0];
        const firstVariant =
          currentProduct.variantConfigurations[firstVariantKey];

        if (firstVariant.printConfigurations) {
          firstVariant.printConfigurations.forEach((printConfig: any) => {
            const key =
              currentProduct.printTypes.find(
                (pt) => pt.name === printConfig.name
              )?._id || printConfig.name;
            existingPrintOptions[key] = printConfig.locations.map(
              (loc: any) => loc.location
            );
          });
        }
      }

      const nextFormData = {
        title: currentProduct.title,
        description: currentProduct.description,
        status: currentProduct.status,
        collections: currentProduct.collections,
        printTypes: currentProduct.printTypes.map((pt) => pt._id),
        printConfigs: currentProduct.printTypes.map((pt) => ({
          _id: pt._id,
          name: pt.name,
          // Normalize options: support legacy [{name, values}] or new string[]
          options: Array.isArray(pt.options)
            ? pt.options.length > 0 && typeof pt.options[0] === "string"
              ? pt.options
              : // legacy shape: array of { name, values: string[] }
                pt.options.flatMap((o: any) => o.values || [])
            : [],
          locations: [],
          status: (pt.status === "active" ? "active" : "inactive") as "active" | "inactive",
        })),
        printOptions: existingPrintOptions,
        variants: currentProduct.variants,
        avgLeadTime: currentProduct.avgLeadTime,
        maxLeadTime: (currentProduct as any).maxLeadTime || "",
        avgDailyUsage: (currentProduct as any).avgDailyUsage || "",
        additionalInfo: currentProduct.additionalInfo,
        printConfig: {
          name: "",
          options: [],
          locations: [],
          status: "active" as "active" | "inactive",
        },
        thumbnails: currentProduct.thumbnails || [],
        mockImages: currentProduct.mockImages || [],
        productionType: currentProduct.productionType || "outsourced", // Load productionType from existing product
      };

      const snapshot = JSON.stringify(nextFormData);
      if (lastLoadedSnapshotRef.current !== snapshot) {
        setFormData(nextFormData);
        lastLoadedSnapshotRef.current = snapshot;
      }

      setThumbnails(currentProduct.thumbnails || []);
      setMockImages(currentProduct.mockImages || []);
      // model files removed

      // Set existing variant configurations for edit mode
      if (currentProduct.variantConfigurations) {
        setVariantConfigurations(currentProduct.variantConfigurations);
      }
    }
  }, [currentProduct, isEditMode]);

  const printConfigOptions = configs.map((config) => ({
    label: config.name,
    value: config._id,
  }));

  const collectionOptions = collections.map((collection) => ({
    label: collection.name,
    value: collection._id,
  }));

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setFormData((prev) => {
        const oldIndex = prev.variants.findIndex((v) => v.name === active.id);
        const newIndex = prev.variants.findIndex((v) => v.name === over.id);

        return {
          ...prev,
          variants: arrayMove(prev.variants, oldIndex, newIndex),
        };
      });
    }
  };

  const handleChange = (value: string, field: keyof FormDataType) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePrintConfigChange = (configId: string) => {
    const selectedConfig = configs.find((config) => config._id === configId);
    if (selectedConfig) {
      setFormData((prev) => ({
        ...prev,
        printConfig: {
          name: selectedConfig.name,
          options: selectedConfig.options,
          locations: [],
          status: selectedConfig.status,
        },
      }));
    }
  };

  const handleAddVariantValue = () => {
    setVariantValues([...variantValues, ""]);
  };

  const handleVariantValueChange = (index: number, value: string) => {
    const newValues = [...variantValues];
    newValues[index] = value;
    setVariantValues(newValues);
  };

  const handleRemoveVariantValue = (index: number) => {
    setVariantValues(variantValues.filter((_, i) => i !== index));
  };

  const handleEditVariant = (index: number) => {
    const variant = formData.variants[index];
    setEditingVariant({
      index,
      name: variant.name,
      values: [...variant.values],
    });
    setVariantName(variant.name);
    setVariantValues([...variant.values]);
    setShowVariantForm(true);
  };

  const handleDeleteVariant = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleSaveVariant = () => {
    if (!variantName || variantValues.some((v) => !v)) return;

    setFormData((prev) => ({
      ...prev,
      variants: editingVariant
        ? prev.variants.map((v, i) =>
            i === editingVariant.index
              ? {
                  _id: v._id || Math.random().toString(36).substr(2, 9),
                  name: variantName,
                  values: variantValues.filter((v) => v),
                }
              : v
          )
        : [
            ...prev.variants,
            {
              _id: Math.random().toString(36).substr(2, 9),
              name: variantName,
              values: variantValues.filter((v) => v),
            },
          ],
    }));

    setVariantName("");
    setVariantValues([""]);
    setShowVariantForm(false);
    setEditingVariant(null);
  };

  // Update the handleNext function to validate before proceeding to variant config
  const handleBack = () => {
    setShowVariants(false);
  };

  const handleNext = () => {
    // Validate required fields
    const errors: typeof validationErrors = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    // TEMPORARILY DISABLED FOR TESTING - Uncomment when S3 is configured
    // if (thumbnails.length === 0) {
    //   errors.thumbnails = "At least one thumbnail image is required";
    // }

    // if (mockImages.length === 0) {
    //   errors.mockImages = "At least one mockup image is required";
    // }

    if (!formData.status) {
      errors.status = "Status is required";
    }

    if (formData.collections.length === 0) {
      errors.collections = "At least one collection must be selected";
    }

    if (formData.printTypes.length === 0) {
      errors.printTypes = "At least one print type must be selected";
    }

    // Basic Print options validation: require at least one selection overall
    if (formData.printTypes.length > 0) {
      const allSelectedPositions: string[] = [];
      Object.values(formData.printOptions).forEach((positions) => {
        allSelectedPositions.push(...positions);
      });
      if (allSelectedPositions.length === 0) {
        errors.printOptions = "At least one printing position must be selected";
      }
    }

    if (!formData.avgLeadTime || formData.avgLeadTime.trim() === "") {
      errors.avgLeadTime = "Average lead time is required";
    }

    if (!formData.maxLeadTime || formData.maxLeadTime.trim() === "") {
      errors.maxLeadTime = "Maximum lead time is required";
    }

    if (!formData.avgDailyUsage || formData.avgDailyUsage.trim() === "") {
      errors.avgDailyUsage = "Average daily usage is required";
    }

    if (formData.variants.length === 0) {
      errors.variants = "At least one variant is required";
    }

    // If there are errors, show them and prevent navigation
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      // Scroll to top to show the error message
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Clear any previous validation errors
    setValidationErrors({});

    // Navigate to the variants config
    setShowVariants(true);
  };

  // Model preset logic removed

  // Function to handle saving product - no VariantConfig calls here since it's a child component
  const handleSave = async (data: any) => {
    console.log('🔍 handleSave received data:', data);
    
    // Extract productData and variantConfigurations from the data object
    const productData = data.productData;
    const variantConfigurations = data.variantConfigurations;
    
    console.log('📦 Extracted productData:', productData);
    console.log('📦 Extracted variantConfigurations:', variantConfigurations);
    try {
      // Only send images that actually have an S3 key. This avoids backend/S3
      // errors like "The specified key does not exist" when nothing was uploaded
      // or when a temp preview without key slips through.
      // Re-enable images: send only files that have a valid S3 key
      const safeThumbnails = (thumbnails || []).filter((img) => !!img?.key);
      const safeMockImages = (mockImages || []).filter((img) => !!img?.key);
      
      // Build payload matching backend schema (cast to any to satisfy signature)
      const payload: any = {
        product: {
          title: productData.title,
          description: productData.description,
          status: productData.status,
          collections: productData.collections,
          productionType: productData.productionType,
          printTypes: productData.printTypes,
          variants: productData.variants,
          avgLeadTime: productData.avgLeadTime,
          maxLeadTime: productData.maxLeadTime,
          avgDailyUsage: productData.avgDailyUsage,
          additionalInfo: productData.additionalInfo,
          thumbnails: safeThumbnails,
          mockImages: safeMockImages,
          // Pass variantConfigurations object directly
          variantConfigurations: variantConfigurations,
        },
        variantConfigurations: variantConfigurations,
      };

      // Either create new or update existing product
      if (isEditMode && productId) {
        await updateProduct(productId, payload);
      } else {
        await createProduct(payload);
      }

      // Redirect back to products list
      router.push("/printrove/product");
    } catch (error) {
      console.error("Failed to save product:", error);
    }
  };

  const pageTitle = isEditMode ? "Edit Product" : "Create Product";

  // Early return ONLY after all hooks have been declared
  if (isEditMode && isLoadingProduct) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Text as="span">Loading product data...</Text>
      </div>
    );
  }

  return (
    <>
      {!showVariants ? (
        <div className="p-8 bg-[#F5F5F5] mt-0">
          <div className="w-full">
            <Card>
              <div className="p-6">
                <Text variant="headingLg" as="h2">
                  {pageTitle}
                </Text>

                <div className="mt-6">
                  <FormLayout>
                    {/* Model preset and model file preview removed */}
                    {/* Show global validation error if any */}
                    {Object.values(validationErrors).some(
                      (error) => !!error
                    ) && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded">
                        <Text variant="bodyMd" fontWeight="medium" as="p">
                          Please correct the following errors:
                        </Text>
                        <ul className="list-disc pl-5 mt-2">
                          {Object.values(validationErrors)
                            .filter((error) => !!error)
                            .map((error, index) => (
                              <li key={index}>{error}</li>
                            ))}
                        </ul>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4">
                      <TextField
                        label="Title"
                        value={formData.title}
                        onChange={(value) => handleChange(value, "title")}
                        autoComplete="off"
                        error={validationErrors.title}
                        requiredIndicator
                      />
                      <Select
                        label="Status"
                        options={[
                          { label: "Active", value: "active" },
                          { label: "Inactive", value: "inactive" },
                        ]}
                        value={formData.status}
                        onChange={(value) => handleChange(value, "status")}
                        error={validationErrors.status}
                        requiredIndicator
                      />
                      <Select
                        label="Production Type"
                        options={[
                          {label: "In-house (t-shirt)", value: "In-house-tshirt"},
                          {
                            label: "In-house (non-tshirt)",
                            value: "In-house-non-tshirt",
                          },
                          { label: "Outsourced", value: "outsourced" }
                        ]}
                        value={formData.productionType}
                        onChange={(value) =>
                          handleChange(
                            value as "In-house-non-tshirt" | "outsourced" | "In-house-tshirt",
                            "productionType"
                          )
                        }
                        helpText="Select whether this product is produced in-house or outsourced"
                      />
                    </div>

                    <TextField
                      label="Description"
                      value={formData.description}
                      onChange={(value) => handleChange(value, "description")}
                      multiline={4}
                      autoComplete="off"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Thumbnail Images
                        </h3>
                        <ProductImageUpload
                          type="thumbnail"
                          onUploadComplete={setThumbnails}
                          uploadedImages={thumbnails}
                        />
                        {validationErrors.thumbnails && (
                          <div className="mt-1 text-red-600 text-sm">
                            {validationErrors.thumbnails}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium mb-2">
                          Mockup Images *
                        </h3>
                        <ProductImageUpload
                          type="mockup"
                          onUploadComplete={setMockImages}
                          uploadedImages={mockImages}
                        />
                        {validationErrors.mockImages && (
                          <div className="mt-1 text-red-600 text-sm">
                            {validationErrors.mockImages}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Product model files uploads removed */}

                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-3">
                        <MultiSelect
                        label="Collections *"
                        options={collectionOptions}
                        selected={formData.collections}
                        onChange={(values) => {
                          setFormData((prev) => ({
                            ...prev,
                            collections: values,
                          }));
                          if (validationErrors.collections && values.length > 0) {
                            setValidationErrors((prev) => ({
                              ...prev,
                              collections: undefined,
                            }));
                          }
                        }}
                        error={validationErrors.collections}
                        />
                      </div>
                    </div>

                    {/* Product Type field removed */}

                    <MultiSelect
                      label="Print Types *"
                      options={configs.map((config) => ({
                        label: config.name,
                        value: config._id,
                      }))}
                      selected={formData.printTypes}
                      onChange={(values) => {
                        const selectedConfigs = configs
                          .filter((config) => values.includes(config._id))
                          .map((config) => ({
                            _id: config._id,
                            name: config.name,
                            options: config.options,
                            locations: [],
                            status: config.status,
                          }));

                        // initialize printOptions map for newly selected configs
                        setFormData((prev) => {
                          const newPrintOptions = { ...prev.printOptions };
                          selectedConfigs.forEach((cfg) => {
                            if (cfg._id && !newPrintOptions[cfg._id]) {
                              newPrintOptions[cfg._id] = [];
                            }
                          });

                          // remove entries for unselected configs
                          Object.keys(newPrintOptions).forEach((key) => {
                            if (!values.includes(key))
                              delete newPrintOptions[key];
                          });

                          return {
                            ...prev,
                            printTypes: values,
                            printConfigs: selectedConfigs,
                            printOptions: newPrintOptions,
                          };
                        });

                        if (validationErrors.printTypes && values.length > 0) {
                          setValidationErrors((prev) => ({
                            ...prev,
                            printTypes: undefined,
                          }));
                        }
                      }}
                      error={validationErrors.printTypes}
                    />

                    {/* Render per-selected-print-config options multi-selects */}
                    {formData.printConfigs.map((pc) => {
                      const allPositions = (pc.options || []).map((opt) => 
                        typeof opt === "string" ? opt : (opt as any).name || String(opt)
                      );
                      const positionOptions = allPositions.map((opt) => ({
                        label: opt,
                        value: opt,
                      }));

                      return (
                        <div key={pc._id || pc.name}>
                          {/* Show warning if no positions available */}
                          {allPositions.length === 0 && (
                            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-300 rounded-md">
                              <p className="text-sm text-yellow-800">
                                ⚠️ <strong>{pc.name}</strong> has no positions configured yet.
                                <br />
                                Please go to <a href="/printrove/printconfig" className="underline font-medium">Print Config Management</a> and add positions for this print type.
                              </p>
                            </div>
                          )}
                          
                          <MultiSelect
                            label={`${pc.name} Positions`}
                            options={positionOptions}
                            selected={
                              formData.printOptions[pc._id || pc.name] || []
                            }
                            onChange={(values) => {
                              const key = pc._id || pc.name;

                              setFormData((prev) => ({
                                ...prev,
                                printOptions: {
                                  ...prev.printOptions,
                                  [key]: values,
                                },
                              }));
                            }}
                            error={validationErrors.printOptions}
                          />
                        </div>
                      );
                    })}
                  </FormLayout>
                </div>
              </div>
            </Card>
          </div>

          <div className="w-full mt-6">
            <Card>
              <div className="p-6">
                <Text variant="headingLg" as="h2">
                  Variants
                </Text>

                {!showVariantForm ? (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={formData.variants.map((v) => v.name)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="mt-6 space-y-1">
                        {formData.variants.map((variant, index) => (
                          <SortableVariantItem
                            key={variant.name}
                            variant={variant}
                            index={index}
                            onEdit={handleEditVariant}
                            onDelete={handleDeleteVariant}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                ) : (
                  <div className="mt-6">
                    <FormLayout>
                      <TextField
                        label="Option Name"
                        value={variantName}
                        onChange={setVariantName}
                        autoComplete="off"
                        placeholder="e.g. Color, Size"
                      />
                      {variantValues.map((value, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="flex-1">
                            <TextField
                              label={index === 0 ? "Option Values" : ""}
                              value={value}
                              onChange={(val) =>
                                handleVariantValueChange(index, val)
                              }
                              autoComplete="off"
                              placeholder="Enter a value"
                            />
                          </div>
                          {variantValues.length > 1 && (
                            <Button
                              onClick={() => handleRemoveVariantValue(index)}
                              accessibilityLabel="Remove value"
                            >
                              ✕
                            </Button>
                          )}
                        </div>
                      ))}
                      <div className="flex justify-between mt-4">
                        <Button onClick={handleAddVariantValue}>
                          Add another value
                        </Button>
                        <div className="flex gap-2">
                          <Button onClick={() => setShowVariantForm(false)}>
                            Cancel
                          </Button>
                          <Button variant="primary" onClick={handleSaveVariant}>
                            Save
                          </Button>
                        </div>
                      </div>
                    </FormLayout>
                  </div>
                )}
              </div>

              {!showVariantForm && (
                <div className="border-t p-4 bg-[#F7F7F7]">
                  <Button
                    onClick={() => setShowVariantForm(true)}
                    icon={CircleUpIcon}
                  >
                    Add variant like color or size
                  </Button>
                </div>
              )}
            </Card>
          </div>

          <div className="w-full mt-6">
            <Card>
              <div className="p-6">
                <Text variant="headingLg" as="h2">
                  Lead Time Demand
                </Text>

                <div className="mt-6">
                  <FormLayout>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <TextField
                          label="Average Lead Time in Days"
                          type="number"
                          value={formData.avgLeadTime || ""}
                          onChange={(value) =>
                            handleChange(value, "avgLeadTime")
                          }
                          autoComplete="off"
                          error={validationErrors.avgLeadTime}
                          requiredIndicator
                        />
                      </div>
                      <div className="flex-1">
                        <TextField
                          label="Maximum Lead Time in Days"
                          type="number"
                          value={formData.maxLeadTime || ""}
                          onChange={(value) =>
                            handleChange(value, "maxLeadTime")
                          }
                          autoComplete="off"
                          error={validationErrors.maxLeadTime}
                          requiredIndicator
                        />
                      </div>
                    </div>

                    {/* Average Daily Usage */}
                    <div className="mt-4">
                      <TextField
                        label="Average Daily Usage (units/day)"
                        type="number"
                        value={formData.avgDailyUsage || ""}
                        onChange={(value) => handleChange(value, "avgDailyUsage")}
                        autoComplete="off"
                        error={validationErrors.avgDailyUsage}
                        requiredIndicator
                        helpText="Estimated average quantity consumed per day"
                      />
                    </div>
                  </FormLayout>
                </div>
              </div>
            </Card>
          </div>

          <div className="w-[70%] mt-6">
            <Card>
              <div className="p-6">
                <Text variant="headingLg" as="h2">
                  Additional Information
                </Text>
                <div className="mt-6">
                  <div className="border border-[#F7F7F7]">
                    <RichTextEditor
                      content={formData.additionalInfo}
                      onChange={(value) =>
                        handleChange(value, "additionalInfo")
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="w-full mt-6 flex justify-end">
            <Button variant="primary" onClick={handleNext}>
              Next
            </Button>
          </div>
        </div>
      ) : (
        <VariantConfig
          productData={formData}
          mockupFiles={mockImages}
          thumbnailFiles={thumbnails}
          onBackAction={handleBack}
          onSaveAction={handleSave}
          existingVariantData={variantConfigurations}
          onDataChangeAction={handleVariantDataChange}
        />
      )}
    </>
  );
}
