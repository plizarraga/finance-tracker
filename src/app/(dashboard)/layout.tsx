"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <Sidebar isCollapsed={isSidebarCollapsed} />
      <main
        className={cn(
          "pb-16 md:pb-0 transition-[margin] duration-200",
          isSidebarCollapsed ? "md:ml-16" : "md:ml-64"
        )}
      >
        <div className="container mx-auto p-4 md:p-6">{children}</div>
      </main>
      <MobileNav />
    </div>
  );
}
