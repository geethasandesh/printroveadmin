import React, { useState, useCallback } from "react";
import { Button, Popover, OptionList } from "@shopify/polaris";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  error?: string;
}

export function MultiSelect({
  label,
  options,
  selected,
  onChange,
  error,
}: MultiSelectProps) {
  const [active, setActive] = useState(false);

  const toggleActive = useCallback(() => setActive((active) => !active), []);

  const selectedLabels = selected
    .map((value) => options.find((opt) => opt.value === value)?.label)
    .filter(Boolean)
    .join(", ");

  const activator = (
    <Button onClick={toggleActive} disclosure fullWidth textAlign="left">
      {selectedLabels || label}
    </Button>
  );

  return (
    <div>
      <div className="mb-1">
        <span className="block text-sm font-medium text-gray-700">{label}</span>
      </div>
      <Popover
        active={active}
        activator={activator}
        onClose={toggleActive}
        fullWidth
      >
        <div style={{ maxHeight: "250px", overflowY: "auto" }}>
          <OptionList
            title={label}
            onChange={onChange}
            options={options}
            selected={selected}
            allowMultiple
          />
        </div>
      </Popover>
      {error && <div className="mt-1 text-sm text-red-500">{error}</div>}
    </div>
  );
}
