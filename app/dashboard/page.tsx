import React from "react";


import {
  STAT_CARDS,
  INITIAL_TASKS,
  QUICK_LINKS,
  CALENDAR_EVENTS,
  ACTIVITY_LEVELS,
} from "../data/mockData";
import DashboardHeader from "../components/Header";
import ActivityGrid from "./components/ActivityGrid";
import QuickLinks from "./components/QuickLinks";
import StatCard from "./components/StatCrad";
import TaskList from "./components/TaskList";

const DashboardPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <DashboardHeader />

        {/* ── Stat Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {STAT_CARDS.map((card) => (
            <StatCard key={card.label} data={card} />
          ))}
        </div>

        {/* ── Main Layout: left column + right sidebar ────────────────────── */}
        <div className="grid grid-cols-[1fr_260px] gap-4">
          {/* Left */}
          <div className="flex flex-col gap-4">
            <TaskList initialTasks={INITIAL_TASKS} />
            {/* <ActivityGrid
              label="Commit activity — May 2026"
            /> */}
          </div>

          {/* Right */}
          <div className="flex flex-col gap-4">
            {/* <Calendar levels={ACTIVITY_LEVELS} year={2026} month={4} /> */}
            <QuickLinks links={QUICK_LINKS} />
          </div>
        </div>
      </div>
    </main>
  );
};

export default DashboardPage;