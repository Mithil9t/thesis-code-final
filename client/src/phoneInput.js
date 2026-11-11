/** Telephone input deliberately accepts ASCII digits only (7-15 for valid submissions). */
export const PHONE_MAX_LENGTH = 15;
export const digitsOnly = value => String(value ?? '').replace(/[^0-9]/g, '').slice(0, PHONE_MAX_LENGTH);

/** A printable key must be a digit. Navigation, editing, and modifier shortcuts pass. */
export function phoneKeyAllowed(event) {
  if (event.ctrlKey || event.metaKey || event.altKey || event.key.length !== 1) return true;
  return /^[0-9]$/.test(event.key);
}

export function blockNonDigitKey(event) {
  if (!phoneKeyAllowed(event)) event.preventDefault();
}

export function blockNonDigitBeforeInput(event) {
  const inserted = event.data ?? event.nativeEvent?.data;
  if (typeof inserted === 'string' && /[^0-9]/.test(inserted)) event.preventDefault();
}

/** Preserve caret selection while removing letters/spaces from pasted text. */
export function phoneAfterPaste(existing, pasted, start, end) {
  const before = String(existing ?? '').slice(0, start);
  const after = String(existing ?? '').slice(end);
  const clean = digitsOnly(before + pasted + after);
  const caret = digitsOnly(before + pasted).length;
  return {value: clean, caret};
}
