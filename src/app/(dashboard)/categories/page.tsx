import Link from "next/link";
import { redirect } from "next/navigation";
import { Tag } from "lucide-react";
import { requireAuth, isUnauthorizedError } from "@/lib/prisma-helpers";
import { getCategories } from "@/features/categories/queries";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Category } from "@/types";

export default async function CategoriesPage() {
  try {
    await requireAuth();
  } catch (error) {
    if (isUnauthorizedError(error)) {
      redirect("/login");
    }
    throw error;
  }

  const categories = await getCategories();

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Manage your income and expense categories"
        action={
          <Button asChild>
            <Link href="/categories/new">
              <Tag className="mr-2 h-4 w-4" />
              New Category
            </Link>
          </Button>
        }
      />

      {categories.length === 0 ? (
        <EmptyState
          icon={<Tag className="h-8 w-8" />}
          title="No categories yet"
          description="Create your first category to start organizing your transactions."
          action={
            <Button asChild>
              <Link href="/categories/new">
                <Tag className="mr-2 h-4 w-4" />
                New Category
              </Link>
            </Button>
          }
        />
      ) : (
        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All ({categories.length})</TabsTrigger>
            <TabsTrigger value="income">
              Income ({incomeCategories.length})
            </TabsTrigger>
            <TabsTrigger value="expense">
              Expense ({expenseCategories.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <CategoryGrid categories={categories} />
          </TabsContent>

          <TabsContent value="income">
            {incomeCategories.length === 0 ? (
              <EmptyState
                icon={<Tag className="h-8 w-8" />}
                title="No income categories"
                description="Create an income category to organize your earnings."
                action={
                  <Button asChild>
                    <Link href="/categories/new">
                      <Tag className="mr-2 h-4 w-4" />
                      New Category
                    </Link>
                  </Button>
                }
              />
            ) : (
              <CategoryGrid categories={incomeCategories} />
            )}
          </TabsContent>

          <TabsContent value="expense">
            {expenseCategories.length === 0 ? (
              <EmptyState
                icon={<Tag className="h-8 w-8" />}
                title="No expense categories"
                description="Create an expense category to track your spending."
                action={
                  <Button asChild>
                    <Link href="/categories/new">
                      <Tag className="mr-2 h-4 w-4" />
                      New Category
                    </Link>
                  </Button>
                }
              />
            ) : (
              <CategoryGrid categories={expenseCategories} />
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function CategoryGrid({ categories }: { categories: Category[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Link key={category.id} href={`/categories/${category.id}/edit`}>
          <Card className="transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                {category.name}
              </CardTitle>
              <Badge
                variant={category.type === "income" ? "default" : "destructive"}
              >
                {category.type}
              </Badge>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">
                Created {category.createdAt.toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
