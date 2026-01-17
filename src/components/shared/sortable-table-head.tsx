"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface SortableTableHeadProps {
  column: string;
  children: React.ReactNode;
  className?: string;
}

export function SortableTableHead({
  column,
  children,
  className,
}: SortableTableHeadProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSortBy = searchParams.get("sortBy") || "date";
  const currentSortOrder = searchParams.get("sortOrder") || "desc";

  const isActive = currentSortBy === column;
  const nextOrder =
    !isActive || currentSortOrder === "asc" ? "desc" : "asc";

  const handleSort = () => {
    const params = new URLSearchParams(searchParams);
    params.set("sortBy", column);
    params.set("sortOrder", nextOrder);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <TableHead className={cn("cursor-pointer select-none", className)}>
      <div
        className="flex items-center gap-2 hover:text-foreground transition-colors"
        onClick={handleSort}
      >
        {children}
        {isActive ? (
          currentSortOrder === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </div>
    </TableHead>
  );
}
