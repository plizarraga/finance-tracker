import { type Column } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

function SortIcon<TData, TValue>({
  column,
}: {
  column: Column<TData, TValue>;
}): React.ReactElement {
  const sortDirection = column.getIsSorted();

  if (sortDirection === "asc") {
    return <ArrowUp className="h-4 w-4" />;
  }

  if (sortDirection === "desc") {
    return <ArrowDown className="h-4 w-4" />;
  }

  return <ArrowUpDown className="h-4 w-4 opacity-50" />;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>): React.ReactElement {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 cursor-pointer select-none hover:text-foreground transition-colors",
        className
      )}
      onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
    >
      {title}
      <SortIcon column={column} />
    </div>
  );
}
