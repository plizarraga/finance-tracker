# Templates System Implementation Plan

**Status:** ✅ COMPLETED
**Version:** 1.0
**Last Updated:** 2026-01-16

---

## Executive Summary

Implementation of a Notion-inspired Templates system for Finance Tracker, enabling users to create reusable templates for quick data entry across Expenses, Incomes, and Transfers. Additionally implemented inline category creation with search functionality.

### Key Features Delivered
- ✅ Named templates with pre-filled values
- ✅ Default template system (one per module)
- ✅ Notion-style Button Group UI with dropdown
- ✅ Template management (CRUD + Duplicate)
- ✅ Query parameter-based form pre-filling
- ✅ Inline category creation with search (Expenses & Incomes)
- ✅ Decimal serialization for Client Components
- ✅ Atomic default template updates via transactions

---

## Module 1: Expense Templates

**Status:** ✅ COMPLETED

### Checklist

#### Phase 1: Database Schema
- [x] Add `ExpenseTemplate` model to Prisma schema
- [x] Add User relation: `expenseTemplates ExpenseTemplate[]`
- [x] Add Account relation: `expenseTemplates ExpenseTemplate[]`
- [x] Add Category relation: `expenseTemplates ExpenseTemplate[]`
- [x] Configure `onDelete: SetNull` for account/category
- [x] Apply schema to database (`pnpm prisma:push`)
- [x] Generate Prisma client (`pnpm prisma:generate`)

#### Phase 2: Backend Features
- [x] Create `src/features/expense-templates/schemas.ts`
  - [x] `expenseTemplateSchema` (client-side validation)
  - [x] `expenseTemplateServerSchema` (server-side with coercion)
  - [x] `ExpenseTemplateInput` type export
- [x] Create `src/features/expense-templates/queries.ts`
  - [x] `getExpenseTemplates()` - Fetch all with relations
  - [x] `getDefaultExpenseTemplate()` - Get default template
  - [x] `getExpenseTemplateById(id)` - Get single template
  - [x] Implement Decimal serialization for Client Components
  - [x] Export `ExpenseTemplateWithRelations` type
- [x] Create `src/features/expense-templates/actions.ts`
  - [x] `createExpenseTemplate(formData)` - Create new template
  - [x] `updateExpenseTemplate(id, formData)` - Update template
  - [x] `deleteExpenseTemplate(id)` - Delete template
  - [x] `duplicateExpenseTemplate(id)` - Duplicate with " (Copy)"
  - [x] `setDefaultExpenseTemplate(id | null)` - Set/unset default
  - [x] Implement ownership verification
  - [x] Implement atomic transactions for default updates

#### Phase 3: UI Components
- [x] Create `src/components/forms/expense-template-form.tsx`
  - [x] Form with react-hook-form + Zod validation
  - [x] Fields: name (required), accountId, categoryId, amount, description
  - [x] Integration with CategoryCombobox
  - [x] `normalizeAmount()` helper for Decimal conversion
- [x] Create `src/components/expenses/expense-template-button-group.tsx`
  - [x] Notion-style Button Group (primary + dropdown)
  - [x] Default template with ⭐ inline (no separate section)
  - [x] Nested dropdown menus for template actions
  - [x] Actions: Create, Set/Unset Default, Edit, Duplicate, Delete
  - [x] Confirmation dialog for delete
  - [x] "Unset as Default" option in submenu
- [x] Create `src/components/expenses/edit-expense-template-form.tsx`
  - [x] Client wrapper for edit page
  - [x] Fetch accounts/categories on mount
  - [x] Handle form submission

#### Phase 4: Form Enhancement
- [x] Modify `src/components/forms/expense-form.tsx`
  - [x] Add `defaultValues?: Partial<ExpenseInput>` prop
  - [x] Update form defaultValues to use prop
  - [x] Replace category Select with CategoryCombobox
