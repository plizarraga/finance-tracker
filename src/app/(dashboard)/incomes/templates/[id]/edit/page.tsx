import { notFound, redirect } from "next/navigation";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getIncomeTemplateById } from "@/features/income-templates/queries";
import { EditIncomeTemplateForm } from "@/components/incomes/edit-income-template-form";

interface EditIncomeTemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditIncomeTemplatePage({
  params,
}: EditIncomeTemplatePageProps) {
  try {
    await requireAuth();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect("/login");
    }
    throw error;
  }

  const { id } = await params;
  const template = await getIncomeTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="w-full max-w-2xl">
      <EditIncomeTemplateForm templateId={id} template={template} />
    </div>
  );
}
