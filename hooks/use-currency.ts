import { useCallback } from "react";

/**
 * Format a number as Indonesian Rupiah (IDR)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format a compact currency (e.g., Rp1.2jt)
 */
export function formatCompactCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `Rp${(amount / 1_000_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000_000) {
    return `Rp${(amount / 1_000_000).toFixed(1)}jt`;
  }
  if (amount >= 1_000) {
    return `Rp${(amount / 1_000).toFixed(1)}rb`;
  }
  return `Rp${amount}`;
}

export function useCurrency() {
  const format = useCallback((amount: number) => formatCurrency(amount), []);
  const formatCompact = useCallback(
    (amount: number) => formatCompactCurrency(amount),
    []
  );

  return { format, formatCompact };
}
