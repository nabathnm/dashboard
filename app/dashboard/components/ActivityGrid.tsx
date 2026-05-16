import React from "react";
import type { QuickLink, LinkVariant } from "../../types/dashboard";

// ─── Variant styles ───────────────────────────────────────────────────────────

const VARIANT_STYLES: Record<LinkVariant, string> = {
  notion:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  github:
    "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  figma:
    "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  linear:
    "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  default:
    "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

// ─── Tabler-style SVG icons ───────────────────────────────────────────────────

const ICON_PATHS: Record<string, React.ReactNode> = {
  "file-text": (
    <>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <polyline points="14 3 14 9 20 9" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </>
  ),
  notebook: (
    <>
      <path d="M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
      <line x1="10" y1="4" x2="10" y2="20" />
      <line x1="7" y1="9" x2="9" y2="9" />
      <line x1="7" y1="13" x2="9" y2="13" />
    </>
  ),
  "brand-github": (
    <path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.5 2.8 5.4 3.1 5.4 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
  ),
  "brand-figma": (
    <>
      <circle cx="15" cy="12" r="3" />
      <rect x="6" y="3" width="6" height="6" rx="3" />
      <rect x="6" y="9" width="6" height="6" rx="3" />
      <rect x="6" y="15" width="6" height="6" rx="3" />
      <path d="M12 6h3a3 3 0 0 1 0 6h-3" />
    </>
  ),
};

// ─── Sub-component: single link row ──────────────────────────────────────────

interface QuickLinkItemProps {
  link: QuickLink;
}

const QuickLinkItem: React.FC<QuickLinkItemProps> = ({ link }) => {
  const iconStyle = VARIANT_STYLES[link.variant];

  return (
    <a
      href={link.href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-none hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors no-underline"
    >
      {/* icon box */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${iconStyle}`}
        aria-hidden="true"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {ICON_PATHS[link.icon] ?? <circle cx="12" cy="12" r="5" />}
        </svg>
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-800 dark:text-zinc-100 leading-none mb-0.5 truncate">
          {link.name}
        </p>
        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-none truncate">
          {link.description}
        </p>
      </div>

      {/* external arrow */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-300 dark:text-zinc-600 flex-shrink-0"
        aria-hidden="true"
      >
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
    </a>
  );
};

// ─── QuickLinks ───────────────────────────────────────────────────────────────

interface QuickLinksProps {
  links: QuickLink[];
}

const QuickLinks: React.FC<QuickLinksProps> = ({ links }) => (
  <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden">
    {/* header */}
    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
      <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
        Quick links
      </h2>
    </div>

    {links.map((link) => (
      <QuickLinkItem key={link.id} link={link} />
    ))}
  </div>
);

export default QuickLinks;