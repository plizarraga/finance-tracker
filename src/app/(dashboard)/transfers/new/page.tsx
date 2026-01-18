"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { TransferForm } from "@/components/forms/transfer-form";
import { createTransfer } from "@/features/transfers/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@/types";
import type { TransferInput } from "@/features/transfers/schemas";

export default function NewTransferPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Extract query params for pre-filling from template
  const defaultValues: Partial<TransferInput> = {
    fromAccountId: searchParams.get("fromAccountId") ?? undefined,
    toAccountId: searchParams.get("toAccountId") ?? undefined,
    amount: searchParams.get("amount")
      ? Number.parseFloat(searchParams.get("amount")!)
      : undefined,
    description: searchParams.get("description") ?? undefined,
  };

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const response = await fetch("/api/accounts");
        if (response.ok) {
          const data = await response.json();
          setAccounts(data);
        }
      } catch {
        toast({
          title: "Error",
          description: "Failed to load accounts",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccounts();
  }, [toast]);

  const handleSubmit = async (formData: FormData) => {
    const result = await createTransfer(formData);

    if (result.success) {
      toast({
        title: "Transfer created",
        description: "Your transfer has been created successfully.",
      });
      router.push("/transfers");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create transfer",
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

  if (accounts.length < 2) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="New Transfer"
          description="Transfer money between accounts"
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
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              You need at least 2 accounts to create a transfer.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/accounts/new">Create Account</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Transfer"
        description="Transfer money between accounts"
        action={
          <Button variant="outline" asChild>
            <Link href="/transfers">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Transfers
            </Link>
          </Button>
        }
      />

      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <TransferForm
            accounts={accounts}
            onSubmit={handleSubmit}
            defaultValues={defaultValues}
          />
        </CardContent>
      </Card>
    </div>
  );
}
