"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { TransferForm } from "@/components/forms/transfer-form";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { updateTransfer, deleteTransfer } from "@/features/transfers/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { TransferWithRelations } from "@/features/transfers/queries";
import type { Account } from "@prisma/client";

export default function EditTransferPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [transfer, setTransfer] = useState<TransferWithRelations | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const transferId = params.id as string;

  useEffect(() => {
    async function fetchData() {
      try {
        const [transferResponse, accountsResponse] = await Promise.all([
          fetch(`/api/transfers/${transferId}`),
          fetch("/api/accounts"),
        ]);

        if (transferResponse.ok) {
          const transferData = await transferResponse.json();
          setTransfer(transferData);
        } else {
          router.push("/transfers");
          return;
        }

        if (accountsResponse.ok) {
          const accountsData = await accountsResponse.json();
          setAccounts(accountsData);
        }
      } catch {
        router.push("/transfers");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [transferId, router]);

  const handleSubmit = async (formData: FormData) => {
    const result = await updateTransfer(transferId, formData);

    if (result.success) {
      toast({
        title: "Transfer updated",
        description: "Your transfer has been updated successfully.",
      });
      router.push("/transfers");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update transfer",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    const result = await deleteTransfer(transferId);

    if (result.success) {
      toast({
        title: "Transfer deleted",
        description: "Your transfer has been deleted successfully.",
      });
      router.push("/transfers");
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete transfer",
        variant: "destructive",
      });
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!transfer) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Transfer not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Transfer"
        description={`Editing transfer from ${transfer.fromAccount.name} to ${transfer.toAccount.name}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
            <Button variant="outline" asChild>
              <Link href="/transfers">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Transfers
              </Link>
            </Button>
          </div>
        }
      />

      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <TransferForm
            transfer={transfer}
            accounts={accounts}
            onSubmit={handleSubmit}
          />
        </CardContent>
      </Card>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Transfer"
        description="Are you sure you want to delete this transfer? This action cannot be undone."
        onConfirm={handleDelete}
        destructive
        confirmText="Delete"
      />
    </div>
  );
}
