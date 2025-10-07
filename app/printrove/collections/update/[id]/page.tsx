"use client";
import {
  Card,
  TextField,
  Select,
  Button,
  Spinner,
  Text,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons"; // Removed PlusIcon
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  useCollectionStore,
  AssociatedProduct,
} from "@/store/useCollectionStore";
import { Toaster, toast } from "react-hot-toast";

export default function CollectionUpdatePage() {
  const router = useRouter();
  const params = useParams();
  const {
    fetchCollectionById,
    currentCollection,
    isLoading,
    updateCollection,
  } = useCollectionStore();

  const [formData, setFormData] = useState({
    name: "",
    type: "LISTED" as "LISTED" | "UNLISTED",
    description: "",
  });

  useEffect(() => {
    if (params.id) {
      fetchCollectionById(params.id as string);
    }
  }, [params.id]);

  useEffect(() => {
    if (currentCollection) {
      setFormData({
        name: currentCollection.name,
        type: currentCollection.type,
        description: currentCollection.description || "",
      });
    }
  }, [currentCollection]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name?.trim()) {
        toast.error("Collection name is required");
        return;
      }

      // Only include description if it's not empty
      const payload = {
        name: formData.name,
        type: formData.type,
        ...(formData.description ? { description: formData.description } : {}),
      };

      await updateCollection(params.id as string, payload);
      toast.success("Collection updated successfully");
      router.push("/printrove/collections");
    } catch (error) {
      toast.error("Failed to update collection");
      console.error("Update error:", error);
    }
  };

  return (
    <div className="p-8 bg-[#F5F5F5] min-h-screen">
      <Toaster position="top-right" />

      <div className="flex justify-between items-center mb-6">
        <Text as="h1" variant="headingLg" fontWeight="bold">
          Collections
        </Text>{" "}
        <div className="flex gap-2">
          <Button onClick={() => router.back()}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} loading={isLoading}>
            Save
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Spinner size="large" />
          <span className="ml-3 text-lg">Loading collection data...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <div className="mb-6">
              <div className="mb-2">
                <Text as="h3" variant="headingMd" fontWeight="bold">
                  Collections Information
                </Text>
              </div>
              <div className="space-y-4">
                <div>
                  <TextField
                    label="Title"
                    value={formData.name}
                    onChange={(value) => handleInputChange("name", value)}
                    autoComplete="off"
                    error={formData.name?.trim() ? false : "Title is required"}
                  />
                </div>

                <div>
                  <Select
                    label="Type"
                    options={[
                      { label: "Listed", value: "LISTED" },
                      { label: "Unlisted", value: "UNLISTED" },
                    ]}
                    value={formData.type}
                    onChange={(value) => handleInputChange("type", value)}
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-6">
              <h2 className="text-lg font-bold">Associated Products</h2>
            </div>

            <div>
              {/* Existing Products */}
              {currentCollection?.associatedProducts?.map((product) => (
                <div
                  key={product._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "16px",
                    borderBottom: "1px solid #E1E3E5",
                  }}
                >
                  {/* Product Image - 10% */}
                  <div style={{ width: "10%" }}>
                    {product.thumbnailImage ? (
                      <img
                        src={product.thumbnailImage}
                        alt={product.title}
                        style={{
                          width: "48px",
                          height: "48px",
                          objectFit: "cover",
                          borderRadius: "4px",
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
                        }}
                      >
                        <span style={{ fontSize: "12px", color: "#8C9196" }}>
                          No image
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Product Name - 70% */}
                  <div style={{ width: "70%" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "500",
                        color: "#202223",
                      }}
                    >
                      {product.title}
                    </div>
                  </div>

                  {/* Status - 10% */}
                  <div style={{ width: "10%", textAlign: "right" }}>
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
                      {product.status.charAt(0).toUpperCase() +
                        product.status.slice(1)}
                    </span>
                  </div>

                  {/* Delete Icon - 10% */}
                  <div style={{ width: "10%", textAlign: "right" }}>
                    <Button
                      icon={DeleteIcon}
                      variant="plain"
                      onClick={() => {
                        // TODO: Implement delete functionality
                        console.log("Delete product:", product._id);
                      }}
                    />
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {!currentCollection?.associatedProducts?.length && (
                <div className="text-center py-8 text-gray-500">
                  <p>No products associated with this collection.</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
