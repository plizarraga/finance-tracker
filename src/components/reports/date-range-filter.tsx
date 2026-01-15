"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  getCurrentMonthRange,
  getPreviousMonthRange,
  getCurrentYearRange,
} from "@/lib/format";
import type { DateRange } from "@/types";
import { cn } from "@/lib/utils";

type PresetType = "this-month" | "last-month" | "this-year" | "custom";

interface DateRangeFilterProps {
  onRangeChange: (range: DateRange) => void;
  initialRange?: DateRange;
}

export function DateRangeFilter({
  onRangeChange,
  initialRange,
}: DateRangeFilterProps) {
  const [activePreset, setActivePreset] = useState<PresetType>("this-month");
  const [customRange, setCustomRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: initialRange?.from,
    to: initialRange?.to,
  });
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);

  const handlePresetClick = (preset: PresetType) => {
    setActivePreset(preset);

    let range: DateRange;
    switch (preset) {
      case "this-month":
        const currentMonth = getCurrentMonthRange();
        range = { from: currentMonth.start, to: currentMonth.end };
        break;
      case "last-month":
        const prevMonth = getPreviousMonthRange();
        range = { from: prevMonth.start, to: prevMonth.end };
        break;
      case "this-year":
        const year = getCurrentYearRange();
        range = { from: year.start, to: year.end };
        break;
      case "custom":
        // Don't trigger change yet, wait for date selection
        return;
      default:
        return;
    }

    onRangeChange(range);
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    const newRange = { ...customRange, from: date };
    setCustomRange(newRange);
    setIsFromOpen(false);

    if (newRange.from && newRange.to) {
      onRangeChange({ from: newRange.from, to: newRange.to });
    }
  };

  const handleToDateSelect = (date: Date | undefined) => {
    const newRange = { ...customRange, to: date };
    setCustomRange(newRange);
    setIsToOpen(false);

    if (newRange.from && newRange.to) {
      onRangeChange({ from: newRange.from, to: newRange.to });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex gap-1">
        <Button
          variant={activePreset === "this-month" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick("this-month")}
        >
          This Month
        </Button>
        <Button
          variant={activePreset === "last-month" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick("last-month")}
        >
          Last Month
        </Button>
        <Button
          variant={activePreset === "this-year" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick("this-year")}
        >
          This Year
        </Button>
        <Button
          variant={activePreset === "custom" ? "default" : "outline"}
          size="sm"
          onClick={() => handlePresetClick("custom")}
        >
          Custom
        </Button>
      </div>

      {activePreset === "custom" && (
        <div className="flex items-center gap-2">
          <Popover open={isFromOpen} onOpenChange={setIsFromOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
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

          <span className="text-muted-foreground">to</span>

          <Popover open={isToOpen} onOpenChange={setIsToOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "w-[140px] justify-start text-left font-normal",
                  !customRange.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {customRange.to
                  ? format(customRange.to, "MMM d, yyyy")
                  : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={customRange.to}
                onSelect={handleToDateSelect}
                disabled={(date) =>
                  customRange.from ? date < customRange.from : false
                }
              />
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
}
