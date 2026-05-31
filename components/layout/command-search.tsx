"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Users,
  BarChart3,
  Brain,
  Settings,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";

const pages = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Shared Expenses", href: "/shared-expenses", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "AI Evaluation", href: "/ai-evaluation", icon: Brain },
  { name: "Settings", href: "/settings", icon: Settings },
];

const quickActions = [
  { name: "Add Expense", href: "/transactions?action=add&type=expense", icon: ArrowUpRight },
  { name: "Add Income", href: "/transactions?action=add&type=income", icon: ArrowDownLeft },
  { name: "Transfer Money", href: "/transactions?action=add&type=transfer", icon: ArrowLeftRight },
  { name: "New Account", href: "/accounts?action=add", icon: Plus },
  { name: "New Shared Expense", href: "/shared-expenses?action=add", icon: Users },
];

export default function CommandSearch() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleSelect = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="relative h-8 w-48 justify-start rounded-lg bg-muted/50 text-xs text-muted-foreground hover:bg-muted"
      >
        <Search className="mr-2 h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 hidden h-5 select-none items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium sm:flex">
          ⌘K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Navigation">
            {pages.map((page) => (
              <CommandItem
                key={page.href}
                onSelect={() => handleSelect(page.href)}
                className="cursor-pointer"
              >
                <page.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {page.name}
              </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Quick Actions">
            {quickActions.map((action) => (
              <CommandItem
                key={action.href}
                onSelect={() => handleSelect(action.href)}
                className="cursor-pointer"
              >
                <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                {action.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
