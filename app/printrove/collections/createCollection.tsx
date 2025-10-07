"use client";
import { useState, useEffect, useCallback } from "react";
import { Modal, TextField, Select, Text, FormLayout } from "@shopify/polaris";
import { useCollectionStore } from "@/store/useCollectionStore";

interface CreateCollectionModalProps {
  open: boolean;
  onClose: () => void;
  editData?: {
    _id: string;
    name: string;
    type: "LISTED" | "UNLISTED";
  } | null;
}

export default function CreateCollectionModal({
  open,
  onClose,
  editData = null,
}: CreateCollectionModalProps) {
  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<"LISTED" | "UNLISTED">("LISTED");
  const [errors, setErrors] = useState({
    name: "",
  });

  const { createCollection, updateCollection, isLoading } =
    useCollectionStore();

  // Update form data when editing an existing collection
  useEffect(() => {
    if (editData) {
      setName(editData.name);
      setType(editData.type);
    } else {
      // Reset form when creating a new collection
      resetForm();
    }
  }, [editData, open]);

  // Reset form helper
  const resetForm = useCallback(() => {
    setName("");
    setType("LISTED");
    setErrors({ name: "" });
  }, []);

  // Form validation
  const validateForm = useCallback(() => {
    const newErrors = {
      name: !name.trim() ? "Collection name is required" : "",
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error);
  }, [name]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return;
    }

    try {
      const formData = { name, type };

      if (editData) {
        await updateCollection(editData._id, formData);
      } else {
        await createCollection(formData);
      }

      resetForm();
      onClose();
    } catch (error) {
      console.error(
        `Failed to ${editData ? "update" : "create"} collection:`,
        error
      );
    }
  }, [
    name,
    type,
    editData,
    createCollection,
    updateCollection,
    validateForm,
    resetForm,
    onClose,
  ]);

  // Handle modal close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

  // Handle name change
  const handleNameChange = useCallback(
    (value: string) => {
      setName(value);
      if (errors.name && value.trim()) {
        setErrors((prev) => ({ ...prev, name: "" }));
      }
    },
    [errors.name]
  );

  // Options for the type select
  const typeOptions = [
    { label: "Listed", value: "LISTED" },
    { label: "Unlisted", value: "UNLISTED" },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={editData ? "Edit Collection" : "Create New Collection"}
      primaryAction={{
        content: editData ? "Update" : "Create",
        onAction: handleSubmit,
        loading: isLoading,
        disabled: !name.trim(),
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
          disabled: isLoading,
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <Text variant="bodyMd" as="p">
            {editData
              ? "Update your collection details below."
              : "Create a new collection to organize your products."}
          </Text>

          <TextField
            label="Collection Name"
            value={name}
            onChange={handleNameChange}
            error={errors.name}
            autoComplete="off"
            placeholder="Enter collection name"
            requiredIndicator
          />

          <Select
            label="Type"
            options={typeOptions}
            value={type}
            onChange={(value) => setType(value as "LISTED" | "UNLISTED")}
          />
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}
