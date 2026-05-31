"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import CommandSearch from "./command-search";

const routeLabels: Record<string, string> = {
  dashboard: "Dashboard",
  transactions: "Transactions",
  accounts: "Accounts",
  "shared-expenses": "Shared Expenses",
  analytics: "Analytics",
  "ai-evaluation": "AI Evaluation",
  settings: "Settings",
};

export default function TopNav() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border/50 px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />

      <Breadcrumb className="flex-1">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard" className="text-xs text-muted-foreground hover:text-foreground">
              GrowthMe
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const label = routeLabels[segment] || segment;
            const isLast = index === segments.length - 1;
            const href = "/" + segments.slice(0, index + 1).join("/");

            return (
              <React.Fragment key={segment}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {isLast ? (
                    <BreadcrumbPage className="text-xs font-medium">
                      {label}
                    </BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={href} className="text-xs text-muted-foreground hover:text-foreground">
                      {label}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <CommandSearch />
    </header>
  );
}