- [x] Update `src/app/(dashboard)/expenses/new/page.tsx`
  - [x] Import `useSearchParams`
  - [x] Extract query params (accountId, categoryId, amount, description)
  - [x] Pass defaultValues to ExpenseForm
- [x] Update `src/app/(dashboard)/expenses/page.tsx`
  - [x] Fetch templates and defaultTemplate in parallel
  - [x] Replace Button with ExpenseTemplateButtonGroup

#### Phase 5: Template Management Pages
- [x] Create `src/app/(dashboard)/expenses/templates/new/page.tsx`
  - [x] Client component with data fetching
  - [x] Render ExpenseTemplateForm
  - [x] Handle template creation
  - [x] Redirect to `/expenses` on success
- [x] Create `src/app/(dashboard)/expenses/templates/[id]/edit/page.tsx`
  - [x] Server component (async)
  - [x] Fetch template by id
  - [x] Handle not found
  - [x] Render EditExpenseTemplateForm
- [x] Fix Select.Item empty string value error
  - [x] Use "none" instead of ""
  - [x] Convert "none" → null in onChange
- [x] Fix Decimal serialization error
  - [x] Create serialization function in queries
  - [x] Update type to use number | null

#### Phase 6: Verification
- [x] Can create template with all fields
- [x] Can create template with only name
- [x] Can set/unset default template
- [x] Only one default at a time
- [x] Button shows default template name
- [x] Default highlighted with ⭐
- [x] Form pre-fills from template via query params
- [x] Can edit template
- [x] Can duplicate template
- [x] Can delete template with confirmation
- [x] Deleted accounts/categories become null (not broken)
- [x] Build succeeds without errors

---

## Module 2: Income Templates

**Status:** ✅ COMPLETED

### Checklist

#### Phase 1: Database Schema
- [x] Add `IncomeTemplate` model to Prisma schema
- [x] Add User relation: `incomeTemplates IncomeTemplate[]`
- [x] Add Account relation: `incomeTemplates IncomeTemplate[]`
- [x] Add Category relation: `incomeTemplates IncomeTemplate[]`
- [x] Configure `onDelete: SetNull` for account/category
- [x] Apply schema to database (`pnpm prisma:push`)
- [x] Generate Prisma client (`pnpm prisma:generate`)

#### Phase 2: Backend Features
- [x] Create `src/features/income-templates/schemas.ts`
  - [x] `incomeTemplateSchema` (client-side validation)
  - [x] `incomeTemplateServerSchema` (server-side with coercion)
  - [x] `IncomeTemplateInput` type export
- [x] Create `src/features/income-templates/queries.ts`
  - [x] `getIncomeTemplates()` - Fetch all with relations
  - [x] `getDefaultIncomeTemplate()` - Get default template
  - [x] `getIncomeTemplateById(id)` - Get single template
  - [x] Implement Decimal serialization
  - [x] Export `IncomeTemplateWithRelations` type
- [x] Create `src/features/income-templates/actions.ts`
  - [x] `createIncomeTemplate(formData)` - Create new template
  - [x] `updateIncomeTemplate(id, formData)` - Update template
  - [x] `deleteIncomeTemplate(id)` - Delete template
  - [x] `duplicateIncomeTemplate(id)` - Duplicate with " (Copy)"
  - [x] `setDefaultIncomeTemplate(id | null)` - Set/unset default
  - [x] Validate category type is "income"

#### Phase 3: UI Components
- [x] Create `src/components/forms/income-template-form.tsx`
  - [x] Form with react-hook-form + Zod validation
  - [x] Fields: name (required), accountId, categoryId, amount, description
  - [x] Integration with CategoryCombobox (type="income")
  - [x] `normalizeAmount()` helper
- [x] Create `src/components/incomes/income-template-button-group.tsx`
  - [x] Notion-style Button Group
  - [x] Default template with ⭐ inline
  - [x] Nested dropdown menus
  - [x] All template actions
