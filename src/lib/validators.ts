// Each validator returns an error message, or null when the value is valid.

export function required(value: string, label: string): string | null {
  return value.trim() ? null : `${label} is required.`;
}

export function email(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return "Email is required.";
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    ? null
    : "Enter a valid email address.";
}

// Mirrors the backend's Identity rules: 8+ characters with upper, lower,
// digit and a symbol.
export function password(value: string): string | null {
  if (!value) {
    return "Password is required.";
  }
  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (!/[a-z]/.test(value) || !/[A-Z]/.test(value)) {
    return "Password needs an uppercase and a lowercase letter.";
  }
  if (!/\d/.test(value)) {
    return "Password needs at least one number.";
  }
  if (!/[^A-Za-z0-9]/.test(value)) {
    return "Password needs at least one symbol.";
  }
  return null;
}

// Canadian postal code, e.g. "M5V 2T6" or "M5V2T6".
export function canadianPostalCode(value: string): string | null {
  if (!value.trim()) {
    return "Postal code is required.";
  }
  return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(value.trim())
    ? null
    : "Enter a valid postal code (e.g. M5V 2T6).";
}

interface NumberOptions {
  min?: number;
  integer?: boolean;
}

export function number(
  value: string,
  label: string,
  { min = 0, integer = false }: NumberOptions = {},
): string | null {
  if (!value.trim()) {
    return `${label} is required.`;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return `${label} must be a number.`;
  }
  if (integer && !Number.isInteger(parsed)) {
    return `${label} must be a whole number.`;
  }
  if (parsed < min) {
    return min === 0
      ? `${label} can't be negative.`
      : `${label} must be at least ${min}.`;
  }
  return null;
}

export function chosen(
  value: number | string | null,
  label: string,
): string | null {
  return value === null || value === "" ? `Select a ${label}.` : null;
}

export function exactDigits(value: string, length: number): string | null {
  return new RegExp(`^\d{${length}}$`).test(value.trim())
    ? null
    : `Enter the ${length}-digit code.`;
}
