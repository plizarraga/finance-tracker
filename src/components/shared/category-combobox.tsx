"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Category } from "@/types";
import { CategoryQuickCreateDialog } from "./category-quick-create-dialog";

interface CategoryComboboxProps {
  categories: Category[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  type?: "income" | "expense";
}

export function CategoryCombobox({
  categories,
  value,
  onValueChange,
  disabled,
  type = "expense",
}: CategoryComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [localCategories, setLocalCategories] = React.useState(categories);

  const selectedCategory = value ? localCategories.find((cat) => cat.id === value) : undefined;

  const handleCategoryCreated = (categoryId: string, categoryName: string) => {
    // Add new category to local list
    const newCategory: Category = {
      id: categoryId,
      name: categoryName,
      type: type,
      userId: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setLocalCategories([...localCategories, newCategory]);
    onValueChange(categoryId);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedCategory ? selectedCategory.name : "Select a category"}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search category..." />
            <CommandList>
              <CommandEmpty>No category found.</CommandEmpty>
              <CommandGroup>
                {localCategories.map((category) => (
                  <CommandItem
                    key={category.id}
                    value={category.name}
                    onSelect={() => {
                      onValueChange(category.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === category.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {category.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setDialogOpen(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Category
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <CategoryQuickCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCategoryCreated={handleCategoryCreated}
        type={type}
      />
    </>
  );
}
