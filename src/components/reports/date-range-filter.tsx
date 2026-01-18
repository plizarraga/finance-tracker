"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfMonth,
  startOfYear,
  subDays,
  subMonths,
  subYears,
} from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DateRange } from "@/types";
import { cn } from "@/lib/utils";

export type PresetType =
  | "this-month"
  | "last-month"
  | "last-90-days"
  | "year-to-date"
  | "last-year"
  | "custom";

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  range?: DateRange;
  preset?: PresetType;
  onPresetChange?: (preset: PresetType) => void;
  layout?: "compact" | "responsive" | "table";
}

export function DateRangeFilter({
  onRangeChange,
  range,
  preset,
  onPresetChange,
  layout = "compact",
}: DateRangeFilterProps) {
  const getPresetRange = React.useCallback((presetValue: PresetType): DateRange | null => {
    const today = new Date();

    switch (presetValue) {
      case "this-month": {
        return {
          from: startOfMonth(today),
          to: endOfDay(today),
        };
      }
      case "last-month": {
        const lastMonth = subMonths(today, 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      }
      case "last-90-days":
        return {
          from: subDays(today, 90),
          to: endOfDay(today),
        };
      case "year-to-date": {
        return {
          from: startOfYear(today),
          to: endOfDay(today),
        };
      }
      case "last-year": {
        const lastYear = subYears(today, 1);
        return {
          from: startOfYear(lastYear),
          to: endOfYear(lastYear),
        };
      }
      case "custom":
      default:
        return null;
    }
  }, []);

  const defaultRange = getPresetRange("this-month") ?? {
    from: new Date(),
    to: new Date(),
  };
  const [activePreset, setActivePreset] = React.useState<PresetType>(preset ?? "this-month");
  const [customRange, setCustomRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: range?.from ?? defaultRange.from,
    to: range?.to ?? defaultRange.to,
  });
  const [isFromOpen, setIsFromOpen] = React.useState(false);
  const [isToOpen, setIsToOpen] = React.useState(false);

  const resolvePresetFromDates = React.useCallback(
    (from: Date, to: Date) => {
      const candidates: PresetType[] = [
        "this-month",
        "last-month",
        "last-90-days",
        "year-to-date",
        "last-year",
      ];

      for (const candidate of candidates) {
        const candidateRange = getPresetRange(candidate);
        if (!candidateRange) {
          continue;
        }
        if (
          format(candidateRange.from, "yyyy-MM-dd") === format(from, "yyyy-MM-dd") &&
          format(candidateRange.to, "yyyy-MM-dd") === format(to, "yyyy-MM-dd")
        ) {
          return candidate;
        }
      }

      return "custom";
    },
    [getPresetRange]
  );

  React.useEffect(() => {
    if (range?.from && range?.to) {
      setCustomRange({ from: range.from, to: range.to });
    }
  }, [range?.from, range?.to]);

  React.useEffect(() => {
    if (preset) {
      setActivePreset(preset);
      return;
    }
    if (range?.from && range?.to) {
      setActivePreset(resolvePresetFromDates(range.from, range.to));
    }
  }, [preset, range?.from, range?.to, resolvePresetFromDates]);

  const handlePresetChange = (preset: PresetType) => {
    setActivePreset(preset);
    onPresetChange?.(preset);

    if (preset === "custom") {
      const today = new Date();
      const range = { from: startOfMonth(today), to: endOfDay(today) };
      setCustomRange(range);
      onRangeChange(range);
      return;
    }

    const range = getPresetRange(preset);
    if (!range) {
      return;
    }

    onRangeChange(range);
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    if (activePreset !== "custom") {
      setActivePreset("custom");
      onPresetChange?.("custom");
    }
    const newRange = { ...customRange, from: date };
    setCustomRange(newRange);
    setIsFromOpen(false);

    if (newRange.from && newRange.to) {
      onRangeChange({ from: newRange.from, to: newRange.to });
    }
  };

  const handleToDateSelect = (date: Date | undefined) => {
    if (activePreset !== "custom") {
      setActivePreset("custom");
      onPresetChange?.("custom");
    }
    const newRange = { ...customRange, to: date };
    setCustomRange(newRange);
    setIsToOpen(false);

    if (newRange.from && newRange.to) {
      onRangeChange({ from: newRange.from, to: newRange.to });
    }
  };

  const isResponsive = layout === "responsive";
  const isTable = layout === "table";

  return (
    <div
      className={cn(
        isResponsive
          ? "grid w-full gap-3 md:grid-cols-3 md:items-end"
          : isTable
            ? "grid w-full gap-3"
            : "flex flex-wrap items-center gap-3"
      )}
    >
      <div className="space-y-1">
        {isResponsive && (
          <p className="text-xs font-medium text-muted-foreground">By date</p>
        )}
        <Select
          value={activePreset}
          onValueChange={(value) => handlePresetChange(value as PresetType)}
        >
          <SelectTrigger
            className={cn(
              "h-9",
              isResponsive || isTable ? "w-full" : "w-[220px]"
            )}
          >
            <SelectValue placeholder="Select range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This Month</SelectItem>
            <SelectItem value="last-month">Last Month</SelectItem>
            <SelectItem value="last-90-days">Last 90 Days</SelectItem>
            <SelectItem value="year-to-date">Year to Date</SelectItem>
            <SelectItem value="last-year">Last Year</SelectItem>
            <SelectItem value="custom">Custom Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activePreset === "custom" && (
        <div
          className={cn(
            "gap-3",
            isResponsive
              ? "grid grid-cols-2 md:col-span-2"
              : isTable
                ? "grid grid-cols-2"
                : "flex flex-wrap items-end"
          )}
        >
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">From</p>
            <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    isResponsive || isTable ? "w-full" : "w-[140px]",
                    "justify-start text-left font-normal",
                    !customRange.from && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customRange.from
                    ? format(customRange.from, "MMM d, yyyy")
                    : "From date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customRange.from}
                  onSelect={handleFromDateSelect}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">To</p>
            <Popover open={isToOpen} onOpenChange={setIsToOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    isResponsive || isTable ? "w-full" : "w-[140px]",
                    "justify-start text-left font-normal",
                    !customRange.to && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {customRange.to ? format(customRange.to, "MMM d, yyyy") : "To date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customRange.to}
                  onSelect={handleToDateSelect}
                  disabled={(date) => (customRange.from ? date < customRange.from : false)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}
