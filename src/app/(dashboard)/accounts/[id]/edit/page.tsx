"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AccountForm } from "@/components/forms/account-form";
import { updateAccount } from "@/features/accounts/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Account } from "@/types";

export default function EditAccountPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [account, setAccount] = useState<Account | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const accountId = params.id as string;

  useEffect(() => {
    async function fetchAccount() {
      try {
        const response = await fetch(`/api/accounts/${accountId}`);
        if (response.ok) {
          const data = await response.json();
          setAccount(data);
        } else {
          router.push("/accounts");
        }
      } catch {
        router.push("/accounts");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAccount();
  }, [accountId, router]);

  const handleSubmit = async (formData: FormData) => {
    const result = await updateAccount(accountId, formData);

    if (result.success) {
      toast({
        title: "Account updated",
        description: "Your account has been updated successfully.",
      });
      router.push(`/accounts/${accountId}`);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update account",
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

  if (!account) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Account not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Account"
        description={`Editing ${account.name}`}
        action={
          <Button variant="outline" asChild>
            <Link href={`/accounts/${accountId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Account
            </Link>
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <AccountForm account={account} onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
