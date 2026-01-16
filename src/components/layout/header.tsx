"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Menu,
  Moon,
  Sun,
  LogOut,
  Home,
  Wallet,
  Tags,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/accounts", label: "Accounts", icon: Wallet },
  { href: "/categories", label: "Categories", icon: Tags },
  { href: "/incomes", label: "Incomes", icon: TrendingUp },
  { href: "/expenses", label: "Expenses", icon: TrendingDown },
  { href: "/transfers", label: "Transfers", icon: ArrowLeftRight },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

type HeaderProps = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export function Header({ isSidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const pathname = usePathname();

  const user = session?.user;

  const getInitials = (name: string | null | undefined, email: string | null | undefined) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/";
        },
      },
    });
  };

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64">
              <SheetHeader>
                <SheetTitle className="text-left">Finance Tracker</SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col space-y-1">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <Button
            variant="ghost"
            size="icon"
            className="hidden md:inline-flex"
            onClick={onToggleSidebar}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isSidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            ) : (
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            )}
          </Button>

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-lg font-bold">Finance Tracker</span>
          </Link>
        </div>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full"
              aria-label="User menu"
            >
              <Avatar className="h-9 w-9">
                <AvatarImage
                  src={user?.image ?? undefined}
                  alt={user?.name ?? "User"}
                />
                <AvatarFallback>
                  {getInitials(user?.name, user?.email)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                {user?.name && (
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                )}
                {user?.email && (
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              role="menuitem"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? (
                <>
                  <Sun className="mr-2 h-4 w-4" aria-hidden="true" />
                  Light mode
                </>
              ) : (
                <>
                  <Moon className="mr-2 h-4 w-4" aria-hidden="true" />
                  Dark mode
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              role="menuitem"
              aria-label="Sign out"
            >
              <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