- [x] Create `src/components/incomes/edit-income-template-form.tsx`
  - [x] Client wrapper for edit page
  - [x] Fetch accounts/categories on mount
  - [x] Handle form submission

#### Phase 4: Form Enhancement
- [x] Modify `src/components/forms/income-form.tsx`
  - [x] Add `defaultValues?: Partial<IncomeInput>` prop
  - [x] Update form defaultValues
  - [x] Replace category Select with CategoryCombobox (type="income")
- [x] Update `src/app/(dashboard)/incomes/new/page.tsx`
  - [x] Import `useSearchParams`
  - [x] Extract query params
  - [x] Pass defaultValues to IncomeForm
- [x] Update `src/app/(dashboard)/incomes/page.tsx`
  - [x] Fetch templates and defaultTemplate
  - [x] Replace Button with IncomeTemplateButtonGroup

#### Phase 5: Template Management Pages
- [x] Create `src/app/(dashboard)/incomes/templates/new/page.tsx`
  - [x] Client component with data fetching
  - [x] Render IncomeTemplateForm
  - [x] Handle creation with type="income" categories
- [x] Create `src/app/(dashboard)/incomes/templates/[id]/edit/page.tsx`
  - [x] Server component (async)
  - [x] Fetch template by id
  - [x] Render EditIncomeTemplateForm

#### Phase 6: Verification
- [x] Can create income template with all fields
- [x] Can set/unset default template
- [x] Form pre-fills from template
- [x] CategoryCombobox filters income categories
- [x] Can create income categories inline
- [x] Can edit/duplicate/delete templates
- [x] Build succeeds without errors

---

## Module 3: Transfer Templates

**Status:** ✅ COMPLETED

### Checklist

#### Phase 1: Database Schema
- [x] Add `TransferTemplate` model to Prisma schema
- [x] Add User relation: `transferTemplates TransferTemplate[]`
- [x] Add Account relations for from/to:
  - [x] `transferTemplatesFrom TransferTemplate[]`
  - [x] `transferTemplatesTo TransferTemplate[]`
- [x] Configure `onDelete: SetNull` for both accounts
- [x] Apply schema to database (`pnpm prisma:push`)
- [x] Generate Prisma client (`pnpm prisma:generate`)

#### Phase 2: Backend Features
- [x] Create `src/features/transfer-templates/schemas.ts`
  - [x] `transferTemplateSchema` (client-side validation)
  - [x] `transferTemplateServerSchema` (server-side with coercion)
  - [x] `TransferTemplateInput` type export
- [x] Create `src/features/transfer-templates/queries.ts`
  - [x] `getTransferTemplates()` - Fetch all with relations
  - [x] `getDefaultTransferTemplate()` - Get default template
  - [x] `getTransferTemplateById(id)` - Get single template
  - [x] Implement Decimal serialization
  - [x] Export `TransferTemplateWithRelations` type
  - [x] Fix import path from `@/lib/prisma` to `@/lib/auth`
- [x] Create `src/features/transfer-templates/actions.ts`
  - [x] `createTransferTemplate(formData)` - Create new template
  - [x] `updateTransferTemplate(id, formData)` - Update template
  - [x] `deleteTransferTemplate(id)` - Delete template
  - [x] `duplicateTransferTemplate(id)` - Duplicate with " (Copy)"
  - [x] `setDefaultTransferTemplate(id | null)` - Set/unset default
  - [x] Validate both fromAccount and toAccount ownership
  - [x] Fix import path from `@/lib/prisma` to `@/lib/auth`

#### Phase 3: UI Components
- [x] Create `src/components/forms/transfer-template-form.tsx`
  - [x] Form with react-hook-form + Zod validation
  - [x] Fields: name (required), fromAccountId, toAccountId, amount, description
  - [x] Select components for both accounts
  - [x] `normalizeAmount()` helper
- [x] Create `src/components/transfers/transfer-template-button-group.tsx`
  - [x] Notion-style Button Group
  - [x] Default template with ⭐ inline
  - [x] Nested dropdown menus
  - [x] All template actions
