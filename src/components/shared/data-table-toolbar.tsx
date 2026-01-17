"use client";

import * as React from "react";
import { X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterOption {
  label: string;
  value: string;
}

interface DataTableToolbarProps {
  searchPlaceholder?: string;
  categoryOptions?: FilterOption[];
  accountOptions?: FilterOption[];
  fromAccountOptions?: FilterOption[];
  toAccountOptions?: FilterOption[];
}

const DEBOUNCE_MS = 300;
const FILTER_KEYS = [
  "description",
  "amountMin",
  "amountMax",
  "categoryId",
  "accountId",
  "fromAccountId",
  "toAccountId",
] as const;

type FilterKey = (typeof FILTER_KEYS)[number];

function useDebouncedUrlUpdate(delay: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const updateUrl = React.useCallback(
    (key: string, value: string, immediate = false) => {
      const doUpdate = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
        params.set("page", "1");

        router.push(`${pathname}?${params.toString()}`);
        router.refresh();
      };

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (immediate) {
        doUpdate();
      } else {
        timeoutRef.current = setTimeout(doUpdate, delay);
      }
    },
    [router, pathname, searchParams, delay]
  );

  const clearFilters = React.useCallback(
    (keys: readonly string[]) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const key of keys) {
        params.delete(key);
      }
      params.set("page", "1");
      router.push(`${pathname}?${params.toString()}`);
      router.refresh();
    },
    [router, pathname, searchParams]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { updateUrl, clearFilters };
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: FilterOption[];
}): React.ReactElement {
  return (
    <Select value={value || "all"} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function DataTableToolbar({
  searchPlaceholder = "Filter by description...",
  categoryOptions,
  accountOptions,
  fromAccountOptions,
  toAccountOptions,
}: DataTableToolbarProps): React.ReactElement {
  const searchParams = useSearchParams();
  const { updateUrl, clearFilters } = useDebouncedUrlUpdate(DEBOUNCE_MS);

  // Local state for debounced inputs
  const [description, setDescription] = React.useState(searchParams.get("description") || "");
  const [amountMin, setAmountMin] = React.useState(searchParams.get("amountMin") || "");
  const [amountMax, setAmountMax] = React.useState(searchParams.get("amountMax") || "");

  // Direct URL values for selects
  const categoryId = searchParams.get("categoryId") || "";
  const accountId = searchParams.get("accountId") || "";
  const fromAccountId = searchParams.get("fromAccountId") || "";
  const toAccountId = searchParams.get("toAccountId") || "";

  // Sync local state when URL changes (back/forward navigation)
  React.useEffect(() => {
    setDescription(searchParams.get("description") || "");
    setAmountMin(searchParams.get("amountMin") || "");
    setAmountMax(searchParams.get("amountMax") || "");
  }, [searchParams]);

  // Debounced updates for text inputs
  React.useEffect(() => {
    const urlValue = searchParams.get("description") || "";
    if (description !== urlValue) {
      updateUrl("description", description);
    }
  }, [description, searchParams, updateUrl]);

  React.useEffect(() => {
    const urlValue = searchParams.get("amountMin") || "";
    if (amountMin !== urlValue) {
      updateUrl("amountMin", amountMin);
    }
  }, [amountMin, searchParams, updateUrl]);

  React.useEffect(() => {
    const urlValue = searchParams.get("amountMax") || "";
    if (amountMax !== urlValue) {
      updateUrl("amountMax", amountMax);
    }
  }, [amountMax, searchParams, updateUrl]);

  const handleSelectChange = React.useCallback(
    (key: FilterKey, value: string) => {
      updateUrl(key, value === "all" ? "" : value, true);
    },
    [updateUrl]
  );

  const handleReset = React.useCallback(() => {
    setDescription("");
    setAmountMin("");
    setAmountMax("");
    clearFilters(FILTER_KEYS);
  }, [clearFilters]);

  const hasFilters =
    description || amountMin || amountMax || categoryId || accountId || fromAccountId || toAccountId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder={searchPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="sm:max-w-sm"
        />

        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min amount"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="w-32"
          />
          <Input
            type="number"
            placeholder="Max amount"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            className="w-32"
          />
        </div>

        {hasFilters && (
          <Button variant="ghost" onClick={handleReset} className="h-9 px-2 lg:px-3">
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {categoryOptions && (
          <FilterSelect
            value={categoryId}
            onChange={(value) => handleSelectChange("categoryId", value)}
            placeholder="All categories"
            options={categoryOptions}
          />
        )}

        {accountOptions && (
          <FilterSelect
            value={accountId}
            onChange={(value) => handleSelectChange("accountId", value)}
            placeholder="All accounts"
            options={accountOptions}
          />
        )}

        {fromAccountOptions && (
          <FilterSelect
            value={fromAccountId}
            onChange={(value) => handleSelectChange("fromAccountId", value)}
            placeholder="From account"
            options={fromAccountOptions}
          />
        )}

        {toAccountOptions && (
          <FilterSelect
            value={toAccountId}
            onChange={(value) => handleSelectChange("toAccountId", value)}
            placeholder="To account"
            options={toAccountOptions}
          />
        )}
      </div>
    </div>
  );
}
