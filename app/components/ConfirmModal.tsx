import React from "react";
import { Modal, Button, TextContainer } from "@shopify/polaris";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      primaryAction={{
        content: confirmLabel,
        destructive,
        onAction: onConfirm,
      }}
      secondaryActions={[
        {
          content: cancelLabel,
          onAction: onCancel,
        },
      ]}
    >
      <Modal.Section>
        <TextContainer>
          <p>{message}</p>
        </TextContainer>
      </Modal.Section>
    </Modal>
  );
};

export default ConfirmModal;
