"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { AccountForm } from "@/components/forms/account-form";
import { createAccount } from "@/features/accounts/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function NewAccountPage() {
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = async (formData: FormData) => {
    const result = await createAccount(formData);

    if (result.success) {
      toast({
        title: "Account created",
        description: "Your new account has been created successfully.",
      });
      router.push("/accounts");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create account",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="New Account"
        description="Create a new financial account"
        action={
          <Button variant="outline" asChild>
            <Link href="/accounts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Accounts
            </Link>
          </Button>
        }
      />

      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <AccountForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
