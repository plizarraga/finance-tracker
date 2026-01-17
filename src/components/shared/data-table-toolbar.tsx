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

export function DataTableToolbar({
  searchPlaceholder = "Filter by description...",
  categoryOptions,
  accountOptions,
  fromAccountOptions,
  toAccountOptions,
}: DataTableToolbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const [description, setDescription] = React.useState(
    searchParams.get("description") || ""
  );
  const [amountMin, setAmountMin] = React.useState(
    searchParams.get("amountMin") || ""
  );
  const [amountMax, setAmountMax] = React.useState(
    searchParams.get("amountMax") || ""
  );

  const categoryId = searchParams.get("categoryId") || "";
  const accountId = searchParams.get("accountId") || "";
  const fromAccountId = searchParams.get("fromAccountId") || "";
  const toAccountId = searchParams.get("toAccountId") || "";

  // Debounce search
  const debouncedUpdate = React.useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParamsString);
      const currentValue = params.get(key) || "";
      if (currentValue === value) {
        return;
      }
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      // Reset to page 1 when filtering
      params.set("page", "1");
      const nextQuery = params.toString();
      if (nextQuery !== searchParamsString) {
        router.push(`${pathname}?${nextQuery}`);
      }
    },
    [pathname, router, searchParamsString]
  );

  React.useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdate("description", description);
    }, 300);
    return () => clearTimeout(timer);
  }, [description, debouncedUpdate]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdate("amountMin", amountMin);
    }, 300);
    return () => clearTimeout(timer);
  }, [amountMin, debouncedUpdate]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      debouncedUpdate("amountMax", amountMax);
    }, 300);
    return () => clearTimeout(timer);
  }, [amountMax, debouncedUpdate]);

  const handleSelectChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParamsString);
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");
    const nextQuery = params.toString();
    if (nextQuery !== searchParamsString) {
      router.push(`${pathname}?${nextQuery}`);
    }
  };

  const handleReset = () => {
    setDescription("");
    setAmountMin("");
    setAmountMax("");
    const params = new URLSearchParams(searchParamsString);
    params.delete("description");
    params.delete("amountMin");
    params.delete("amountMax");
    params.delete("categoryId");
    params.delete("accountId");
    params.delete("fromAccountId");
    params.delete("toAccountId");
    params.set("page", "1");
    const nextQuery = params.toString();
    if (nextQuery !== searchParamsString) {
      router.push(`${pathname}?${nextQuery}`);
    }
  };

  const hasFilters =
    description ||
    amountMin ||
    amountMax ||
    categoryId ||
    accountId ||
    fromAccountId ||
    toAccountId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Description filter */}
        <Input
          placeholder={searchPlaceholder}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="sm:max-w-sm"
        />

        {/* Amount range */}
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
          <Button
            variant="ghost"
            onClick={handleReset}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <X className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Category filter */}
        {categoryOptions && (
          <Select
            value={categoryId || "all"}
            onValueChange={(value) => handleSelectChange("categoryId", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categoryOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Account filter */}
        {accountOptions && (
          <Select
            value={accountId || "all"}
            onValueChange={(value) => handleSelectChange("accountId", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All accounts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {accountOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* From Account filter */}
        {fromAccountOptions && (
          <Select
            value={fromAccountId || "all"}
            onValueChange={(value) =>
              handleSelectChange("fromAccountId", value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="From account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {fromAccountOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* To Account filter */}
        {toAccountOptions && (
          <Select
            value={toAccountId || "all"}
            onValueChange={(value) => handleSelectChange("toAccountId", value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="To account" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All accounts</SelectItem>
              {toAccountOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
}
