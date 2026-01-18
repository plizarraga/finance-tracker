import { notFound, redirect } from "next/navigation";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getTransferTemplateById } from "@/features/transfer-templates/queries";
import { EditTransferTemplateForm } from "@/components/transfers/edit-transfer-template-form";

interface EditTransferTemplatePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTransferTemplatePage({
  params,
}: EditTransferTemplatePageProps) {
  try {
    await requireAuth();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect("/login");
    }
    throw error;
  }

  const { id } = await params;
  const template = await getTransferTemplateById(id);

  if (!template) {
    notFound();
  }

  return (
    <div className="w-full max-w-2xl">
      <EditTransferTemplateForm templateId={id} template={template} />
    </div>
  );
}
