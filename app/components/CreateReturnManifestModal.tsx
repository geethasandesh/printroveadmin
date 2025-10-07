import { useState } from "react";
import {
  Modal,
  TextField,
  Select,
  Button,
  Text,
  FormLayout,
} from "@shopify/polaris";

interface CreateReturnManifestModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    pickupPerson: string;
    pickupPersonNumber: string;
    shippingCompany: string;
  }) => void;
}

export function CreateReturnManifestModal({
  open,
  onClose,
  onSubmit,
}: CreateReturnManifestModalProps) {
  const [pickupPerson, setPickupPerson] = useState("");
  const [pickupPersonNumber, setPickupPersonNumber] = useState("");
  const [shippingCompany, setShippingCompany] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    pickupPerson: "",
    pickupPersonNumber: "",
    shippingCompany: "",
  });

  const handleSubmit = async () => {
    // Validate form
    const newErrors = {
      pickupPerson: !pickupPerson ? "Pickup person is required" : "",
      pickupPersonNumber: !pickupPersonNumber
        ? "Pickup person number is required"
        : "",
      shippingCompany: !shippingCompany ? "Shipping company is required" : "",
    };

    const hasErrors = Object.values(newErrors).some((error) => error);
    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        pickupPerson,
        pickupPersonNumber,
        shippingCompany,
      });
      handleClose();
    } catch (error) {
      console.error("Failed to create return manifest:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPickupPerson("");
    setPickupPersonNumber("");
    setShippingCompany("");
    setErrors({
      pickupPerson: "",
      pickupPersonNumber: "",
      shippingCompany: "",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create Return Manifest"
      primaryAction={{
        content: "Create",
        onAction: handleSubmit,
        loading: isSubmitting,
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: handleClose,
        },
      ]}
    >
      <Modal.Section>
        <FormLayout>
          <Text variant="bodyMd" as="p">
            Create a new return manifest to track returns from customers.
          </Text>

          <TextField
            label="Pickup Person"
            value={pickupPerson}
            onChange={setPickupPerson}
            error={errors.pickupPerson}
            autoComplete="off"
          />

          <TextField
            label="Pickup Person Number"
            value={pickupPersonNumber}
            onChange={setPickupPersonNumber}
            error={errors.pickupPersonNumber}
            type="tel"
            autoComplete="off"
          />

          <Select
            label="Shipping Company"
            options={[
              { label: "Select a shipping company", value: "" },
              { label: "Delhivery", value: "Delhivery" },
              { label: "Ekart", value: "Ekart" },
              { label: "XpressBees", value: "XpressBees" },
              { label: "Blue Dart", value: "Blue Dart" },
            ]}
            value={shippingCompany}
            onChange={setShippingCompany}
            error={errors.shippingCompany}
          />
        </FormLayout>
      </Modal.Section>
    </Modal>
  );
}