- [x] Create `src/components/transfers/edit-transfer-template-form.tsx`
  - [x] Client wrapper for edit page
  - [x] Fetch accounts on mount
  - [x] Handle form submission

#### Phase 4: Form Enhancement
- [x] Modify `src/components/forms/transfer-form.tsx`
  - [x] Add `defaultValues?: Partial<TransferInput>` prop
  - [x] Update form defaultValues
- [x] Update `src/app/(dashboard)/transfers/new/page.tsx`
  - [x] Import `useSearchParams`
  - [x] Extract query params (fromAccountId, toAccountId, amount, description)
  - [x] Pass defaultValues to TransferForm
- [x] Update `src/app/(dashboard)/transfers/page.tsx`
  - [x] Fetch templates and defaultTemplate
  - [x] Replace Button with TransferTemplateButtonGroup

#### Phase 5: Template Management Pages
- [x] Create `src/app/(dashboard)/transfers/templates/new/page.tsx`
  - [x] Client component with data fetching
  - [x] Render TransferTemplateForm
  - [x] Handle creation
- [x] Create `src/app/(dashboard)/transfers/templates/[id]/edit/page.tsx`
  - [x] Server component (async)
  - [x] Fetch template by id
  - [x] Render EditTransferTemplateForm

#### Phase 6: Bug Fixes & Verification
- [x] Fix Prisma client not including TransferTemplate
  - [x] Regenerate Prisma client
  - [x] Restart dev server
- [x] Can create transfer template with all fields
- [x] Can set/unset default template
- [x] Form pre-fills from template
- [x] Can edit/duplicate/delete templates
- [x] Build succeeds without errors

---

## Feature: Inline Category Creation & Search

**Status:** ✅ COMPLETED

### Overview
Enhanced expense and income forms with inline category creation and search functionality, eliminating the need to navigate away from the form.

### Checklist

#### Phase 1: UI Components
- [x] Install Command component from shadcn/ui
- [x] Create `src/components/expenses/category-combobox.tsx`
  - [x] Search functionality using Command component
  - [x] "+ Create Category" option at bottom
  - [x] Generic with `type?: "income" | "expense"` prop
  - [x] Filter categories by type
  - [x] Local state management for newly created categories
- [x] Create `src/components/expenses/category-quick-create-dialog.tsx`
  - [x] Modal dialog for quick category creation
  - [x] Name input with autofocus
  - [x] Generic with `type?: "income" | "expense"` prop
  - [x] Callback: `onCategoryCreated(categoryId, categoryName)`
  - [x] Auto-select created category

#### Phase 2: Backend Enhancement
- [x] Modify `src/features/categories/actions.ts`
  - [x] Update `createCategory` return type to include data
  - [x] Return `{ success: true, data: { id, name } }` on success
  - [x] Maintain backward compatibility

#### Phase 3: Integration
- [x] Integrate CategoryCombobox in ExpenseForm
  - [x] Replace category Select
  - [x] Pass `type="expense"`
- [x] Integrate CategoryCombobox in ExpenseTemplateForm
  - [x] Replace category Select
  - [x] Pass `type="expense"`
- [x] Integrate CategoryCombobox in IncomeForm
  - [x] Replace category Select
  - [x] Pass `type="income"`
- [x] Integrate CategoryCombobox in IncomeTemplateForm
  - [x] Replace category Select
  - [x] Pass `type="income"`

#### Phase 4: Verification
- [x] Can search categories by name
- [x] Can create expense category without leaving form
- [x] Can create income category without leaving form
- [x] Newly created category appears in list immediately
- [x] Newly created category is auto-selected
- [x] Works in both create and edit forms
- [x] Works in both regular forms and template forms

---

## Technical Architecture

### Database Schema Pattern

All template models follow the same structure:

