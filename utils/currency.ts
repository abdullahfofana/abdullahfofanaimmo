/**
 * Currency utilities for Côte d'Ivoire real estate (XOF / FCFA)
 * Official currency: West African CFA franc (FCFA / XOF)
 */

/**
 * Formats a price into compact form for map markers and pills.
 * Examples:
 *   653,000,000 -> "653M FCFA"
 *   1,250,000,000 -> "1.3 Mrd FCFA"
 *   489,000,000 -> "489M FCFA"
 *   850,000 -> "850k FCFA"
 */
export function formatPriceCompact(price: number | string | null | undefined): string {
  if (price == null) return '0 FCFA';
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return '0 FCFA';

  if (num >= 1_000_000_000) {
    const billions = num / 1_000_000_000;
    return `${billions % 1 === 0 ? billions.toFixed(0) : billions.toFixed(1)} Mrd FCFA`;
  }
  if (num >= 1_000_000) {
    const millions = num / 1_000_000;
    return `${millions % 1 === 0 ? millions.toFixed(0) : millions.toFixed(1)}M FCFA`;
  }
  if (num >= 1_000) {
    const thousands = num / 1_000;
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(0)}k FCFA`;
  }
  return `${num.toLocaleString('fr-FR')} FCFA`;
}

/**
 * Formats full price with standard French space thousands separators.
 * Example: 653000000 -> "653 000 000 FCFA"
 */
export function formatPriceFull(price: number | string | null | undefined, currency: string = 'FCFA'): string {
  if (price == null) return `0 ${currency}`;
  const num = typeof price === 'string' ? parseFloat(price) : price;
  if (isNaN(num)) return `0 ${currency}`;

  const formatted = Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formatted} ${currency}`;
}
