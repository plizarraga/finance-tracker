"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AccountQuickCreateDialog } from "./account-quick-create-dialog";

export interface AccountOption {
  id: string;
  name: string;
}

interface AccountComboboxProps {
  accounts: AccountOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  searchPlaceholder?: string;
  allowCreate?: boolean;
  includeAllOption?: boolean;
  allLabel?: string;
}

export function AccountCombobox({
  accounts,
  value,
  onValueChange,
  disabled,
  placeholder = "Select an account",
  searchPlaceholder = "Search account...",
  allowCreate = true,
  includeAllOption = false,
  allLabel = "All accounts",
}: AccountComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [localAccounts, setLocalAccounts] = React.useState(accounts);

  // Keep localAccounts in sync with accounts prop
  React.useEffect(() => {
    setLocalAccounts(accounts);
  }, [accounts]);

  const selectedAccount = value
    ? localAccounts.find((acc) => acc.id === value)
    : undefined;

  const handleAccountCreated = (accountId: string, accountName: string) => {
    setLocalAccounts([...localAccounts, { id: accountId, name: accountName }]);
    onValueChange(accountId);
    setOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={disabled}
          >
            {selectedAccount ? selectedAccount.name : includeAllOption ? allLabel : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList>
              <CommandEmpty>No account found.</CommandEmpty>
              <CommandGroup>
                {includeAllOption && (
                  <CommandItem
                    value={allLabel}
                    onSelect={() => {
                      onValueChange("");
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "" ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {allLabel}
                  </CommandItem>
                )}
                {localAccounts.map((account) => (
                  <CommandItem
                    key={account.id}
                    value={account.name}
                    onSelect={() => {
                      onValueChange(account.id);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === account.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {account.name}
                  </CommandItem>
                ))}
              </CommandGroup>
              {allowCreate && (
                <>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setOpen(false);
                        setDialogOpen(true);
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Account
                    </CommandItem>
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {allowCreate && (
        <AccountQuickCreateDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onAccountCreated={handleAccountCreated}
        />
      )}
    </>
  );
}
