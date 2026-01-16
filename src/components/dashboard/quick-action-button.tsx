"use client";

import { useRouter } from "next/navigation";
import { Plus, ChevronDown, ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

type TemplateType = "expense" | "income" | "transfer";

interface BaseTemplate {
  id: string;
  name: string;
  description?: string | null;
  accountId?: string | null;
  amount?: number | null;
  isDefault: boolean;
}

interface ExpenseIncomeTemplate extends BaseTemplate {
  categoryId?: string | null;
}

interface TransferTemplate extends BaseTemplate {
  fromAccountId?: string | null;
  toAccountId?: string | null;
}

type Template = ExpenseIncomeTemplate | TransferTemplate;

interface QuickActionButtonProps {
  type: TemplateType;
  templates: Template[];
  defaultTemplate: Template | null;
  variant?: "default" | "destructive" | "outline";
}

const config = {
  expense: {
    newLabel: "New Expense",
    createLabel: "Create Expense",
    icon: Plus,
    basePath: "/expenses",
    viewAllLabel: "View all expenses",
  },
  income: {
    newLabel: "New Income",
    createLabel: "Create Income",
    icon: Plus,
    basePath: "/incomes",
    viewAllLabel: "View all incomes",
  },
  transfer: {
    newLabel: "New Transfer",
    createLabel: "Create Transfer",
    icon: ArrowLeftRight,
    basePath: "/transfers",
    viewAllLabel: "View all transfers",
  },
} as const;

export function QuickActionButton({
  type,
  templates,
  defaultTemplate,
  variant = "default",
}: QuickActionButtonProps) {
  const router = useRouter();
  const { newLabel, createLabel, icon: Icon, basePath, viewAllLabel } = config[type];

  const buildTemplateUrl = (template: Template | null): string => {
    if (!template) {
      return `${basePath}/new`;
    }

    const params = new URLSearchParams();

    // Common fields
    if (template.accountId) params.set("accountId", template.accountId);
    if (template.amount) params.set("amount", template.amount.toString());
    if (template.description) params.set("description", template.description);

    // Type-specific fields
    if (type === "expense" || type === "income") {
      const t = template as ExpenseIncomeTemplate;
      if (t.categoryId) params.set("categoryId", t.categoryId);
    } else if (type === "transfer") {
      const t = template as TransferTemplate;
      if (t.fromAccountId) params.set("fromAccountId", t.fromAccountId);
      if (t.toAccountId) params.set("toAccountId", t.toAccountId);
    }

    const queryString = params.toString();
    return `${basePath}/new${queryString ? `?${queryString}` : ""}`;
  };

  const handleCreateFromTemplate = (template: Template | null) => {
    const url = buildTemplateUrl(template);
    router.push(url);
  };

  // If no templates, show simple button
  if (templates.length === 0) {
    return (
      <Button variant={variant} onClick={() => handleCreateFromTemplate(null)}>
        <Icon className="mr-2 h-4 w-4" />
        {newLabel}
      </Button>
    );
  }

  return (
    <div className="flex gap-0.5">
      <Button
        variant={variant}
        onClick={() => handleCreateFromTemplate(defaultTemplate)}
        className="rounded-r-none"
      >
        <Icon className="mr-2 h-4 w-4" />
        {defaultTemplate ? defaultTemplate.name : newLabel}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size="icon" className="rounded-l-none px-2">
            <ChevronDown className="h-4 w-4" />
            <span className="sr-only">More template options</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Templates</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {templates.map((template) => (
            <DropdownMenuItem
              key={template.id}
              onClick={() => handleCreateFromTemplate(template)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {template.name}
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => handleCreateFromTemplate(null)}>
            <Plus className="mr-2 h-4 w-4" />
            {createLabel}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => router.push(basePath)}>
            {viewAllLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