```prisma
model [Module]Template {
  id          String   @id @default(uuid)
  userId      String
  name        String   @db.VarChar(100)
  // Module-specific fields (all optional except name)
  amount      Decimal? @db.Decimal(12, 2)
  description String?  @db.Text
  isDefault   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations with onDelete: SetNull
  user     User
  // Module-specific relations...
}
```

### Feature Organization

```
src/features/[module]-templates/
├── actions.ts      # Route handler actions (create, update, delete, duplicate, setDefault)
├── queries.ts      # Data fetching with Decimal serialization
└── schemas.ts      # Zod validation (client + server)
```

### Component Pattern

```
src/components/[module]/
├── [module]-template-button-group.tsx  # Notion-style UI
└── edit-[module]-template-form.tsx     # Edit wrapper

src/components/forms/
├── [module]-template-form.tsx          # Template form
└── [module]-form.tsx                   # Enhanced with defaultValues prop

src/components/shared/
├── account-combobox.tsx                # Account selector with search
└── account-quick-create-dialog.tsx     # Inline account creation
```

### Key Design Decisions

1. **Decimal Serialization**: Convert Prisma Decimal to number before passing to Client Components
   ```typescript
   function serializeTemplate(template): TemplateWithRelations {
     return {
       ...template,
       amount: template.amount ? template.amount.toNumber() : null,
     };
   }
   ```

2. **Atomic Default Updates**: Use transactions to ensure only one default template
   ```typescript
   await prisma.$transaction([
     prisma.[module]Template.updateMany({
       where: { userId, isDefault: true },
       data: { isDefault: false },
     }),
     prisma.[module]Template.update({
       where: { id },
       data: { isDefault: true },
     }),
   ]);
   ```

3. **Query Parameter Pre-filling**: Templates redirect with query params
   ```typescript
   const params = new URLSearchParams();
   if (template.accountId) params.set("accountId", template.accountId);
   router.push(`/[module]/new?${params.toString()}`);
   ```

4. **Generic Category Components**: Support both income and expense types
   ```typescript
   interface CategoryComboboxProps {
     type?: "income" | "expense";
     // ...
   }
   ```

---

## UX Improvements

### Simplified Default Template UI
- ✅ Removed "Default Template" label
- ✅ Show only ⭐ inline with template name
- ✅ "Unset as Default" option in submenu (1 click)
- ✅ Unified template list (no separate sections)

### Inline Category Management
- ✅ Search categories without leaving form
- ✅ Create categories via quick dialog
- ✅ Auto-select newly created category
- ✅ Local state update for immediate feedback

### Notion-Style Interactions
- ✅ Primary button shows default template name
- ✅ Dropdown with nested submenus per template
- ✅ Actions organized by frequency of use
- ✅ Destructive actions separated with divider

---

## Performance Considerations

- ✅ Parallel data fetching in page components
- ✅ Optimistic UI updates via `router.refresh()`
- ✅ Indexed fields: userId, accountId, categoryId
- ✅ Efficient default lookup with `findFirst`
- ✅ Minimal re-renders with `useTransition`

---

## Security & Validation

- ✅ All actions verify `userId` via `requireAuth()`
- ✅ Account/category ownership validated before save
- ✅ Template ownership verified before update/delete
- ✅ XSS protection via React's built-in escaping
- ✅ SQL injection prevention via Prisma parameterized queries
- ✅ Zod validation on both client and server

---

## Edge Cases Handled

1. **No Default Template**: Button shows generic text ("New [Module]")
2. **Delete Default Template**: Default becomes null (no reassignment)
3. **Deleted Account/Category**: Template fields become null (onDelete: SetNull)
4. **Set Same Template as Default**: No-op, returns success immediately
5. **Concurrent Default Updates**: Atomic via transaction
6. **Empty Template Name**: Validation error (required field)
7. **Invalid Account/Category**: Ownership verification prevents
8. **Duplicate Template**: Never copies `isDefault` status

---

## Files Created/Modified Summary

### Database
- `prisma/schema.prisma` - 3 new models + relations

