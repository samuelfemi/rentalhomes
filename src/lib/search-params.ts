/**
 * URL search values as the router delivers them: strings from the URL,
 * string arrays for repeated keys, or numbers from programmatic navigation.
 * Decoding runs through the guards below so every route validator branches
 * on domain values instead of re-parsing raw input.
 */
export type RawSearchValue = string | number | string[] | undefined

export interface RawSearch {
  [key: string]: RawSearchValue
}

export function isString(value: RawSearchValue): value is string {
  return typeof value === "string"
}

function isStringArray(value: RawSearchValue): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function toFiniteNumber(value: string): number | undefined {
  const parsed = Number(value.trim())
  return Number.isFinite(parsed) ? parsed : undefined
}

/** First string in a raw search value, when one exists. */
export function rawString(value: RawSearchValue): string | undefined {
  if (isString(value)) return value
  if (isStringArray(value)) return value.find(isString)
  return undefined
}

/** Finite number from a raw search value, when one exists. */
export function rawNumber(value: RawSearchValue): number | undefined {
  if (isString(value)) return toFiniteNumber(value)
  if (isStringArray(value)) {
    const first = value.find(isString)
    return first === undefined ? undefined : toFiniteNumber(first)
  }
  return Number.isFinite(value) ? value : undefined
}

/** Digit-only string (price/bed inputs), capped at 9 digits, else undefined. */
export function rawDigits(value: RawSearchValue): string | undefined {
  const parsed = rawString(value)
  return parsed !== undefined && /^\d{1,9}$/.test(parsed) ? parsed : undefined
}
