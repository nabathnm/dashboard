import React from "react";
import { StatCardData, StatAccent } from "../../types/dashboard";


// ─── Accent token maps ────────────────────────────────────────────────────────

const ACCENT_STYLES: Record<
  StatAccent,
  { bar: string; value: string; icon: string; meta: string }
> = {
  amber: {
    bar: "bg-amber-400",
    value: "text-amber-700 dark:text-amber-400",
    icon: "text-amber-200 dark:text-amber-900",
    meta: "text-amber-600 dark:text-amber-500",
  },
  teal: {
    bar: "bg-teal-400",
    value: "text-teal-700 dark:text-teal-400",
    icon: "text-teal-200 dark:text-teal-900",
    meta: "text-teal-600 dark:text-teal-500",
  },
  purple: {
    bar: "bg-violet-400",
    value: "text-violet-700 dark:text-violet-400",
    icon: "text-violet-200 dark:text-violet-900",
    meta: "text-violet-600 dark:text-violet-500",
  },
};

// ─── Inline SVG icon map (Tabler-style) ──────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  briefcase: (
    <>
      <path d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9z" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 13h18" />
    </>
  ),
  "git-merge": (
    <>
      <circle cx="6" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M6 8v10M6 18h6a6 6 0 0 0 6-6V8" />
    </>
  ),
  "check-list": (
    <>
      <path d="M3.5 5.5 5 7l2.5-2.5M3.5 11.5 5 13l2.5-2.5M3.5 17.5 5 19l2.5-2.5" />
      <line x1="11" y1="6" x2="20" y2="6" />
      <line x1="11" y1="12" x2="20" y2="12" />
      <line x1="11" y1="18" x2="20" y2="18" />
    </>
  ),
};

// ─── Component ────────────────────────────────────────────────────────────────

interface StatCardProps {
  data: StatCardData;
}

const StatCard: React.FC<StatCardProps> = ({ data }) => {
  const { label, value, meta, icon, accent } = data;
  const styles = ACCENT_STYLES[accent];

  return (
    <div className="relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4">
      {/* top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${styles.bar}`} />

      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1.5">
        {label}
      </p>

      <p className={`text-3xl font-medium leading-none ${styles.value}`}>
        {value}
      </p>

      <p className={`mt-2 text-[11px] flex items-center gap-1 ${styles.meta}`}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
        {meta}
      </p>

      {/* decorative background icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="56"
        height="56"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`absolute bottom-2 right-3 opacity-10 ${styles.icon}`}
        aria-hidden="true"
      >
        {ICON_PATHS[icon]}
      </svg>
    </div>
  );
};

export default StatCard;