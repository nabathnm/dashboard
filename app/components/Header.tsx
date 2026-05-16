import React from "react";

interface HeaderProps {
  name?: string;
}

const Header: React.FC<HeaderProps> = ({ name = "Arif" }) => {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
  <div className="flex justify-between items-start mb-6">
    <div>
      <h1 className="font-display text-3xl font-normal leading-tight text-zinc-900 dark:text-zinc-100">
        Dashboard
      </h1>
    </div>

    <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5">
      {/* calendar icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="5" width="16" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M4 11h16" />
      </svg>
      <span>{today}</span>
    </div>
  </div>
);
};

export default Header;