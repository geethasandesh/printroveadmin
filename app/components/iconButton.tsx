import React from "react";
import { Icon, IconSource } from "@shopify/polaris";

interface IconButtonProps {
  icon: IconSource;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
}

export function IconButton({
  icon,
  onClick,
  className = "",
  ariaLabel,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-2 rounded-md hover:bg-gray-100 transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <Icon source={icon} />
    </button>
  );
}
