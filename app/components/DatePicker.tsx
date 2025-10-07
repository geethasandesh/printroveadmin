import {
  DatePicker as PolarisDatePicker,
  TextField,
  Popover,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { format } from "date-fns";

interface CustomDatePickerProps {
  label?: string;
  selected: Date;
  onChange: (date: Date) => void;
}

export function CustomDatePicker({
  label,
  selected,
  onChange,
}: CustomDatePickerProps) {
  const [popoverActive, setPopoverActive] = useState(false);
  const [{ month, year }, setDate] = useState(() => {
    const date = selected || new Date();
    return {
      month: date.getMonth(),
      year: date.getFullYear(),
    };
  });

  const handleMonthChange = useCallback(
    (month: number, year: number) => setDate({ month, year }),
    []
  );

  const handleChange = (selectedDates: { start: Date; end: Date }) => {
    onChange(selectedDates.start);
    setPopoverActive(false);
  };

  const togglePopoverActive = useCallback(
    () => setPopoverActive((popoverActive) => !popoverActive),
    []
  );

  const activator = (
    <div onClick={togglePopoverActive}>
      <TextField
        label={label}
        value={format(selected, "dd MMM yyyy")}
        autoComplete="off"
        readOnly
      />
    </div>
  );

  return (
    <Popover
      active={popoverActive}
      activator={activator}
      onClose={() => setPopoverActive(false)}
      autofocusTarget="none"
    >
      <div className="p-4">
        <PolarisDatePicker
          month={month}
          year={year}
          onChange={handleChange}
          onMonthChange={handleMonthChange}
          selected={{
            start: selected,
            end: selected,
          }}
        />
      </div>
    </Popover>
  );
}
