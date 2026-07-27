/**
 * Turns database enum values into text meant for players.
 *
 * The UI had ~18 ad-hoc `replace('_', ' ')` calls, which only strip the first underscore
 * and leave the value shouting in caps. Routing them through here keeps every screen
 * spelling a value the same way.
 */

const ROMAN_NUMERALS = new Set(['I', 'II', 'III', 'IV', 'V']);

/** Words that read better left uppercase. */
const ACRONYMS = new Set(['IPO', 'CEO', 'ETF']);

function formatWord(word: string): string {
  const upper = word.toUpperCase();
  if (ROMAN_NUMERALS.has(upper) || ACRONYMS.has(upper)) {
    return upper;
  }
  return upper.charAt(0) + word.slice(1).toLowerCase();
}

/**
 * `CONSUMER_DISCRETIONARY` becomes `Consumer Discretionary`, `FACTORY_II` becomes
 * `Factory II`. Already-formatted strings pass through unchanged.
 */
export function formatEnumLabel(
  value: string | null | undefined,
  fallback = ''
): string {
  if (!value) {
    return fallback;
  }
  return value.split('_').filter(Boolean).map(formatWord).join(' ');
}

/** Short sector label for tight spaces: `Consumer Discretionary` becomes `C. Discretionary`. */
export function formatSectorLabelShort(
  value: string | null | undefined,
  fallback = ''
): string {
  return formatEnumLabel(value, fallback).replace(/^Consumer /, 'C. ');
}