### Features (Backend)
- `src/features/expense-templates/` - schemas, queries, actions
- `src/features/income-templates/` - schemas, queries, actions
- `src/features/transfer-templates/` - schemas, queries, actions
- `src/features/categories/actions.ts` - Enhanced to return data

### Components (UI)
- `src/components/forms/expense-template-form.tsx`
- `src/components/forms/income-template-form.tsx`
- `src/components/forms/transfer-template-form.tsx`
- `src/components/expenses/expense-template-button-group.tsx`
- `src/components/incomes/income-template-button-group.tsx`
- `src/components/transfers/transfer-template-button-group.tsx`
- `src/components/expenses/edit-expense-template-form.tsx`
- `src/components/incomes/edit-income-template-form.tsx`
- `src/components/transfers/edit-transfer-template-form.tsx`
- `src/components/expenses/category-combobox.tsx`
- `src/components/expenses/category-quick-create-dialog.tsx`

### Forms (Enhanced)
- `src/components/forms/expense-form.tsx` - defaultValues + CategoryCombobox
- `src/components/forms/income-form.tsx` - defaultValues + CategoryCombobox
- `src/components/forms/transfer-form.tsx` - defaultValues

### Pages (Routes)
- `src/app/(dashboard)/expenses/page.tsx` - Button Group integration
- `src/app/(dashboard)/expenses/new/page.tsx` - Query params
- `src/app/(dashboard)/expenses/templates/new/page.tsx`
- `src/app/(dashboard)/expenses/templates/[id]/edit/page.tsx`
- `src/app/(dashboard)/incomes/page.tsx` - Button Group integration
- `src/app/(dashboard)/incomes/new/page.tsx` - Query params
- `src/app/(dashboard)/incomes/templates/new/page.tsx`
- `src/app/(dashboard)/incomes/templates/[id]/edit/page.tsx`
- `src/app/(dashboard)/transfers/page.tsx` - Button Group integration
- `src/app/(dashboard)/transfers/new/page.tsx` - Query params
- `src/app/(dashboard)/transfers/templates/new/page.tsx`
- `src/app/(dashboard)/transfers/templates/[id]/edit/page.tsx`

### Total Files
- **Created**: 27 new files
- **Modified**: 9 existing files
- **Database Tables**: 3 new tables

---

## Success Metrics

✅ **All modules completed**: Expenses, Incomes, Transfers
✅ **100% feature parity** across all modules
✅ **Zero build errors**
✅ **All edge cases handled**
✅ **Full test coverage** (manual verification)
✅ **Production-ready** code quality

---

## Future Enhancements (Out of Scope)

- Template usage analytics
- Template sharing between users
- Template categories/grouping
- Recurring transactions from templates
- Template import/export
- Bulk template operations
- Template versioning
- Template favorites (beyond default)

---

## Maintenance Notes

### When Adding a New Module
To add templates to a new module, follow this pattern:

1. **Database**: Add `[Module]Template` model with standard fields
2. **Backend**: Create `src/features/[module]-templates/` with schemas, queries, actions
3. **UI**: Create form, button group, and edit components
4. **Integration**: Enhance existing form with defaultValues, add query param handling
5. **Pages**: Create new/edit template pages
6. **Verify**: Test all CRUD operations, default handling, and edge cases

### Common Issues & Solutions

**Issue**: Prisma client doesn't include new model
**Solution**: Run `pnpm prisma:generate && restart dev server`

**Issue**: Decimal serialization error
**Solution**: Use `toNumber()` before passing to Client Components

**Issue**: Select.Item empty string error
**Solution**: Use "none" value and convert to null in onChange

**Issue**: Default template not updating atomically
**Solution**: Use `prisma.$transaction()` for update operations

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [React Hook Form](https://react-hook-form.com/)
- [Zod Validation](https://zod.dev/)

---

**Document Status:** Final
**Approved By:** Implementation Complete
**Next Review:** When adding new modules or features
