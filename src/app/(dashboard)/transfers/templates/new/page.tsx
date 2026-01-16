"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { TransferTemplateForm } from "@/components/forms/transfer-template-form";
import { createTransferTemplate } from "@/features/transfer-templates/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@/types";

export default function NewTransferTemplatePage() {
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
    const result = await createTransferTemplate(formData);

    if (result.success) {
      toast({
        title: "Template created",
        description: "Your transfer template has been created successfully.",
      });
      router.push("/transfers");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create template",
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
    <div className="space-y-6">
      <PageHeader
        title="New Transfer Template"
        description="Create a template for quick transfer entry"
        action={
          <Button variant="outline" asChild>
            <Link href="/transfers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transfers
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <TransferTemplateForm accounts={accounts} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
