import React, { useState, useCallback } from "react";
import {
  Modal,
  TextField,
  Select,
  Button,
  FormLayout,
  Text,
  InlineError,
} from "@shopify/polaris";

interface CreateManifestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    pickupPerson: string;
    pickupPersonNumber: string;
    shippingCompany: string;
    orderIds: string[];
  }) => Promise<void> | void;
}

export function CreateManifestModal({
  open,
  onClose,
  onSubmit,
}: CreateManifestModalProps) {
  // Form state
  const [pickupPerson, setPickupPerson] = useState("");
  const [pickupPersonNumber, setPickupPersonNumber] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [orderIds, setOrderIds] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Form validation errors
  const [errors, setErrors] = useState({
    pickupPerson: "",
    pickupPersonNumber: "",
    shippingCompany: "",
  });

  // Reset form when modal is opened/closed
  const resetForm = useCallback(() => {
    setPickupPerson("");
    setPickupPersonNumber("");
    setShippingCompany("");
    setOrderIds("");
    setErrors({
      pickupPerson: "",
      pickupPersonNumber: "",
      shippingCompany: "",
    });
  }, []);

  // Handle modal close
  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  // Validate form
  const validateForm = () => {
    const newErrors = {
      pickupPerson: "",
      pickupPersonNumber: "",
      shippingCompany: "",
    };

    let isValid = true;

    if (!pickupPerson.trim()) {
      newErrors.pickupPerson = "Pickup person name is required";
      isValid = false;
    }

    if (!pickupPersonNumber.trim()) {
      newErrors.pickupPersonNumber = "Pickup person number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(pickupPersonNumber.trim())) {
      newErrors.pickupPersonNumber =
        "Please enter a valid 10-digit phone number";
      isValid = false;
    }

    if (!shippingCompany) {
      newErrors.shippingCompany = "Shipping company is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Process orderIds if provided
      const orderIdsArray = orderIds
        ? orderIds
            .split(/[,\n]/)
            .map((id) => id.trim())
            .filter(Boolean)
        : [];

      await onSubmit({
        pickupPerson,
        pickupPersonNumber,
        shippingCompany,
        orderIds: orderIdsArray,
      });
    } catch (error) {
      console.error("Error creating manifest:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const shippingCompanies = [
    { label: "Select a shipping company", value: "" },
    { label: "Delhivery", value: "Delhivery" },
    { label: "Ekart", value: "Ekart" },
    { label: "XpressBees", value: "XpressBees" },
    { label: "Blue Dart", value: "Blue Dart" },
  ];

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Dispatch Manifest"
      primaryAction={{
        content: "Create",
        onAction: handleSubmit,
        loading: submitting,
        disabled: submitting,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
          disabled: submitting,
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <Text variant="bodyMd" as="p">
            Fill in the details to create a dispatch manifest.
          </Text>

          {/* Pickup Person Name */}
          <TextField
            label="Pickup Person"
            value={pickupPerson}
            onChange={setPickupPerson}
            autoComplete="off"
            error={errors.pickupPerson}
            disabled={submitting}
          />

          {/* Pickup Person Number */}
          <TextField
            label="Pickup Person Number"
            value={pickupPersonNumber}
            onChange={setPickupPersonNumber}
            autoComplete="off"
            type="tel"
            error={errors.pickupPersonNumber}
            disabled={submitting}
            helpText="Enter a 10-digit phone number"
          />

          {/* Shipping Company */}
          <Select
            label="Shipping Company"
            options={shippingCompanies}
            value={shippingCompany}
            onChange={setShippingCompany}
            error={errors.shippingCompany}
            disabled={submitting}
          />

          {/* Order IDs (Optional) */}
          <TextField
            label="Order IDs (Optional)"
            value={orderIds}
            onChange={setOrderIds}
            autoComplete="off"
            multiline={3}
            disabled={submitting}
            helpText="Enter order IDs separated by commas or new lines"
          />
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}
