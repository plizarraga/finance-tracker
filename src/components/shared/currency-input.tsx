"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value: number | string;
  onChange: (value: number) => void;
  currencySymbol?: string;
  className?: string;
}

export function CurrencyInput({
  value,
  onChange,
  currencySymbol = "$",
  className,
  ...props
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = React.useState<string>("");

  // Format number to display string
  const formatValue = (num: number): string => {
    if (isNaN(num) || num === 0) return "";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Parse display string to number
  const parseValue = (str: string): number => {
    // Remove currency symbol, commas, and spaces
    const cleaned = str.replace(/[^0-9.-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Initialize display value from prop
  React.useEffect(() => {
    const numValue = typeof value === "string" ? parseFloat(value) : value;
    if (!isNaN(numValue) && numValue !== 0) {
      setDisplayValue(formatValue(numValue));
    } else if (value === "" || value === 0) {
      setDisplayValue("");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty input
    if (inputValue === "") {
      setDisplayValue("");
      onChange(0);
      return;
    }

    // Remove non-numeric characters except decimal point and minus
    const cleaned = inputValue.replace(/[^0-9.-]/g, "");

    // Validate the cleaned input
    if (cleaned === "" || cleaned === "-" || cleaned === ".") {
      setDisplayValue(inputValue);
      return;
    }

    const numValue = parseFloat(cleaned);
    if (!isNaN(numValue)) {
      setDisplayValue(inputValue);
      onChange(numValue);
    }
  };

  const handleBlur = () => {
    const numValue = parseValue(displayValue);
    if (numValue !== 0) {
      setDisplayValue(formatValue(numValue));
    } else {
      setDisplayValue("");
    }
    onChange(numValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Show raw number on focus for easier editing
    const numValue = parseValue(displayValue);
    if (numValue !== 0) {
      setDisplayValue(numValue.toString());
    }
    e.target.select();
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {currencySymbol}
      </span>
      <Input
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onFocus={handleFocus}
        className={cn("pl-7", className)}
        {...props}
      />
    </div>
  );
}
