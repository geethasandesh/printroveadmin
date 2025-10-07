import { useState, useCallback } from "react";
import { Modal, TextField, Button, Text } from "@shopify/polaris";

type CreateReverseManifestModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    pickupPerson: string;
    pickupPersonNumber: string;
    shippingCompany: string;
  }) => void;
};

export const CreateReverseManifestModal = ({
  open,
  onClose,
  onSubmit,
}: CreateReverseManifestModalProps) => {
  const [pickupPerson, setPickupPerson] = useState("");
  const [pickupPersonNumber, setPickupPersonNumber] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [errors, setErrors] = useState({
    pickupPerson: "",
    pickupPersonNumber: "",
    shippingCompany: "",
  });

  const resetForm = useCallback(() => {
    setPickupPerson("");
    setPickupPersonNumber("");
    setShippingCompany("");
    setErrors({
      pickupPerson: "",
      pickupPersonNumber: "",
      shippingCompany: "",
    });
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [resetForm, onClose]);

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
      newErrors.pickupPersonNumber = "Pickup person contact number is required";
      isValid = false;
    } else if (!/^\d{10}$/.test(pickupPersonNumber)) {
      newErrors.pickupPersonNumber = "Enter a valid 10-digit phone number";
      isValid = false;
    }

    if (!shippingCompany.trim()) {
      newErrors.shippingCompany = "Shipping company name is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit({
        pickupPerson,
        pickupPersonNumber,
        shippingCompany,
      });
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create New Reverse Manifest"
      primaryAction={{
        content: "Create",
        onAction: handleSubmit,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
        },
      ]}
    >
      <Modal.Section>
        <div className="space-y-4">
          <Text variant="bodyMd">
            Create a new manifest to track items being reversed from customers.
          </Text>

          <TextField
            label="Pickup Person Name"
            value={pickupPerson}
            onChange={setPickupPerson}
            autoComplete="name"
            error={errors.pickupPerson}
            requiredIndicator
          />

          <TextField
            label="Pickup Person Contact Number"
            type="tel"
            value={pickupPersonNumber}
            onChange={setPickupPersonNumber}
            autoComplete="tel"
            error={errors.pickupPersonNumber}
            requiredIndicator
          />

          <TextField
            label="Courier/Shipping Company"
            value={shippingCompany}
            onChange={setShippingCompany}
            autoComplete="organization"
            error={errors.shippingCompany}
            requiredIndicator
          />
        </div>
      </Modal.Section>
    </Modal>
  );
};