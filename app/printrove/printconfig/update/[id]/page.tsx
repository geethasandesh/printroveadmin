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
import ImpactAnalysisModal from "../../ImpactAnalysisModal";
import DeactivationModal from "../../DeactivationModal";
import { getApiBaseUrl } from "../../../../lib/apiUrl";

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

  // NEW: Impact analysis and deactivation state
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [impactData, setImpactData] = useState<any>(null);
  const [deactivationImpact, setDeactivationImpact] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

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

  // NEW: Analyze impact before saving
  const analyzeImpact = async () => {
    if (!params.id) return;

    setIsAnalyzing(true);
    try {
      // Always compute client-side removed positions first (case-insensitive)
      const currentPositions: string[] = (currentConfig?.options || []).map((o: any) =>
        typeof o === 'string' ? o : o?.name || String(o)
      );
      const removedLocal = currentPositions.filter(
        (cp) => !savedOptions.some((np) => (np || '').toLowerCase() === (cp || '').toLowerCase())
      );

      if (removedLocal.length === 0) {
        // Nothing removed → save directly
        await performUpdate(false);
        return;
      }

      const response = await fetch(
        `${getApiBaseUrl()}/api/inventory/print-configs/${params.id}/analyze-position-change`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newPositions: savedOptions })
        }
      );

      const data = await response.json().catch(() => ({}));
      console.log('[Impact] analyze-position-change response:', data);

      if (data && data.success && data.impact) {
        setImpactData(data.impact);

        // Show the modal if any positions were removed OR if server marks issues
        const removedFromServer = Array.isArray(data.impact.removedPositions)
          ? data.impact.removedPositions.length > 0
          : false;
        if (
          removedFromServer ||
          data.impact.affectedProductsCount > 0 ||
          !data.impact.canProceed
        ) {
          setShowImpactModal(true);
        } else {
          // No effect → save directly
          await performUpdate(false);
        }
      } else {
        // Fallback to client-side diff modal when server doesn't return impact
        const fallbackImpact = {
          canProceed: true,
          severity: 'low',
          affectedProductsCount: 0,
          affectedOrdersCount: 0,
          affectedProducts: [],
          removedPositions: removedLocal,
          warnings: [],
          blockers: [],
          recommendations: ['Server impact analysis unavailable; proceed with caution'],
        } as any;
        setImpactData(fallbackImpact);
        setShowImpactModal(true);
      }
    } catch (error) {
      console.error('Failed to analyze impact (fallback to client diff):', error);
      // Fallback: we already computed removedLocal
      if (removedLocal.length > 0) {
        const fallbackImpact = {
          canProceed: true,
          severity: 'low',
          affectedProductsCount: 0,
          affectedOrdersCount: 0,
          affectedProducts: [],
          removedPositions: removedLocal,
          warnings: [],
          blockers: [],
          recommendations: ['Server impact analysis unavailable; proceed with caution'],
        } as any;
        setImpactData(fallbackImpact);
        setShowImpactModal(true);
      } else {
        // Nothing removed; proceed
        await performUpdate(false);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // NEW: Actually perform the update
  const performUpdate = async (forceUpdate: boolean) => {
    if (!params.id || !savedOptions.length) return;

    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/inventory/print-configs/${params.id}/update-confirmed`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            options: savedOptions,
            forceUpdate,
            userId: 'admin' // TODO: Get from auth
          })
        }
      );

      const data = await response.json();

      if (response.status === 409) {
        // Requires confirmation
        setImpactData(data.impact);
        setShowImpactModal(true);
        return;
      }

      if (data.success) {
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

        setShowImpactModal(false);

        // Wait for toast to be visible before navigation
        setTimeout(() => {
          router.push("/printrove/printconfig");
        }, 500);
      }
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

  const handleSave = () => {
    analyzeImpact();
  };

  // NEW: Handle impact modal confirmation
  const handleImpactConfirm = () => {
    performUpdate(true);
  };

  // NEW: Analyze deactivation impact
  const analyzeDeactivation = async () => {
    if (!params.id) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/inventory/print-configs/${params.id}/analyze-deactivation`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      const data = await response.json();

      if (data.success) {
        setDeactivationImpact(data.impact);
        setShowDeactivationModal(true);
      }
    } catch (error) {
      console.error('Failed to analyze deactivation:', error);
      toast.error('Failed to analyze deactivation impact.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // NEW: Handle deactivation
  const handleDeactivation = async (mode: 'soft' | 'force') => {
    if (!params.id) return;

    setIsDeactivating(true);
    try {
      const response = await fetch(
        `${getApiBaseUrl()}/api/inventory/print-configs/${params.id}/deactivate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            userId: 'admin' // TODO: Get from auth
          })
        }
      );

      const data = await response.json();

      if (data.success) {
        toast.success(`Configuration ${mode} deactivated successfully!`, {
          duration: 3000,
          position: "top-right",
          style: {
            background: "#DFF0D8",
            color: "#108043",
            padding: "16px",
            borderRadius: "8px",
          },
        });

        setShowDeactivationModal(false);

        // Wait for toast before navigation
        setTimeout(() => {
          router.push("/printrove/printconfig");
        }, 500);
      }
    } catch (error) {
      toast.error('Failed to deactivate configuration');
      console.error('Deactivation error:', error);
    } finally {
      setIsDeactivating(false);
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
        <div className="flex items-center gap-3">
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "600",
              color: "#202223",
            }}
          >
            {currentConfig.name}
          </h1>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
              currentConfig.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {currentConfig.status === 'active' ? '✓ Active' : '○ Inactive'}
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <Button
            onClick={() => router.push("/printrove/printconfig")}
            variant="tertiary"
            disabled={isAnalyzing || isDeactivating}
          >
            Cancel
          </Button>
          
          {currentConfig.status === 'active' && (
            <Button
              onClick={analyzeDeactivation}
              variant="primary"
              tone="critical"
              loading={isAnalyzing}
              disabled={isDeactivating || savedOptions.length === 0}
            >
              {isAnalyzing ? "Analyzing..." : "Deactivate"}
            </Button>
          )}

          <Button
            onClick={handleSave}
            variant="primary"
            loading={isAnalyzing}
            disabled={savedOptions.length === 0 || isDeactivating}
          >
            {isAnalyzing ? "Analyzing..." : "Save"}
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
                            // Fallback to a remote placeholder to avoid 404s for local missing asset
                            (e.target as HTMLImageElement).src =
                              "https://placehold.co/48x48?text=No+img";
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

      {/* Impact Analysis Modal */}
      <ImpactAnalysisModal
        open={showImpactModal}
        onClose={() => setShowImpactModal(false)}
        onConfirm={handleImpactConfirm}
        impact={impactData}
        configName={currentConfig.name}
      />

      {/* Deactivation Modal */}
      <DeactivationModal
        open={showDeactivationModal}
        onClose={() => setShowDeactivationModal(false)}
        onConfirm={handleDeactivation}
        impact={deactivationImpact}
        isLoading={isDeactivating}
      />
    </Page>
  );
}
