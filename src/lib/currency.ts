/**
 * Currency Formatting Utilities
 * European format: 1 234,56 € (space as thousands separator, comma as decimal)
 */

/**
 * Format a number as currency in European format
 * @param amount - The amount to format
 * @param currency - Currency code (default: EUR)
 * @param locale - Locale (default: fr-FR)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  currency: string = 'EUR',
  locale: string = 'fr-FR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a number with European separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  decimals: number = 2
): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format a large number with abbreviations (K, M, B)
 * @param value - The number to format
 * @returns Formatted string with abbreviation
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} Md`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace('.', ',')} M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace('.', ',')} K`
  }
  return formatNumber(value, 0)
}

/**
 * Format price per unit (e.g., for pricing tables)
 * @param amount - The price amount
 * @param period - Billing period (month, year, etc.)
 * @returns Formatted price string
 */
export function formatPrice(
  amount: number,
  period: 'month' | 'year' | 'session' = 'month'
): string {
  const formatted = formatCurrency(amount)
  
  const periodLabels = {
    month: '/mois',
    year: '/an',
    session: '/session',
  }
  
  return `${formatted}${periodLabels[period]}`
}

/**
 * Parse European formatted number string to number
 * @param value - String like "1 234,56"
 * @returns Number
 */
export function parseEuropeanNumber(value: string): number {
  // Remove spaces and replace comma with dot
  const normalized = value.replace(/\s/g, '').replace(',', '.')
  return parseFloat(normalized) || 0
}

/**
 * Format percentage in European format
 * @param value - The percentage value (0-100)
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercent(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)} %`
}
