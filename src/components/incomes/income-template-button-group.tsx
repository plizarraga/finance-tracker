"use client";

import { useRouter } from "next/navigation";
import {
  Plus,
  ChevronDown,
  Star,
  Edit,
  Copy,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useState, useTransition } from "react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import type { IncomeTemplateWithRelations } from "@/features/income-templates/queries";
import {
  setDefaultIncomeTemplate,
  deleteIncomeTemplate,
  duplicateIncomeTemplate,
} from "@/features/income-templates/api";

interface IncomeTemplateButtonGroupProps {
  templates: IncomeTemplateWithRelations[];
  defaultTemplate: IncomeTemplateWithRelations | null;
  variant?: "default" | "destructive" | "outline";
  fullWidth?: boolean;
}

export function IncomeTemplateButtonGroup({
  templates,
  defaultTemplate,
  variant = "default",
  fullWidth = false,
}: IncomeTemplateButtonGroupProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreateFromTemplate = (template: IncomeTemplateWithRelations | null) => {
    if (!template) {
      router.push("/incomes/new");
      return;
    }

    const params = new URLSearchParams();
    if (template.accountId) params.set("accountId", template.accountId);
    if (template.categoryId) params.set("categoryId", template.categoryId);
    if (template.amount) params.set("amount", template.amount.toString());
    if (template.description) params.set("description", template.description);

    const queryString = params.toString();
    const url = `/incomes/new${queryString ? `?${queryString}` : ""}`;
    router.push(url);
  };

  const handleSetDefault = async (templateId: string) => {
    startTransition(async () => {
      const result = await setDefaultIncomeTemplate(templateId);

      if (result.success) {
        toast({
          title: "Default template updated",
          description: "This template is now your default.",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to set default template",
          variant: "destructive",
        });
      }
    });
  };

  const handleDuplicate = async (templateId: string) => {
    startTransition(async () => {
      const result = await duplicateIncomeTemplate(templateId);

      if (result.success) {
        toast({
          title: "Template duplicated",
          description: "A copy of the template has been created.",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to duplicate template",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = async () => {
    if (!templateToDelete) return;

    startTransition(async () => {
      const result = await deleteIncomeTemplate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);

      if (result.success) {
        toast({
          title: "Template deleted",
          description: "The template has been removed.",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete template",
          variant: "destructive",
        });
      }
    });
  };

  const handleUnsetDefault = async () => {
    startTransition(async () => {
      const result = await setDefaultIncomeTemplate(null);

      if (result.success) {
        toast({
          title: "Default removed",
          description: "No template is set as default.",
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to remove default template",
          variant: "destructive",
        });
      }
    });
  };

  const containerClassName = fullWidth ? "flex w-full gap-0.5" : "flex gap-0.5";
  const mainButtonClassName = `rounded-r-none${
    fullWidth ? " flex-1 min-w-0 justify-center" : ""
  }`;

  return (
    <>
      <div className={containerClassName}>
        <Button
          variant={variant}
          onClick={() => handleCreateFromTemplate(defaultTemplate)}
          className={mainButtonClassName}
        >
          <TrendingUp className="mr-2 h-4 w-4 shrink-0 text-green-600 dark:text-green-600" />
          <span className={fullWidth ? "truncate" : undefined}>
            {defaultTemplate ? defaultTemplate.name : "New Income"}
          </span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={variant}
              size="icon"
              className="rounded-l-none px-2 shrink-0"
            >
              <ChevronDown className="h-4 w-4" />
              <span className="sr-only">Template options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Templates</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {templates.map((template) => (
              <DropdownMenuSub key={template.id}>
                <DropdownMenuSubTrigger>
                  {template.isDefault && (
                    <Star className="mr-2 h-4 w-4 fill-yellow-500 text-yellow-500" />
                  )}
                  {template.name}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem
                    onClick={() => handleCreateFromTemplate(template)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Income
                  </DropdownMenuItem>
                  {template.isDefault ? (
                    <DropdownMenuItem
                      onClick={handleUnsetDefault}
                      disabled={isPending}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Unset as Default
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem
                      onClick={() => handleSetDefault(template.id)}
                      disabled={isPending}
                    >
                      <Star className="mr-2 h-4 w-4" />
                      Set as Default
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/incomes/templates/${template.id}/edit`)
                    }
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDuplicate(template.id)}
                    disabled={isPending}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setTemplateToDelete(template.id);
                      setDeleteDialogOpen(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            ))}

            {templates.length > 0 && <DropdownMenuSeparator />}

            <DropdownMenuItem
              onClick={() => router.push("/incomes/templates/new")}
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Template"
        description="Are you sure you want to delete this template? This action cannot be undone."
        onConfirm={handleDelete}
        destructive
        confirmText={isPending ? "Deleting..." : "Delete"}
      />
    </>
  );
}
