"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZES } from "./table-constants";

interface PageSizeSelectorProps {
  pageSize: number;
  onPageSizeChange: (pageSize: number) => void;
}

export function PageSizeSelector({
  pageSize,
  onPageSizeChange,
}: PageSizeSelectorProps) {
  const handlePageSizeChange = (newSize: string) => {
    const parsedSize = Number.parseInt(newSize, 10);
    if (Number.isNaN(parsedSize)) return;
    onPageSizeChange(parsedSize);
  };

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        Rows per page
      </span>
      <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
        <SelectTrigger className="w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PAGE_SIZES.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
