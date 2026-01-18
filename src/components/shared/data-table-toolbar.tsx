"use client";

import * as React from "react";
import { Filter, X } from "lucide-react";
import { endOfDay, startOfMonth } from "date-fns";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateInput, parseDate } from "@/lib/format";
import { AccountCombobox, type AccountOption } from "@/components/shared/account-combobox";
import { CategoryCombobox } from "@/components/shared/category-combobox";
import type { Category, DateRange } from "@/types";
import { useDebounce } from "@/hooks/use-debounce";
import { DateRangeFilter, type PresetType } from "@/components/reports/date-range-filter";

interface DataTableToolbarProps {
  searchPlaceholder?: string;
  categories?: Category[];
  accounts?: AccountOption[];
}

const DEBOUNCE_MS = 300;
const DATE_FROM_KEY = "dateFrom";
const DATE_TO_KEY = "dateTo";
const DATE_PRESET_KEY = "datePreset";

function useDebouncedUrlUpdate(delay: number) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const scheduleUpdate = React.useCallback(
    (updater: (params: URLSearchParams) => void, immediate = false) => {
      const doUpdate = () => {
        const params = new URLSearchParams(searchParams.toString());
        updater(params);
        params.set("page", "1");

        router.push(`${pathname}?${params.toString()}`);
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

  const updateUrl = React.useCallback(
    (key: string, value: string, immediate = false) => {
      scheduleUpdate((params) => {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }, immediate);
    },
    [scheduleUpdate]
  );

  const updateUrlParams = React.useCallback(
    (updates: Record<string, string>, immediate = false) => {
      scheduleUpdate((params) => {
        for (const [key, value] of Object.entries(updates)) {
          if (value) {
            params.set(key, value);
          } else {
            params.delete(key);
          }
        }
      }, immediate);
    },
    [scheduleUpdate]
  );

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { updateUrl, updateUrlParams };
}

export function DataTableToolbar({
  searchPlaceholder = "Filter by description...",
  categories,
  accounts,
}: DataTableToolbarProps): React.ReactElement {
  const searchParams = useSearchParams();
  const { updateUrl, updateUrlParams } = useDebouncedUrlUpdate(DEBOUNCE_MS);
  const [filtersOpen, setFiltersOpen] = React.useState(false);

  const defaultDateRange = React.useMemo(() => {
    const today = new Date();
    return {
      from: startOfMonth(today),
      to: endOfDay(today),
    };
  }, []);

  // Local state for debounced inputs
  const [description, setDescription] = React.useState(searchParams.get("description") || "");
  const debouncedDescription = useDebounce(description, DEBOUNCE_MS);
  const descriptionDirtyRef = React.useRef(false);
  const skipDescriptionUpdateRef = React.useRef(false);
  const pendingPresetRef = React.useRef<PresetType | null>(null);

  const dateRange = React.useMemo<DateRange>(() => {
    const from = parseDate(
      searchParams.get(DATE_FROM_KEY) || formatDateInput(defaultDateRange.from)
    );
    const to = parseDate(
      searchParams.get(DATE_TO_KEY) || formatDateInput(defaultDateRange.to)
    );
    return { from, to };
  }, [searchParams, defaultDateRange]);

  const isPresetValue = React.useCallback((value: string | null): value is PresetType => {
    return (
      value === "this-month" ||
      value === "last-month" ||
      value === "last-90-days" ||
      value === "year-to-date" ||
      value === "last-year" ||
      value === "custom"
    );
  }, []);

  const presetParam = searchParams.get(DATE_PRESET_KEY);
  const activePreset = isPresetValue(presetParam) ? presetParam : undefined;

  // Direct URL values for selects
  const categoryId = searchParams.get("categoryId") || "";
  const accountId = searchParams.get("accountId") || "";

  const handleRangeChange = React.useCallback(
    (range: DateRange) => {
      const presetToApply = pendingPresetRef.current ?? activePreset ?? "custom";
      pendingPresetRef.current = null;
      updateUrlParams(
        {
          [DATE_FROM_KEY]: formatDateInput(range.from),
          [DATE_TO_KEY]: formatDateInput(range.to),
          [DATE_PRESET_KEY]: presetToApply,
        },
        true
      );
    },
    [activePreset, updateUrlParams]
  );

  const handlePresetChange = React.useCallback((preset: PresetType) => {
    pendingPresetRef.current = preset;
  }, []);

  const handleClearFilters = React.useCallback(() => {
    const resetFrom = defaultDateRange.from;
    const resetTo = defaultDateRange.to;
    descriptionDirtyRef.current = false;
    skipDescriptionUpdateRef.current = true;
    setDescription("");
    updateUrlParams(
      {
        description: "",
        accountId: "",
        categoryId: "",
        [DATE_FROM_KEY]: formatDateInput(resetFrom),
        [DATE_TO_KEY]: formatDateInput(resetTo),
        [DATE_PRESET_KEY]: "this-month",
      },
      true
    );
  }, [defaultDateRange, updateUrlParams]);

  React.useEffect(() => {
    const urlValue = searchParams.get("description") || "";
    if (descriptionDirtyRef.current) {
      return;
    }
    if (description !== urlValue) {
      setDescription(urlValue);
    }
  }, [description, searchParams]);

  // Debounced updates for text inputs
  React.useEffect(() => {
    const urlValue = searchParams.get("description") || "";
    const normalized = debouncedDescription.trim();
    if (skipDescriptionUpdateRef.current) {
      skipDescriptionUpdateRef.current = false;
      return;
    }
    if (normalized.length >= 3 && normalized !== urlValue) {
      updateUrl("description", normalized, true);
      descriptionDirtyRef.current = false;
      return;
    }
    if (normalized.length === 0 && urlValue !== "") {
      updateUrl("description", "", true);
      descriptionDirtyRef.current = false;
      return;
    }
    if (normalized.length === 0 && urlValue === "") {
      descriptionDirtyRef.current = false;
    }
  }, [debouncedDescription, searchParams, updateUrl]);

  return (
    <div className="flex items-center">
      <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="h-9 px-3">
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[calc(100vw-2rem)] p-4 sm:w-[320px]" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Date range</p>
              <DateRangeFilter
                range={dateRange}
                preset={activePreset}
                onRangeChange={handleRangeChange}
                onPresetChange={handlePresetChange}
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Description</p>
              <Input
                placeholder={searchPlaceholder}
                value={description}
                onChange={(e) => {
                  descriptionDirtyRef.current = true;
                  setDescription(e.target.value);
                }}
              />
            </div>

            {categories && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Category</p>
                <CategoryCombobox
                  categories={categories}
                  value={categoryId}
                  onValueChange={(value) => updateUrl("categoryId", value, true)}
                  allowCreate={false}
                  includeAllOption
                  allLabel="All categories"
                  placeholder="All categories"
                  searchPlaceholder="Search category..."
                />
              </div>
            )}

            {accounts && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Account</p>
                <AccountCombobox
                  accounts={accounts}
                  value={accountId}
                  onValueChange={(value) => updateUrl("accountId", value, true)}
                  allowCreate={false}
                  includeAllOption
                  allLabel="All accounts"
                  placeholder="All accounts"
                  searchPlaceholder="Search account..."
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
