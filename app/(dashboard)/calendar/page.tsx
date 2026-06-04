"use client";

import CalendarView from "@/components/calendar/CalendarView";
import { PageHeader } from "@/components/layout/page-header";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Calendar" 
        description="View your tasks and deadlines across the month"
      />

      <CalendarView />
    </div>
  );
}
