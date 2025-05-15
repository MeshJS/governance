/**
 * Formats a lovelace value to ADA with appropriate decimal places
 * @param value The value in lovelace (1 ADA = 1,000,000 lovelace)
 * @returns Formatted string with ADA symbol
 */
export function formatLovelace(value: number): string {
    const ada = value / 1_000_000;
    return `${ada.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} ₳`;
} 