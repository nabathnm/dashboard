"use client";

import React, { useState } from "react";
import { TaskTag, Task } from "../../types/dashboard";

// ─── Tag styles ───────────────────────────────────────────────────────────────

const TAG_STYLES: Record<TaskTag, string> = {
  design: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  dev: "bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  review: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  bug: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300",
  docs: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle }) => (
  <li
    className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-colors"
    onClick={() => onToggle(task.id)}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => e.key === "Enter" && onToggle(task.id)}
    aria-pressed={task.done}
  >
    {/* checkbox */}
    <div
      className={`w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${task.done
        ? "bg-teal-500 border-teal-500"
        : "border-zinc-300 dark:border-zinc-600"
        }`}
      aria-hidden="true"
    >
      {task.done && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="9"
          height="9"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      )}
    </div>

    {/* text */}
    <span
      className={`flex-1 text-sm ${task.done
        ? "line-through text-zinc-400 dark:text-zinc-600"
        : "text-zinc-700 dark:text-zinc-200"
        }`}
    >
      {task.text}
    </span>

    {/* tag */}
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide ${TAG_STYLES[task.tag]}`}
    >
      {task.tag}
    </span>
  </li>
);

// ─── TaskList ─────────────────────────────────────────────────────────────────

interface TaskListProps {
  initialTasks: Task[];
}

const TaskList: React.FC<TaskListProps> = ({ initialTasks }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const toggle = (id: number) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const pending = tasks.filter((t) => !t.done).length;

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
        <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3.5 5.5 5 7l2.5-2.5M3.5 11.5 5 13l2.5-2.5M3.5 17.5 5 19l2.5-2.5" />
            <line x1="11" y1="6" x2="20" y2="6" />
            <line x1="11" y1="12" x2="20" y2="12" />
            <line x1="11" y1="18" x2="20" y2="18" />
          </svg>
          Task list
        </h2>
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
          {pending} pending
        </span>
      </div>

      {/* list */}
      <ul>
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} onToggle={toggle} />
        ))}
      </ul>
    </div>
  );
};

export default TaskList;