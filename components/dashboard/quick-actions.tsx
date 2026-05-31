"use client";

import Link from "next/link";
import { Plus, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const actions = [
  {
    label: "Add Expense",
    href: "/transactions?action=add&type=expense",
    icon: ArrowUpRight,
    gradient: "from-rose-600 to-pink-600",
    shadow: "shadow-rose-500/20",
  },
  {
    label: "Add Income",
    href: "/transactions?action=add&type=income",
    icon: ArrowDownLeft,
    gradient: "from-emerald-600 to-teal-600",
    shadow: "shadow-emerald-500/20",
  },
  {
    label: "Transfer",
    href: "/transactions?action=add&type=transfer",
    icon: ArrowLeftRight,
    gradient: "from-blue-600 to-cyan-600",
    shadow: "shadow-blue-500/20",
  },
  {
    label: "Shared Expense",
    href: "/shared-expenses?action=add",
    icon: Users,
    gradient: "from-amber-600 to-orange-600",
    shadow: "shadow-amber-500/20",
  },
];

export default function QuickActions() {
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((action) => (
        <Button
          key={action.label}
          asChild
          size="sm"
          className={`bg-gradient-to-r ${action.gradient} hover:opacity-90 shadow-lg ${action.shadow} text-white border-0 h-9`}
        >
          <Link href={action.href}>
            <action.icon className="mr-1.5 h-3.5 w-3.5" />
            {action.label}
          </Link>
        </Button>
      ))}
    </div>
  );
}
