"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TransferTemplateForm } from "@/components/forms/transfer-template-form";
import { updateTransferTemplate } from "@/features/transfer-templates/actions";
import { useToast } from "@/hooks/use-toast";
import type { TransferTemplateWithRelations } from "@/features/transfer-templates/queries";
import type { Account } from "@/types";

interface EditTransferTemplateFormProps {
  templateId: string;
  template: TransferTemplateWithRelations;
}

export function EditTransferTemplateForm({
  templateId,
  template,
}: EditTransferTemplateFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const accountsResponse = await fetch("/api/accounts");

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load form data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [toast]);

  const handleSubmit = async (formData: FormData) => {
    const result = await updateTransferTemplate(templateId, formData);

    if (result.success) {
      toast({
        title: "Template updated",
        description: "Your transfer template has been updated successfully.",
      });
      router.push("/transfers");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update template",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <TransferTemplateForm
      template={template}
      accounts={accounts}
      onSubmit={handleSubmit}
    />
  );
}
