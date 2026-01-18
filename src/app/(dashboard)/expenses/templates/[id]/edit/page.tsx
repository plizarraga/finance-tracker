import { redirect, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getExpenseTemplateById } from "@/features/expense-templates/queries";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EditExpenseTemplateForm } from "@/components/expenses/edit-expense-template-form";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditExpenseTemplatePage({ params }: PageProps) {
  const { id } = await params;

  try {
    await requireAuth();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect("/login");
    }
    throw error;
  }

  const template = await getExpenseTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Edit Template"
        description={`Editing: ${template.name}`}
        action={
          <Button variant="outline" asChild>
            <Link href="/expenses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Link>
          </Button>
        }
      />

      <Card className="w-full max-w-2xl">
        <CardContent className="pt-6">
          <EditExpenseTemplateForm templateId={id} template={template} />
        </CardContent>
      </Card>
    </div>
  );
}
