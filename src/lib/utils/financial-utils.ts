/**
 * Project Sentinel - Financial Utilities
 * Purpose: Formats integer cents into display currency (R xxx.xx)
 * Dependencies: None
 * Structural Role: Presentation layer formatter for financial values
 */

export function formatCurrency(cents: number): string {
  const amount = cents / 100;
  return `R ${amount.toFixed(2)}`;
}

export function formatCurrencyCompact(cents: number): string {
  const amount = cents / 100;
  if (amount >= 1_000_000) {
    return `R ${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `R ${(amount / 1_000).toFixed(1)}K`;
  }
  return formatCurrency(cents);
}
