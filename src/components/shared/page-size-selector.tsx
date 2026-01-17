"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
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
}

export function PageSizeSelector({ pageSize }: PageSizeSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handlePageSizeChange = (newSize: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("pageSize", newSize);
    // Reset to page 1 when changing page size
    params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
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
