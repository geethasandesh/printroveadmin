"use client";
import {
  Card,
  Page,
  TextField,
  Icon,
  Button,
  Text,
  EmptyState,
  Spinner,
} from "@shopify/polaris";
import { XCircleIcon, DeleteIcon, PlusIcon } from "@shopify/polaris-icons";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { usePrintConfig } from "@/store/usePrintConfigStore";
import { Toaster, toast } from "react-hot-toast";

// options are now plain string values (e.g. ["Left Sleeve","Right Sleeve"])

// Update the interface to match what comes from the backend
interface AssociatedProduct {
  id: string;
  title: string; // Changed from 'name' to match API response
  image: string;
  status: string;
}

export default function PrintConfigUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const { fetchConfigById, currentConfig, isLoading, updateConfig } =
    usePrintConfig();

  // savedOptions is now a simple array of string values
  const [savedOptions, setSavedOptions] = useState<string[]>([]);
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (currentConfig && currentConfig.options) {
      // Support both legacy shapes and new shape (string[]).
      // If option is a string, use it. If it's an object with `values`, flatten them.
      const transformed: string[] = [];
      (currentConfig.options as any[]).forEach((opt) => {
        if (typeof opt === "string") {
          transformed.push(opt);
        } else if (opt && Array.isArray(opt.values)) {
          transformed.push(
            ...opt.values.filter((v: any) => typeof v === "string")
          );
        } else if (opt && typeof opt.name === "string") {
          transformed.push(opt.name);
        }
      });

      // remove duplicates while preserving order
      const unique = Array.from(new Set(transformed));
      setSavedOptions(unique);
    }
  }, [currentConfig]);

  useEffect(() => {
    if (params.id) {
      fetchConfigById(params.id as string);
    }
  }, [params.id, fetchConfigById]);

  // Add a new plain value to savedOptions
  const handleAddValue = () => {
    if (!newValue.trim()) {
      toast.error("Value cannot be empty", { duration: 2000 });
      return;
    }

    const trimmed = newValue.trim();
    if (savedOptions.includes(trimmed)) {
      toast.error("This value already exists", { duration: 2000 });
      return;
    }

    setSavedOptions((prev) => [...prev, trimmed]);
    setNewValue("");
    setIsAdding(false);
  };

  // Remove a single value by index
  const handleRemoveOptionValue = (indexToRemove: number) => {
    setSavedOptions((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  const handleSave = async () => {
    if (!params.id || !savedOptions.length) return;

    try {
      // New payload: send options as array of string values
      const payload = {
        options: savedOptions,
      };

      await updateConfig(params.id as string, payload);
      toast.success("Print configuration updated successfully!", {
        duration: 3000,
        position: "top-right",
        style: {
          background: "#DFF0D8",
          color: "#108043",
          padding: "16px",
          borderRadius: "8px",
        },
      });

      // Wait for toast to be visible before navigation
      setTimeout(() => {
        router.push("/printrove/printconfig");
      }, 500);
    } catch (error) {
      toast.error("Failed to update print configuration", {
        duration: 3000,
        position: "top-right",
        style: {
          background: "#F9E6E9",
          color: "#DE3618",
          padding: "16px",
          borderRadius: "8px",
        },
      });
      console.error("Failed to update print config:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  if (!currentConfig) {
    return <div>Print configuration not found</div>;
  }

  return (
    <Page>
      <Toaster />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
          marginBottom: "24px",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "600",
            color: "#202223",
          }}
        >
          {currentConfig.name}
        </h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            onClick={() => router.push("/printrove/printconfig")}
            variant="tertiary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="primary"
            loading={isLoading}
            disabled={savedOptions.length === 0}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <div style={{ padding: "16px" }}>
          <Text variant="headingMd" as="h2">
            Printing Positions
          </Text>

          {savedOptions.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {savedOptions.map((value, idx) => (
                  <span
                    key={idx}
                    style={{
                      backgroundColor: "#DFE3E8",
                      color: "#2C6ECB",
                      padding: "6px 12px",
                      borderRadius: "16px",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {value}
                    <button
                      onClick={() => handleRemoveOptionValue(idx)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "2px",
                        display: "flex",
                        alignItems: "center",
                      }}
                      aria-label={`Remove ${value}`}
                    >
                      <Icon source={XCircleIcon} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div
            style={{
              marginTop: 16,
              display: "flex",
              gap: 8,
              alignItems: "center",
            }}
          >
            <div style={{ flex: 1 }}>
              <TextField
                label="Add Value"
                value={newValue}
                onChange={setNewValue}
                placeholder="e.g. Left Sleeve"
                autoComplete="off"
              />
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button onClick={handleAddValue} variant="primary">
                Save Value
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ marginTop: "24px" }}>
        <Card>
          <div style={{ padding: "16px" }}>
            <Text variant="headingMd" as="h2">
              Associated Products
            </Text>

            <div style={{ marginTop: "16px" }}>
              {currentConfig.associatedProducts &&
              currentConfig.associatedProducts.length > 0 ? (
                currentConfig.associatedProducts.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      padding: "16px",
                      borderBottom: "1px solid #E1E3E5",
                    }}
                  >
                    {/* Product Image - 10% */}
                    <div style={{ width: "10%" }}>
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          width={48}
                          height={48}
                          style={{
                            width: "48px",
                            height: "48px",
                            objectFit: "cover",
                            borderRadius: "4px",
                          }}
                          onError={(e) => {
                            // Handle image loading error
                            (e.target as HTMLImageElement).src =
                              "/placeholder-product.png";
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: "#F4F6F8",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#8C9196",
                          }}
                        >
                          No img
                        </div>
                      )}
                    </div>

                    {/* Product Name - 80% */}
                    <div style={{ width: "80%" }}>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "#202223",
                        }}
                      >
                        {product.title || "Untitled Product"}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6D7175",
                          marginTop: "4px",
                        }}
                      >
                        ID: {product.id}
                      </div>
                    </div>

                    {/* Status - 10% */}
                    <div style={{ width: "10%" }}>
                      <span
                        style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "500",
                          backgroundColor:
                            product.status === "active" ? "#DFF0D8" : "#F9E6E9",
                          color:
                            product.status === "active" ? "#108043" : "#DE3618",
                        }}
                      >
                        {product.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center">
                  <EmptyState
                    heading="No associated products"
                    image="/empty-state.svg"
                  >
                    <p>
                      This print configuration is not used by any products yet.
                    </p>
                  </EmptyState>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
